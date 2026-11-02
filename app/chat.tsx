import ChatScreen from '@/src/screens/ChatScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ChatRoute() {
  const params = useLocalSearchParams<{ conversationId?: string; productId?: string; sellerId?: string; buyerId?: string }>();
  return <ChatScreen key={`${params.conversationId || ''}:${params.buyerId || ''}:${params.sellerId || ''}:${params.productId || ''}`} />;
}
