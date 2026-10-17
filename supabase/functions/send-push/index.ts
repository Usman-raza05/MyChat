import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { JWT } from "https://esm.sh/google-auth-library@8.7.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
const firebaseServiceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}");

serve(async (req) => {
  if (req.headers.get("webhook-secret") !== webhookSecret) return new Response("Unauthorized", { status: 401 });

  const payload = await req.json();
  const message = payload.record;
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: sender } = await supabase.from("profiles").select("display_name").eq("id", message.sender_id).single();
  const { data: members } = await supabase.from("conversation_members")
    .select("user_id, profiles(show_preview)")
    .eq("conversation_id", message.conversation_id)
    .neq("user_id", message.sender_id)
    .or(`muted_until.is.null,muted_until.lt.${new Date().toISOString()}`);

  if (!members || members.length === 0) return new Response("No targets", { status: 200 });

  const targetUserIds = members.map(m => m.user_id);
  const { data: tokens } = await supabase.from("device_tokens").select("token, user_id").in("user_id", targetUserIds);

  if (!tokens || tokens.length === 0) return new Response("No tokens", { status: 200 });

  const jwtClient = new JWT({
    email: firebaseServiceAccount.client_email,
    key: firebaseServiceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const { token: accessToken } = await jwtClient.getAccessToken();

  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${firebaseServiceAccount.project_id}/messages:send`;
  const invalidTokens: string[] = [];

  for (const t of tokens) {
    const member = members.find(m => m.user_id === t.user_id);
    const profiles = member?.profiles;
    const showPreview = Array.isArray(profiles) ? profiles[0]?.show_preview : profiles?.show_preview ?? true;

    let text = message.content || "New message";
    if (!showPreview) text = "New message";
    if (text.length > 100) text = text.substring(0, 97) + "...";

    const notification = {
      message: {
        token: t.token,
        notification: { title: sender?.display_name || "New message", body: text },
        data: { conversation_id: message.conversation_id, message_id: message.id, sender_name: sender?.display_name || "User" },
        android: {
          priority: "HIGH",
          collapse_key: message.conversation_id,
          notification: { channel_id: "messages_v2", sound: "default" }
        }
      }
    };

    const res = await fetch(fcmUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(notification)
    });

    const resData = await res.json();
    if (resData.error && (resData.error.status === "UNREGISTERED" || resData.error.status === "INVALID_ARGUMENT")) {
      invalidTokens.push(t.token);
    }
  }

  if (invalidTokens.length > 0) await supabase.from("device_tokens").delete().in("token", invalidTokens);
  return new Response("Sent", { status: 200 });
});