import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const useChatSocket = ({
  user,
  activeChatId,
  chats,
  allUsers,
  deletedChatIdsRef,
  setMessages,
  setChats,
  setGroups,
  setTypingUsers,
  setActiveChatId,
  setBlockedUserIds,
  loadChats,
  selectChat,
  logout
}) => {
  const [socket, setSocket] = useState(null);

  // Initialize socket connection when user logs in
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setBlockedUserIds([]);
      return;
    }

    if (user.blockedUsers) {
      setBlockedUserIds(user.blockedUsers);
    } else {
      setBlockedUserIds([]);
    }

    const newSocket = io("http://localhost:5000", {
      withCredentials: true
    });
    newSocket.emit("register", user.id || user._id);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Join or leave chat channel when activeChatId changes
  useEffect(() => {
    if (socket && user) {
      const uId = user.id || user._id;
      if (activeChatId) {
        socket.emit("join-chat", { userId: uId, chatId: activeChatId });
      } else {
        socket.emit("leave-chat", { userId: uId });
      }
    }
  }, [socket, activeChatId, user]);

  // Handle incoming real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      if (message.chatId && deletedChatIdsRef.current?.has(message.chatId)) {
        deletedChatIdsRef.current.delete(message.chatId);
      }

      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });

      const isActiveChat = message.chatId === activeChatId;
      setChats(prevChats => {
        const chatExists = prevChats.some(c => c.id === message.chatId || c.groupId === message.chatId);
        if (!chatExists) {
          loadChats();
          return prevChats;
        }
        return prevChats.map(c =>
          (c.id === message.chatId || c.groupId === message.chatId) ? {
            ...c,
            lastMessageId: message.id,
            createdTime: message.timestamp,
            lastMessage: message,
            unreadCount: isActiveChat ? 0 : (c.unreadCount || 0) + 1
          } : c
        );
      });

      const isWindowHidden = document.visibilityState === 'hidden';
      if (isWindowHidden || !isActiveChat) {
        if ("Notification" in window && Notification.permission === "granted") {
          const totalUnreadCount = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0) + (isActiveChat ? 0 : 1);
          const sender = allUsers.find(u => u.id === message.senderId || u._id?.toString() === message.senderId);
          const senderName = sender ? sender.name : "Someone";

          let body = message.text;
          if (message.type === 'image') body = "🖼️ Shared an image";
          if (message.type === 'file') body = "📄 Shared a document";
          if (message.type === 'audio') body = "🎵 Sent a voice note";
          if (message.type === 'call') body = `📞 ${message.text}`;

          const groupChat = chats.find(c => c.id === message.chatId && c.type === 'group');
          const prefix = groupChat ? `[Group: ${groupChat.name}] ${senderName}: ` : `${senderName}: `;
          const notificationBody = `${prefix}${body}`;
          const notificationTitle = `(${totalUnreadCount}) Sampark`;

          const notification = new Notification(notificationTitle, {
            body: notificationBody,
            tag: message.chatId,
            renotify: true
          });

          notification.onclick = () => {
            window.focus();
            selectChat(message.chatId);
          };
        }
      }
    };

    const handleUserTyping = ({ fromUserId, chatId }) => {
      setTypingUsers(prev => {
        const currentList = prev[chatId] || [];
        if (currentList.includes(fromUserId)) return prev;
        return {
          ...prev,
          [chatId]: [...currentList, fromUserId]
        };
      });

      setTimeout(() => {
        setTypingUsers(prev => {
          const currentList = prev[chatId] || [];
          if (!currentList.includes(fromUserId)) return prev;
          return {
            ...prev,
            [chatId]: currentList.filter(id => id !== fromUserId)
          };
        });
      }, 4000);
    };

    const handleUserStopTyping = ({ fromUserId, chatId }) => {
      setTypingUsers(prev => {
        const currentList = prev[chatId] || [];
        if (!currentList.includes(fromUserId)) return prev;
        return {
          ...prev,
          [chatId]: currentList.filter(id => id !== fromUserId)
        };
      });
    };

    const handleMessagesDelivered = ({ userId, conversationIds, chatId }) => {
      const myId = user?.id || user?._id;
      if (userId?.toString() === myId?.toString()) return;

      const ids = Array.isArray(conversationIds)
        ? conversationIds
        : (chatId ? [chatId] : []);

      if (ids.length === 0) return;

      setMessages(prev =>
        prev.map(m =>
          ids.includes(m.chatId) && m.senderId === 'user_me' && m.status === 'sent'
            ? { ...m, status: 'delivered' }
            : m
        )
      );
    };

    const handleMessagesSeen = ({ chatId, userId }) => {
      const myId = user?.id || user?._id;
      if (userId?.toString() === myId?.toString()) return;

      setMessages(prev =>
        prev.map(m =>
          m.chatId === chatId && m.senderId === 'user_me' && m.status !== 'seen'
            ? { ...m, status: 'seen' }
            : m
        )
      );
    };

    const handleMessageUpdated = ({ messageId, text, edited }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, text, edited } : m)
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                text: "This message was deleted.",
                isDeleted: true,
                type: "text",
                attachmentUrl: "",
                attachmentName: "",
                attachmentSize: "",
                attachmentDuration: ""
              }
            : m
        )
      );
    };

    const handleBlockedDisconnect = (data) => {
      logout();
      alert(data.message || "Your account has been suspended by the administrator.");
    };

    const handleGroupUpdated = ({ chatId, name, description, avatar }) => {
      setChats(prev =>
        prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, name, description, avatar } : c))
      );
      setGroups(prev =>
        prev.map(g => (g.id === chatId ? { ...g, name, description, avatar } : g))
      );
    };

    const handleMessageReactionUpdated = ({ messageId, emojiReactions }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, emojiReactions } : m)
      );
    };

    const handleUserDeleted = ({ userId, conversationIds }) => {
      if (Array.isArray(conversationIds) && conversationIds.length > 0) {
        setChats(prev => prev.filter(c => !conversationIds.includes(c.id)));
        setMessages(prev => prev.filter(m => !conversationIds.includes(m.chatId)));
        if (conversationIds.includes(activeChatId)) {
          setActiveChatId(null);
        }
      }
      loadChats();
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);
    socket.on("messages-delivered", handleMessagesDelivered);
    socket.on("messages-seen", handleMessagesSeen);
    socket.on("message-updated", handleMessageUpdated);
    socket.on("message-deleted", handleMessageDeleted);
    socket.on("blocked-disconnect", handleBlockedDisconnect);
    socket.on("group-updated", handleGroupUpdated);
    socket.on("message-reaction-updated", handleMessageReactionUpdated);
    socket.on("user-deleted", handleUserDeleted);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
      socket.off("messages-delivered", handleMessagesDelivered);
      socket.off("messages-seen", handleMessagesSeen);
      socket.off("message-updated", handleMessageUpdated);
      socket.off("message-deleted", handleMessageDeleted);
      socket.off("blocked-disconnect", handleBlockedDisconnect);
      socket.off("group-updated", handleGroupUpdated);
      socket.off("message-reaction-updated", handleMessageReactionUpdated);
      socket.off("user-deleted", handleUserDeleted);
    };
  }, [socket, activeChatId, chats, allUsers]);

  return socket;
};
