export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  about: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message_text: string | null;
  other_user?: Profile;
  unread_count?: number;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  deleted_for_everyone: boolean;
  deleted_by_users: string[];
  created_at: string;
  updated_at: string;
  isOptimistic?: boolean;
  isFailed?: boolean;
}

export type RootStackParamList = {
  AuthLoading: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Chat: { conversationId: string; title: string; otherUser: Profile };
  NewChat: undefined;
  EditProfile: undefined;
};
