import React from 'react';
import { ViewStyle } from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  X,
  MoreVertical,
  Search,
  Plus,
  MessageSquarePlus,
  Settings,
  LogOut,
  Send,
  Paperclip,
  Camera,
  Mic,
  Smile,
  Reply,
  Copy,
  Trash2,
  Edit3,
  Info,
  Bell,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AtSign,
  WifiOff,
  MessageSquare,
} from 'lucide-react-native';

export type IconName =
  | 'back'
  | 'chevron-right'
  | 'close'
  | 'more-vertical'
  | 'search'
  | 'plus'
  | 'new-chat'
  | 'settings'
  | 'logout'
  | 'send'
  | 'attach'
  | 'camera'
  | 'mic'
  | 'emoji'
  | 'reply'
  | 'copy'
  | 'trash'
  | 'edit'
  | 'info'
  | 'bell'
  | 'clock'
  | 'check'
  | 'checks'
  | 'checks-read'
  | 'alert-circle'
  | 'refresh'
  | 'user'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'camera-plus'
  | 'at-sign'
  | 'wifi-off'
  | 'chats'
  | 'profile';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  active?: boolean;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#000000',
  strokeWidth = 1.75,
  active = false,
  style,
}) => {
  const commonProps = {
    size,
    color,
    strokeWidth,
    style,
  };

  switch (name) {
    case 'back':
      return <ArrowLeft {...commonProps} />;
    case 'chevron-right':
      return <ChevronRight {...commonProps} />;
    case 'close':
      return <X {...commonProps} />;
    case 'more-vertical':
      return <MoreVertical {...commonProps} />;
    case 'search':
      return <Search {...commonProps} />;
    case 'plus':
      return <Plus {...commonProps} />;
    case 'new-chat':
      return <MessageSquarePlus {...commonProps} />;
    case 'settings':
      return <Settings {...commonProps} />;
    case 'logout':
      return <LogOut {...commonProps} />;
    case 'send':
      return <Send {...commonProps} style={[{ transform: [{ translateX: 1 }, { translateY: -1 }] }, style]} />;
    case 'attach':
      return <Paperclip {...commonProps} />;
    case 'camera':
    case 'camera-plus':
      return <Camera {...commonProps} />;
    case 'mic':
      return <Mic {...commonProps} />;
    case 'emoji':
      return <Smile {...commonProps} />;
    case 'reply':
      return <Reply {...commonProps} />;
    case 'copy':
      return <Copy {...commonProps} />;
    case 'trash':
      return <Trash2 {...commonProps} />;
    case 'edit':
      return <Edit3 {...commonProps} />;
    case 'info':
      return <Info {...commonProps} />;
    case 'bell':
      return <Bell {...commonProps} />;
    case 'clock':
      return <Clock {...commonProps} />;
    case 'check':
      return <Check {...commonProps} />;
    case 'checks':
      return <CheckCheck {...commonProps} />;
    case 'checks-read':
      return <CheckCheck {...commonProps} color={color} />;
    case 'alert-circle':
      return <AlertCircle {...commonProps} />;
    case 'refresh':
      return <RefreshCw {...commonProps} />;
    case 'user':
    case 'profile':
      return (
        <User
          {...commonProps}
          fill={active ? color : 'none'}
        />
      );
    case 'mail':
      return <Mail {...commonProps} />;
    case 'lock':
      return <Lock {...commonProps} />;
    case 'eye':
      return <Eye {...commonProps} />;
    case 'eye-off':
      return <EyeOff {...commonProps} />;
    case 'at-sign':
      return <AtSign {...commonProps} />;
    case 'wifi-off':
      return <WifiOff {...commonProps} />;
    case 'chats':
      return (
        <MessageSquare
          {...commonProps}
          fill={active ? color : 'none'}
        />
      );
    default:
      return <Info {...commonProps} />;
  }
};
