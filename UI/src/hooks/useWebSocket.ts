import { useEffect, useState } from "react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

export const useWebSocket = (messageType?: string) => {
  const { messages, isConnected, sendMessage } = useWebSocketContext();
  const [filteredMessages, setFilteredMessages] = useState<any[]>([]);

  useEffect(() => {
    if (messageType) {
      const filtered = messages.filter((msg) => msg.type === messageType);
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [messages, messageType]);

  return {
    messages: filteredMessages,
    allMessages: messages,
    isConnected,
    sendMessage,
  };
};
