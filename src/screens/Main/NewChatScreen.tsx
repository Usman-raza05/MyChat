import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Profile, RootStackParamList } from '../../types';
import { useTheme } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { strings } from '../../strings';

interface NewChatScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const NewChatScreen: React.FC<NewChatScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .or(`username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
        .limit(20);

      setLoading(false);
      if (!error && data) {
        setUsers(data as Profile[]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, user?.id]);

  const handleStartChat = async (targetUser: Profile) => {
    if (!user?.id) return;

    setLoading(true);
    const { data: convId, error } = await supabase.rpc(
      'get_or_create_direct_conversation',
      { other_user_id: targetUser.id }
    );

    setLoading(false);

    if (error) {
      console.warn('Error starting conversation:', error.message);
      return;
    }

    if (convId) {
      navigation.replace('Chat', {
        conversationId: convId as string,
        title: targetUser.display_name || targetUser.username || 'User',
        otherUser: targetUser,
      });
    }
  };

  const renderItem = ({ item }: { item: Profile }) => {
    const displayName = item.display_name || item.username || 'User';

    return (
      <Pressable
        onPress={() => handleStartChat(item)}
        style={({ pressed }) => [
          styles.userRow,
          {
            backgroundColor: pressed ? theme.colors.bg : theme.colors.surface,
            borderBottomColor: theme.colors.line,
          },
        ]}
      >
        <Avatar name={displayName} avatarUrl={item.avatar_url} size={46} />
        <View style={styles.userInfo}>
          <Text style={[styles.nameText, { color: theme.colors.ink, fontFamily: theme.fonts.bodySemiBold }]}>
            {displayName}
          </Text>
          {item.username ? (
            <Text style={[styles.usernameText, { color: theme.colors.muted, fontFamily: theme.fonts.body }]}>
              @{item.username}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.line }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Icon name="back" size={24} color={theme.colors.ink} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
          {strings.newChat.title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={strings.newChat.searchPlaceholder}
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              color: theme.colors.ink,
              fontFamily: theme.fonts.body,
              borderRadius: theme.radius,
            },
          ]}
        />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyTitleText, { color: theme.colors.ink, fontFamily: theme.fonts.heading }]}>
                  {strings.newChat.noUsersFoundTitle}
                </Text>
                <Text style={[styles.emptySubText, { color: theme.colors.muted, fontFamily: theme.fonts.body }]}>
                  {strings.newChat.noUsersFoundSub}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptySubText, { color: theme.colors.muted, fontFamily: theme.fonts.body }]}>
                  {strings.newChat.promptSub}
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
  },
  searchWrap: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  centerLoading: {
    marginTop: 40,
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    marginLeft: 14,
  },
  nameText: {
    fontSize: 16,
  },
  usernameText: {
    fontSize: 13.5,
    marginTop: 2,
  },
  emptyWrap: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitleText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
