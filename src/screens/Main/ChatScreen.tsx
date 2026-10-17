import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Message, RootStackParamList } from '../../types';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { MessageBubble } from '../../components/MessageBubble';
import { DaySeparator } from '../../components/DaySeparator';
import { TypingIndicator } from '../../components/TypingIndicator';
import { Icon } from '../../components/Icon';
import { getDaySeparatorLabel, formatLastSeen } from '../../utils/dateUtils';
import { strings } from '../../strings';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const PAGE_SIZE = 50;

export const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, title, otherUser } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(otherUser.last_seen);
  const [isMuted, setIsMuted] = useState(false);

  const typingTimeoutRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  const mergeMessages = useCallback((newMsgs: Message[]) => {
    setMessages((prev) => {
      const map = new Map<string, Message>();
      prev.forEach((m) => map.set(m.id, m));
      newMsgs.forEach((m) => {
        map.set(m.id, m);
      });
      return [...map.values()].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, []);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    try {
      await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
    } catch (e) {
      // Ignore
    }
  }, [conversationId]);

  const fetchInitialMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (!error && data) {
      setMessages(data as Message[]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    }
    setLoading(false);
    markAsRead();
  }, [conversationId, markAsRead]);

  const fetchOlderMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    const oldest = messages[messages.length - 1];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (!error && data) {
      if (data.length < PAGE_SIZE) setHasMore(false);
      mergeMessages(data as Message[]);
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchInitialMessages();

    // Clean up any existing channel with this topic before creating a new one
    const existing = supabase
      .getChannels()
      .find((ch) => ch.topic === `realtime:room-${conversationId}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const roomChannel = supabase.channel(`room-${conversationId}`, {
      config: { presence: { key: user?.id } },
    });

    roomChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            mergeMessages([newMsg]);
            if (newMsg.sender_id !== user?.id) {
              markAsRead();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message;
            mergeMessages([updatedMsg]);
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = roomChannel.presenceState();
        const isOnline = Boolean(presenceState[otherUser.id]);
        setIsOtherUserOnline(isOnline);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.user_id === otherUser.id) {
          setIsOtherUserTyping(payload.payload.isTyping);
        }
      });

    roomChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        roomChannel.track({ user_id: user?.id, online_at: new Date().toISOString() });
      }
    });

    channelRef.current = roomChannel;

    supabase
      .from('profiles')
      .select('last_seen, avatar_url, display_name')
      .eq('id', otherUser.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setOtherUserLastSeen(data.last_seen);
        }
      });

    supabase
      .from('conversation_members')
      .select('muted_until')
      .eq('conversation_id', conversationId)
      .eq('user_id', user?.id)
      .single()
      .then(({ data }) => {
        if (data?.muted_until && new Date(data.muted_until) > new Date()) {
          setIsMuted(true);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user?.id, otherUser.id, fetchInitialMessages, mergeMessages, markAsRead]);

  const handleTextChange = (val: string) => {
    setText(val);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user?.id, isTyping: val.length > 0 },
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: user?.id, isTyping: false },
        });
      }
    }, 2000);
  };

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || !user?.id) return;

    setText('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      status: 'sent',
      deleted_for_everyone: false,
      deleted_by_users: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isOptimistic: true,
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        });

      if (error) {
        console.warn('Message insert error:', error);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, isOptimistic: false, isFailed: true } : m))
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        fetchInitialMessages();
      }
    } catch (e) {
      console.warn('Message send exception:', e);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isOptimistic: false, isFailed: true } : m))
      );
    }
  };

  const retrySend = async (failedMsg: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, isFailed: false, isOptimistic: true } : m))
    );

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          content: failedMsg.content,
        });

      if (error) {
        console.warn('Message retry error:', error);
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? { ...m, isOptimistic: false, isFailed: true } : m))
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
        fetchInitialMessages();
      }
    } catch (e) {
      console.warn('Message retry exception:', e);
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, isOptimistic: false, isFailed: true } : m))
      );
    }
  };

  const handleDeleteMessage = async (messageId: string, forEveryone: boolean) => {
    if (forEveryone) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted_for_everyone: true } : m))
      );
      await supabase
        .from('messages')
        .update({ deleted_for_everyone: true })
        .eq('id', messageId);
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      if (user?.id) {
        const target = messages.find((m) => m.id === messageId);
        const newArray = target ? [...(target.deleted_by_users || []), user.id] : [user.id];
        await supabase
          .from('messages')
          .update({ deleted_by_users: newArray })
          .eq('id', messageId);
      }
    }
  };

  const handleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      supabase.from('conversation_members').update({ muted_until: null }).eq('conversation_id', conversationId).eq('user_id', user?.id).then();
    } else {
      Alert.alert(
        strings.notifications.muteChat,
        '',
        [
          { text: strings.notifications.mute8Hours, onPress: () => muteFor(8) },
          { text: strings.notifications.mute1Week, onPress: () => muteFor(24 * 7) },
          { text: strings.notifications.muteAlways, onPress: () => muteFor(24 * 365 * 100) },
          { text: strings.general.cancel, style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const muteFor = async (hours: number) => {
    setIsMuted(true);
    const date = new Date();
    date.setHours(date.getHours() + hours);
    await supabase.from('conversation_members').update({ muted_until: date.toISOString() }).eq('conversation_id', conversationId).eq('user_id', user?.id);
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.sender_id === user?.id;

    const olderMsg = messages[index + 1];

    const currentDay = getDaySeparatorLabel(item.created_at);
    const olderDay = olderMsg ? getDaySeparatorLabel(olderMsg.created_at) : null;
    const showDaySeparator = !olderMsg || currentDay !== olderDay;

    const isFirstInGroup = showDaySeparator || !olderMsg || olderMsg.sender_id !== item.sender_id;

    return (
      <View>
        {showDaySeparator && <DaySeparator label={currentDay} />}
        <MessageBubble
          message={item}
          isMine={isMine}
          isFirstInGroup={isFirstInGroup}
          onDeleteMessage={handleDeleteMessage}
          onRetrySend={retrySend}
        />
      </View>
    );
  };

  const statusSubtext = isOtherUserTyping
    ? strings.chatScreen.typing
    : isOtherUserOnline
    ? strings.chatScreen.online
    : formatLastSeen(otherUserLastSeen);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.line,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Icon name="back" size={24} color={theme.colors.ink} />
        </Pressable>

        <View style={styles.headerTitleRow}>
          <Avatar
            name={title}
            avatarUrl={otherUser.avatar_url}
            size={40}
            isOnline={isOtherUserOnline}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.headerTitleText, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
              {title}
            </Text>
            <Text
              style={[
                styles.headerSubText,
                {
                  color: isOtherUserTyping ? theme.colors.accent : theme.colors.muted,
                  fontFamily: theme.fonts.body,
                },
              ]}
            >
              {statusSubtext}
            </Text>
          </View>
        </View>

        <Pressable onPress={handleMute} hitSlop={12} style={styles.headerActionBtn}>
          <Icon name={isMuted ? 'eye-off' : 'bell'} size={22} color={theme.colors.ink} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={fetchOlderMessages}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 10 }}>
                <ActivityIndicator color={theme.colors.accent} size="small" />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
                {strings.chatScreen.emptyTitle}
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.muted, fontFamily: theme.fonts.body }]}>
                {strings.chatScreen.emptySub}
              </Text>
            </View>
          }
        />
      )}

      {isOtherUserTyping && <TypingIndicator username={title} />}

      <View
        style={[
          styles.composerWrap,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.line,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
          placeholder={strings.chatScreen.composerPlaceholder}
          placeholderTextColor={theme.colors.muted}
          style={[
            styles.composerInput,
            {
              backgroundColor: theme.colors.bg,
              borderColor: theme.colors.line,
              color: theme.colors.ink,
              fontFamily: theme.fonts.body,
              borderRadius: theme.radius,
            },
          ]}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!text.trim()}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: 14,
              opacity: !text.trim() ? 0.4 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Icon name="send" size={20} color={theme.colors.textOnAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerSubText: {
    fontSize: 12.5,
    marginTop: 1,
  },
  headerActionBtn: {
    padding: 8,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
  },
  emptySub: {
    fontSize: 14,
    marginTop: 4,
  },
  composerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  composerInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 130,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  sendBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
