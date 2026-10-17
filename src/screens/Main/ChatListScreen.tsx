import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Conversation, Profile, RootStackParamList } from '../../types';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { formatChatListDate } from '../../utils/dateUtils';
import { strings } from '../../strings';

interface ChatListScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: memberRows, error: memErr } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (memErr || !memberRows || memberRows.length === 0) {
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const convIds = memberRows.map((m) => m.conversation_id);
      const lastReadMap = new Map<string, string>(
        memberRows.map((m) => [m.conversation_id, m.last_read_at])
      );

      const { data: convs, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('last_message_at', { ascending: false });

      if (convErr || !convs) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: allMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id, profiles(*)')
        .in('conversation_id', convIds)
        .neq('user_id', user.id);

      const otherUserMap = new Map<string, Profile>();
      if (allMembers) {
        allMembers.forEach((m) => {
          if (m.profiles) {
            otherUserMap.set(m.conversation_id, m.profiles as unknown as Profile);
          }
        });
      }

      const enriched: Conversation[] = await Promise.all(
        convs.map(async (c) => {
          const lastRead = lastReadMap.get(c.id) || new Date(0).toISOString();
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', user.id)
            .gt('created_at', lastRead);

          return {
            ...c,
            other_user: otherUserMap.get(c.id),
            unread_count: count || 0,
          };
        })
      );

      setConversations(enriched);
    } catch (e) {
      console.warn('Error loading conversations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('chat-list-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  // Listen for typing events across all user conversations
  const convKey = conversations.map((c) => c.id).join(',');
  useEffect(() => {
    if (conversations.length === 0 || !user?.id) return;

    const channels = conversations.map((conv) => {
      return supabase
        .channel(`room-${conv.id}`)
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload?.user_id !== user.id) {
            const isTyping = Boolean(payload.payload?.isTyping);
            setTypingMap((prev) => ({ ...prev, [conv.id]: isTyping }));
          }
        })
        .subscribe();
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [convKey, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherUser = item.other_user;
    const displayName = otherUser?.display_name || otherUser?.username || 'Unknown User';
    const dateStr = formatChatListDate(item.last_message_at);
    const hasUnread = Boolean(item.unread_count && item.unread_count > 0);
    const isTyping = Boolean(typingMap[item.id]);

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            title: displayName,
            otherUser: otherUser || {
              id: '',
              username: 'unknown',
              display_name: displayName,
              avatar_url: null,
              about: null,
              last_seen: null,
              created_at: '',
            },
          })
        }
        style={({ pressed }) => [
          styles.itemRow,
          {
            backgroundColor: pressed ? theme.colors.bg : theme.colors.surface,
            borderBottomColor: theme.colors.line,
          },
        ]}
      >
        <Avatar
          name={displayName}
          avatarUrl={otherUser?.avatar_url}
          size={46}
        />

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text
              numberOfLines={1}
              style={[
                styles.nameText,
                {
                  color: theme.colors.ink,
                  fontFamily: theme.fonts.bodySemiBold,
                },
              ]}
            >
              {displayName}
            </Text>
            <Text
              style={[
                styles.timeText,
                {
                  color: isTyping || hasUnread ? theme.colors.accent : theme.colors.muted,
                  fontFamily: hasUnread ? theme.fonts.bodySemiBold : theme.fonts.body,
                },
              ]}
            >
              {dateStr}
            </Text>
          </View>

          <View style={styles.itemSubRow}>
            {isTyping ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.msgText,
                  {
                    color: theme.colors.accent,
                    fontFamily: theme.fonts.bodySemiBold,
                    fontStyle: 'italic',
                  },
                ]}
              >
                {strings.chatScreen.typing}
              </Text>
            ) : (
              <Text
                numberOfLines={1}
                style={[
                  styles.msgText,
                  {
                    color: hasUnread ? theme.colors.ink : theme.colors.muted,
                    fontFamily: hasUnread ? theme.fonts.bodySemiBold : theme.fonts.body,
                  },
                ]}
              >
                {item.last_message_text || strings.chatList.startConversationPrompt}
              </Text>
            )}

            {hasUnread ? (
              <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: theme.colors.textOnAccent,
                      fontFamily: theme.fonts.bodySemiBold,
                    },
                  ]}
                >
                  {item.unread_count}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.headerBar, { backgroundColor: theme.colors.bg }]}>
        <Text
          style={[
            styles.brandText,
            { color: theme.colors.ink, fontFamily: theme.fonts.heading },
          ]}
        >
          {strings.chatList.title}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('NewChat')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.searchIconBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Icon name="search" size={22} color={theme.colors.ink} />
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : (
        <View
          style={[
            styles.listWrapper,
            {
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderColor: theme.colors.line,
            },
          ]}
        >
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.colors.ink, fontFamily: theme.fonts.heading },
                  ]}
                >
                  {strings.chatList.emptyTitle}
                </Text>
                <Text
                  style={[
                    styles.emptySub,
                    { color: theme.colors.muted, fontFamily: theme.fonts.body },
                  ]}
                >
                  {strings.chatList.emptySub}
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('NewChat')}
                  style={({ pressed }) => [
                    styles.emptyBtn,
                    {
                      backgroundColor: theme.colors.accent,
                      borderRadius: theme.radius,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.emptyBtnText,
                      {
                        color: theme.colors.textOnAccent,
                        fontFamily: theme.fonts.bodySemiBold,
                      },
                    ]}
                  >
                    {strings.chatList.findFriendsButton}
                  </Text>
                </Pressable>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandText: {
    fontSize: 28,
    letterSpacing: -0.8,
  },
  searchIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrapper: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
  },
  itemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msgText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
  },
  emptyWrap: {
    paddingTop: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontSize: 16,
  },
});
