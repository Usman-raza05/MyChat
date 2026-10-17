import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, AlertButton } from 'react-native';
import { Message } from '../types';
import { useTheme } from '../theme';
import { formatMessageTime } from '../utils/dateUtils';
import { Icon } from './Icon';
import { strings } from '../strings';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  isFirstInGroup?: boolean;
  onDeleteMessage: (messageId: string, forEveryone: boolean) => void;
  onRetrySend?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  isFirstInGroup = true,
  onDeleteMessage,
  onRetrySend,
}) => {
  const theme = useTheme();
  const timeStr = formatMessageTime(message.created_at);

  const handleLongPress = () => {
    if (message.deleted_for_everyone) return;

    const options: AlertButton[] = [
      {
        text: strings.chatScreen.menuDeleteForMe,
        style: 'destructive',
        onPress: () => onDeleteMessage(message.id, false),
      },
    ];

    if (isMine) {
      options.push({
        text: strings.chatScreen.menuDeleteForEveryone,
        style: 'destructive',
        onPress: () => onDeleteMessage(message.id, true),
      });
    }

    options.push({
      text: strings.general.cancel,
      style: 'cancel',
      onPress: () => {},
    });

    Alert.alert(
      strings.general.deleteDialogTitle,
      strings.general.deleteDialogSub,
      options,
      { cancelable: true }
    );
  };

  const renderStatusTicks = () => {
    if (!isMine) return null;

    if (message.isFailed) {
      return (
        <Pressable onPress={() => onRetrySend?.(message)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="refresh" size={13} color={theme.colors.danger} />
          <Text style={[styles.statusText, { color: theme.colors.danger, fontFamily: theme.fonts.bodySemiBold }]}>
            {' '}{strings.general.retry}
          </Text>
        </Pressable>
      );
    }

    if (message.isOptimistic) {
      return <Icon name="clock" size={13} color={theme.colors.muted} style={{ marginLeft: 3 }} />;
    }

    if (message.status === 'read') {
      return <Icon name="checks-read" size={15} color={theme.colors.accent} style={{ marginLeft: 3 }} />;
    }

    if (message.status === 'delivered') {
      return <Icon name="checks" size={15} color={theme.colors.muted} style={{ marginLeft: 3 }} />;
    }

    return <Icon name="check" size={15} color={theme.colors.muted} style={{ marginLeft: 3 }} />;
  };

  const radius = theme.radius;
  const bubbleRadiusStyle = isMine
    ? {
        borderTopLeftRadius: radius,
        borderTopRightRadius: isFirstInGroup ? 4 : radius,
        borderBottomLeftRadius: radius,
        borderBottomRightRadius: radius,
      }
    : {
        borderTopLeftRadius: isFirstInGroup ? 4 : radius,
        borderTopRightRadius: radius,
        borderBottomLeftRadius: radius,
        borderBottomRightRadius: radius,
      };

  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginTop: isFirstInGroup ? 10 : 3,
        },
      ]}
    >
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={({ pressed }) => [
          styles.bubble,
          bubbleRadiusStyle,
          {
            backgroundColor: isMine
              ? theme.colors.myBubble
              : theme.colors.theirBubble,
            borderColor: isMine ? 'transparent' : theme.colors.line,
            borderWidth: isMine ? 0 : 1,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.bubbleInner}>
          <Text
            style={[
              styles.content,
              {
                color: isMine
                  ? theme.colors.myBubbleText
                  : theme.colors.theirBubbleText,
                fontFamily: theme.fonts.body,
                fontStyle: message.deleted_for_everyone ? 'italic' : 'normal',
              },
            ]}
          >
            {message.deleted_for_everyone
              ? strings.chatScreen.deletedForEveryone
              : message.content}
          </Text>

          <View style={styles.timeContainer}>
            <Text
              style={[
                styles.timeText,
                {
                  color: isMine
                    ? theme.colors.myBubbleText
                    : theme.colors.muted,
                  fontFamily: theme.fonts.body,
                  opacity: 0.65,
                },
              ]}
            >
              {timeStr}
            </Text>
            {renderStatusTicks()}
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
    flexShrink: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
    paddingTop: 2,
  },
  timeText: {
    fontSize: 11,
  },
  statusText: {
    fontSize: 11,
  },
});
