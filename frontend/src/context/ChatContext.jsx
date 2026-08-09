import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { io } from "socket.io-client";


const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, allUsers, fetchDbUsers, logout, authFetch } = useAuth();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null); 
  const [typingUsers, setTypingUsers] = useState({}); // { [chatId]: [userIds...] }
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [reports, setReports] = useState([]);
  const [socket, setSocket] = useState(null);
  const deletedChatIdsRef = useRef(new Set());

  const [starredMsgIds, setStarredMsgIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starredMsgIds') || '[]');
    } catch (e) {
      return [];
    }
  });

  const toggleStarMessage = (messageId) => {
    setStarredMsgIds(prev => {
      const isStarred = prev.includes(messageId);
      const updated = isStarred
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId];
      try {
        localStorage.setItem('starredMsgIds', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearAllStarredMessages = () => {
    setStarredMsgIds([]);
    try {
      localStorage.setItem('starredMsgIds', '[]');
    } catch (e) {}
  };

  // Sync: Initialize socket connection when user logs in
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

  // Emit join-chat or leave-chat socket event when activeChatId changes or socket connects
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

  // Request desktop notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Sync browser document title with unread notifications count
  useEffect(() => {
    const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Sampark`;
    } else {
      document.title = "Sampark";
    }
  }, [chats]);

  // Listen for real-time incoming messages via WebSockets
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      if (message.chatId && deletedChatIdsRef.current.has(message.chatId)) {
        deletedChatIdsRef.current.delete(message.chatId);
      }

      // 1. Append message to messages list state (avoid duplicates)
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // 2. Update conversation's last message preview in chat list
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



      // 4. Trigger desktop push notification if tab is hidden OR user is looking at a different chat
      const isWindowHidden = document.visibilityState === 'hidden';
      if (isWindowHidden || !isActiveChat) {
        if ("Notification" in window && Notification.permission === "granted") {
          // Calculate total unread count across all chats
          const totalUnreadCount = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0) + (isActiveChat ? 0 : 1);

          // Resolve sender display name
          const sender = allUsers.find(u => u.id === message.senderId || u._id?.toString() === message.senderId);
          const senderName = sender ? sender.name : "Someone";

          let body = message.text;
          if (message.type === 'image') body = "🖼️ Shared an image";
          if (message.type === 'file') body = "📄 Shared a document";
          if (message.type === 'audio') body = "🎵 Sent a voice note";
          if (message.type === 'call') body = `📞 ${message.text}`;

          // Prepend sender context to message body
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

      // Safety timeout: auto-clear indicator after 4 seconds
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


  // Sync: Derive groups list dynamically whenever chats change.
  // This ensures group logo, description, and participant lists load for all members.
  useEffect(() => {
    const groupChats = chats.filter(c => c.type === 'group');
    const derivedGroups = groupChats.map(c => ({
      id: c.groupId || c.id,
      name: c.name,
      avatar: c.avatar,
      avatarColor: "from-blue-600 to-indigo-600",
      description: c.description || "",
      memberIds: c.participants || [],
      adminIds: (c.adminIds && c.adminIds.length > 0) ? c.adminIds : (c.participants ? c.participants.slice(0, 1) : []),
      permissions: c.permissions || { sendMessages: true, addMembers: true, approveMembers: false },
      joinRequests: c.joinRequests || [],
      pinnedMessageIds: c.pinnedMessageIds || []
    }));
    setGroups(derivedGroups);
  }, [chats]);

  // Fetch all chats from the backend database
  const loadChats = async () => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats`, {
        method: "GET"
      });
      if (res.status === 401) {
        if (typeof logout === 'function') logout();
        return;
      }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chats) {
          const activeChats = (result.data.chats || []).filter(
            c => !deletedChatIdsRef.current.has(c.id) && !deletedChatIdsRef.current.has(c._id)
          );
          setChats(activeChats);
        }
      }
    } catch (err) {
      console.error("Failed to load backend chats:", err);
    }
  };

  const mergeMessagesPreservingStatus = (prevMessages, newMessages, currentChatId) => {
    const statusRank = { sent: 1, delivered: 2, seen: 3 };
    const prevMap = new Map(
      prevMessages
        .filter(m => m.chatId === currentChatId || (m.chatId && m.chatId.toString() === currentChatId?.toString()))
        .map(m => [m.id, m])
    );

    const otherMessages = prevMessages.filter(
      m => m.chatId !== currentChatId && (m.chatId && m.chatId.toString() !== currentChatId?.toString())
    );

    const uniqueIncoming = (newMessages || []).filter(
      (msg, index, self) => index === self.findIndex(t => t.id === msg.id)
    );

    const mergedIncoming = uniqueIncoming.map(m => {
      const existing = prevMap.get(m.id);
      if (existing) {
        const existingRank = statusRank[existing.status] || 0;
        const newRank = statusRank[m.status] || 0;
        if (existingRank > newRank) {
          return { ...m, status: existing.status };
        }
      }
      return m;
    });

    return [...otherMessages, ...mergedIncoming];
  };

  // Sync: Load messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      try {
        const res = await authFetch(`http://localhost:5000/api/chats/${activeChatId}/messages`, {
          method: "GET"
        });
        if (res.status === 401) {
          if (typeof logout === 'function') logout();
          return;
        }
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.messages) {
            setMessages(prev => mergeMessagesPreservingStatus(prev, result.data.messages, activeChatId));
          }
        }
      } catch (err) {
        console.error("Failed to load backend messages:", err);
      }
    };

    loadMessages();
  }, [activeChatId]);

  const loadReports = async () => {
    try {
      const res = await authFetch(`http://localhost:5000/api/auth/admin/reports`, {
        method: "GET"
      });
      if (res.status === 401) {
        if (typeof logout === 'function') logout();
        return;
      }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.reports) {
          setReports(result.data.reports);
        }
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadReports();
    } else {
      setReports([]);
    }
  }, [user]);

  // Periodic poll for backend chats and active chat messages
  useEffect(() => {
    if (!user) {
      setChats([]);
      setMessages([]);
      setGroups([]);
      setActiveChatId(null);
      return;
    }

    loadChats();
    if (typeof fetchDbUsers === 'function') fetchDbUsers();
    if (user?.role === 'Admin') loadReports();

    const interval = setInterval(() => {
      loadChats();
      if (typeof fetchDbUsers === 'function') fetchDbUsers();
      if (user?.role === 'Admin') loadReports();
      if (activeChatId) {
        const refreshMessages = async () => {
          try {
            const res = await authFetch(`http://localhost:5000/api/chats/${activeChatId}/messages`, {
              method: "GET",
              credentials: "include"
            });
            if (res.status === 401) {
              if (typeof logout === 'function') logout();
              return;
            }
            if (res.ok) {
              const result = await res.json();
              if (result.success && result.data?.messages) {
                setMessages(prev => mergeMessagesPreservingStatus(prev, result.data.messages, activeChatId));
              }
            }
          } catch (err) {
            console.error("Error refreshing messages in poll:", err);
          }
        };
        refreshMessages();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [user, activeChatId]);


  // Clear unread count when chat becomes active
  useEffect(() => {
    if (activeChatId) {
      setChats(prevChats =>
        prevChats.map(c => (c.id === activeChatId || c.groupId === activeChatId ? { ...c, unreadCount: 0, isUnread: false } : c))
      );
    }
  }, [activeChatId]);

  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, unreadCount: 0, isUnread: false } : c))
    );
  };

  const getActiveChat = () => {
    return chats.find(c => c.id === activeChatId);
  };

  const getChatMessages = (chatId) => {
    const list = messages.filter(m => m.chatId === chatId || (m.chatId && m.chatId.toString() === chatId?.toString()));
    const unique = [];
    const seen = new Set();
    for (const m of list) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        unique.push(m);
      }
    }
    return unique;
  };

  const sendMessage = (chatId, text, type = 'text', fileData = null, replyToId = null, isForwarded = false) => {
    // Send message to backend
    const sendMsgToServer = async () => {
      try {
        const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            type,
            attachmentUrl: fileData?.attachmentUrl || "",
            attachmentName: fileData?.attachmentName || "",
            attachmentSize: fileData?.attachmentSize || "",
            attachmentDuration: fileData?.attachmentDuration || "",
            isForwarded,
            replyToId
          }),
          credentials: "include"
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.message) {
            setMessages(prev => {
              if (prev.some(m => m.id === result.data.message.id)) return prev;
              return [...prev, result.data.message];
            });
            setChats(prevChats =>
              prevChats.map(c =>
                c.id === chatId ? { 
                  ...c, 
                  lastMessageId: result.data.message.id, 
                  createdTime: result.data.message.timestamp,
                  lastMessage: result.data.message
                } : c
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to send message to backend:", err);
      }
    };
    sendMsgToServer();
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await authFetch("http://localhost:5000/api/chats/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          return result.data; // { url, name, size }
        }
      }
      return null;
    } catch (err) {
      console.error("Failed to upload file to backend:", err);
      return null;
    }
  };

  const editMessage = (messageId, newText) => {
    const cleanNewText = (newText || "").trim();
    const existingMsg = messages.find(m => m.id === messageId);
    if (existingMsg && (existingMsg.text || "").trim() === cleanNewText) {
      return;
    }

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, text: cleanNewText, edited: true } : m))
    );

    const saveEditOnBackend = async () => {
      try {
        const res = await authFetch(`http://localhost:5000/api/chats/messages/${messageId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: cleanNewText }),
          credentials: "include"
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.message) {
            setMessages(prev =>
              prev.map(m => (m.id === messageId ? result.data.message : m))
            );
          }
        }
      } catch (err) {
        console.error("Failed to edit message on backend:", err);
      }
    };
    saveEditOnBackend();
  };

  const deleteMessageForMe = (messageId) => {
    // Instantly remove message from current user's state
    setMessages(prev => prev.filter(m => m.id !== messageId));

    const deleteOnBackend = async () => {
      try {
        await authFetch(`http://localhost:5000/api/chats/messages/${messageId}/me`, {
          method: "DELETE",
          credentials: "include"
        });
      } catch (err) {
        console.error("Failed to delete message for me on backend:", err);
      }
    };
    deleteOnBackend();
  };

  const deleteMessageForEveryone = (messageId) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId ? { ...m, text: "This message was deleted.", isDeleted: true, type: "text", attachmentUrl: "", attachmentName: "", attachmentSize: "", attachmentDuration: "" } : m
      )
    );

    setChats(prevChats =>
      prevChats.map(c => ({
        ...c,
        pinnedMessageIds: (c.pinnedMessageIds || []).filter(p => p.id !== messageId)
      }))
    );

    setGroups(prevGroups =>
      prevGroups.map(g => ({
        ...g,
        pinnedMessageIds: (g.pinnedMessageIds || []).filter(p => p.id !== messageId)
      }))
    );

    const deleteOnBackend = async () => {
      try {
        await authFetch(`http://localhost:5000/api/chats/messages/${messageId}/everyone`, {
          method: "DELETE",
          credentials: "include"
        });
      } catch (err) {
        console.error("Failed to delete message for everyone on backend:", err);
      }
    };
    deleteOnBackend();
  };

  const togglePinnedMessage = (chatId, messageId, durationHours = 168) => {
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return false;

    const currentPins = targetChat.pinnedMessageIds || [];
    const alreadyPinned = currentPins.some(p => p.id === messageId);

    if (alreadyPinned) {
      // Optimistic unpin: remove from array
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === chatId
            ? { ...c, pinnedMessageIds: (c.pinnedMessageIds || []).filter(p => p.id !== messageId) }
            : c
        )
      );
    } else {
      // Optimistic pin: add to front of array
      const newPin = {
        id: messageId,
        pinnedUntil: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      };
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === chatId
            ? { ...c, pinnedMessageIds: [newPin, ...(c.pinnedMessageIds || [])] }
            : c
        )
      );
    }

    // Persist to backend
    const pinOnBackend = async () => {
      try {
        const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/pin-message`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, durationHours }),
          credentials: "include"
        });
        if (res.ok) {
          const result = await res.json();
          // Sync confirmed pinnedMessageIds from server
          if (result.success && result.data?.pinnedMessageIds !== undefined) {
            setChats(prevChats =>
              prevChats.map(c =>
                c.id === chatId ? { ...c, pinnedMessageIds: result.data.pinnedMessageIds } : c
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to pin message on backend:", err);
      }
    };
    pinOnBackend();

    return !alreadyPinned;
  };

  // Check for expired pinned messages periodically
  useEffect(() => {
    const checkPinExpirations = () => {
      const now = Date.now();
      setChats(prevChats =>
        prevChats.map(c => {
          if (!c.pinnedMessageIds || c.pinnedMessageIds.length === 0) return c;
          const active = c.pinnedMessageIds.filter(
            p => !p.pinnedUntil || new Date(p.pinnedUntil).getTime() > now
          );
          if (active.length === c.pinnedMessageIds.length) return c;
          return { ...c, pinnedMessageIds: active };
        })
      );
    };
    const timer = setInterval(checkPinExpirations, 5000);
    return () => clearInterval(timer);
  }, []);


  const addReaction = (messageId, emoji) => {
    // 1. Optimistic Update (instant UI feedback)
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;

        const currentReactions = m.emojiReactions || [];
        const exactMatch = currentReactions.find(
          r => r.emoji === emoji && (r.userIds || []).includes('user_me')
        );

        // Remove user_me from all reactions
        let cleaned = currentReactions.map(r => {
          const userIds = (r.userIds || []).filter(id => id !== 'user_me');
          return {
            ...r,
            userIds,
            count: userIds.length
          };
        }).filter(r => r.count > 0);

        if (!exactMatch) {
          const idx = cleaned.findIndex(r => r.emoji === emoji);
          if (idx > -1) {
            cleaned[idx] = {
              ...cleaned[idx],
              count: cleaned[idx].count + 1,
              userIds: [...cleaned[idx].userIds, 'user_me']
            };
          } else {
            cleaned.push({ emoji, count: 1, userIds: ['user_me'] });
          }
        }

        return { ...m, emojiReactions: cleaned };
      })
    );

    // 2. Persist to MongoDB backend
    const saveReaction = async () => {
      try {
        const res = await authFetch(`http://localhost:5000/api/chats/messages/${messageId}/reaction`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ emoji }),
          credentials: "include"
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.emojiReactions) {
            // Update message in state to match database reactions explicitly
            setMessages(prev =>
              prev.map(m => (m.id === messageId ? { ...m, emojiReactions: result.data.emojiReactions } : m))
            );
          }
        }
      } catch (err) {
        console.error("Failed to save reaction on backend:", err);
      }
    };
    saveReaction();
  };

  const createDirectChat = async (userId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId }),
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const newChat = result.data.chat;
          if (newChat.id) deletedChatIdsRef.current.delete(newChat.id);
          setChats(prev => {
            if (prev.some(c => c.id === newChat.id)) return prev;
            return [newChat, ...prev];
          });
          setActiveChatId(newChat.id);
          return newChat.id;
        }
      }
    } catch (err) {
      console.error("Failed to create backend direct chat:", err);
    }
  };

  const createGroup = async (nameOrObj, description, memberIds, avatar = "") => {
    try {
      let gName = nameOrObj;
      let gDesc = description;
      let gMembers = memberIds;
      let gAvatar = avatar;

      if (typeof nameOrObj === 'object' && nameOrObj !== null) {
        gName = nameOrObj.name;
        gDesc = nameOrObj.description || nameOrObj.desc || "";
        gMembers = nameOrObj.members || nameOrObj.memberIds || nameOrObj.participantIds || [];
        gAvatar = nameOrObj.avatar || "";
      }

      const res = await authFetch(`http://localhost:5000/api/chats/group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: gName,
          description: gDesc,
          participantIds: gMembers || [],
          avatar: gAvatar
        }),
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const newChat = result.data.chat;
          setChats(prev => {
            if (prev.some(c => c.id === newChat.id)) return prev;
            return [newChat, ...prev];
          });
          setActiveChatId(newChat.id);
          return newChat.id;
        }
      }
    } catch (err) {
      console.error("Failed to create group on backend:", err);
    }
  };


  const updateGroup = (groupId, updates) => {
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, ...updates } : g)));
  };

  const leaveGroup = async (groupId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${groupId}/leave`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setChats(prevChats => prevChats.filter(c => c.id !== groupId && c.groupId !== groupId));
        setActiveChatId(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to leave group on backend:", err);
      return false;
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${groupId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setChats(prevChats => prevChats.filter(c => c.id !== groupId && c.groupId !== groupId));
        setActiveChatId(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to dissolve group on backend:", err);
      return false;
    }
  };

  const toggleBlockUserOnBackend = async (targetUserId) => {
    if (!targetUserId) return;
    const targetStr = targetUserId.toString();

    // Optimistic UI state update: toggle targetUserId in blockedUserIds immediately
    setBlockedUserIds(prev => {
      const prevStrings = (prev || []).map(id => id.toString());
      if (prevStrings.includes(targetStr)) {
        return prevStrings.filter(id => id !== targetStr);
      } else {
        return [...prevStrings, targetStr];
      }
    });

    try {
      const res = await authFetch(`http://localhost:5000/api/auth/block/${targetStr}`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.blockedUsers) {
          setBlockedUserIds(result.data.blockedUsers);
        }
      }
    } catch (err) {
      console.error("Failed to toggle block user:", err);
    }
  };

  const blockUser = (userId) => {
    toggleBlockUserOnBackend(userId);
  };

  const unblockUser = (userId) => {
    toggleBlockUserOnBackend(userId);
  };

  const reportUser = async (reportedUserId, messageText, reason) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/auth/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedUserId, messageText, reason }),
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.report) {
          if (user?.role === 'Admin') {
            loadReports();
          }
        }
      }
    } catch (err) {
      console.error("Failed to submit report:", err);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/auth/admin/reports/${reportId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include"
      });
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error("Failed to update report status:", err);
    }
  };

  const makeGroupAdmin = async (chatId, targetUserId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/make-admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetUserId }),
        credentials: "include"
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.adminIds) {
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId ? { ...g, adminIds: result.data.adminIds } : g
            )
          );
          setChats(prevChats =>
            prevChats.map(c =>
              c.id === chatId ? { ...c, adminIds: result.data.adminIds } : c
            )
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to make group admin:", err);
      return false;
    }
  };

  const dismissGroupAdmin = async (chatId, targetUserId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/dismiss-admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetUserId }),
        credentials: "include"
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.adminIds) {
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId ? { ...g, adminIds: result.data.adminIds } : g
            )
          );
          setChats(prevChats =>
            prevChats.map(c =>
              c.id === chatId ? { ...c, adminIds: result.data.adminIds } : c
            )
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to dismiss group admin:", err);
      return false;
    }
  };

  const removeFromGroup = async (chatId, targetUserId) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/remove-member`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetUserId }),
        credentials: "include"
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId
                ? {
                    ...g,
                    memberIds: result.data.participants,
                    adminIds: result.data.adminIds
                  }
                : g
            )
          );
          setChats(prevChats =>
            prevChats.map(c =>
              c.id === chatId
                ? {
                    ...c,
                    participants: result.data.participants,
                    adminIds: result.data.adminIds
                  }
                : c
            )
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to remove user from group:", err);
      return false;
    }
  };

  const updateGroupProfile = async (chatId, updates) => {
    try {

      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/group-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updates),
        credentials: "include"
      });

      if (res.status === 401) {
        if (typeof logout === 'function') logout();
        return false;
      }

      if (res.ok) {

        const result = await res.json();
        if (result.success && result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prev =>
            prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId
                ? {
                    ...g,
                    name: updatedChat.name,
                    description: updatedChat.description,
                    avatar: updatedChat.avatar
                  }
                : g
            )
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to update group profile:", err);
      return false;
    }
  };

  const addMembersToGroup = async (chatId, memberIds) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/add-members`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ memberIds }),
        credentials: "include"
      });

      if (res.status === 401) {
        if (typeof logout === 'function') logout();
        return { success: false };
      }

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prev =>
            prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId
                ? {
                    ...g,
                    memberIds: updatedChat.participants,
                    adminIds: updatedChat.adminIds,
                    permissions: updatedChat.permissions,
                    joinRequests: updatedChat.joinRequests
                  }
                : g
            )
          );
          return { success: true, isPending: !!result.data.isPending, message: result.message };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, message: errJson.message || "Request already sent or member is already added." };
      }
      return { success: false };
    } catch (err) {
      console.error("Failed to add members to group:", err);
      return { success: false };
    }
  };

  const updateGroupPermissions = async (chatId, permissions) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ permissions }),
        credentials: "include"
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prev =>
            prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId
                ? {
                    ...g,
                    permissions: updatedChat.permissions,
                    joinRequests: updatedChat.joinRequests
                  }
                : g
            )
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to update group permissions:", err);
      return false;
    }
  };

  const handleJoinRequest = async (chatId, targetUserId, action) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/join-request`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetUserId, action }),
        credentials: "include"
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prev =>
            prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId
                ? {
                    ...g,
                    memberIds: updatedChat.participants,
                    adminIds: updatedChat.adminIds,
                    permissions: updatedChat.permissions,
                    joinRequests: updatedChat.joinRequests
                  }
                : g
            )
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to handle join request:", err);
      return false;
    }
  };

  const togglePinChat = async (chatId) => {
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, pinned: !c.pinned } : c))
    );
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/pin`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prevChats =>
            prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle pin chat:", err);
    }
  };

  const toggleArchiveChat = async (chatId) => {
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, archived: !c.archived } : c))
    );
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/archive`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prevChats =>
            prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle archive chat:", err);
    }
  };

  const toggleFavoriteChat = async (chatId) => {
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, favorite: !c.favorite } : c))
    );
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/favorite`, {
        method: "PUT",
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prevChats =>
            prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c))
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite chat:", err);
    }
  };

  const toggleUnreadChat = async (chatId) => {
    setChats(prevChats =>
      prevChats.map(c => {
        if (c.id === chatId || c.groupId === chatId) {
          const isCurrentlyUnread = (c.unreadCount > 0) || !!c.isUnread;
          return {
            ...c,
            isUnread: !isCurrentlyUnread,
            unreadCount: isCurrentlyUnread ? 0 : 1
          };
        }
        return c;
      })
    );
    try {
      await authFetch(`http://localhost:5000/api/chats/${chatId}/unread`, {
        method: "PUT",
        credentials: "include"
      });
    } catch (err) {
      console.error("Failed to toggle unread chat:", err);
    }
  };

  const clearChatMessages = async (chatId) => {
    setMessages(prev => prev.filter(m => m.chatId !== chatId));
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId ? { ...c, lastMessage: null, lastMessageId: null } : c))
    );
    try {
      await authFetch(`http://localhost:5000/api/chats/${chatId}/clear-messages`, {
        method: "DELETE",
        credentials: "include"
      });
    } catch (err) {
      console.error("Failed to clear chat messages:", err);
    }
  };

  const deleteChat = async (chatId) => {
    if (!chatId) return;
    deletedChatIdsRef.current.add(chatId.toString());
    setMessages(prev => prev.filter(m => m.chatId !== chatId));
    setChats(prevChats => prevChats.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    try {
      const res = await authFetch(`http://localhost:5000/api/chats/${chatId}/delete-chat`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) {
        deletedChatIdsRef.current.delete(chatId.toString());
        loadChats();
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
      deletedChatIdsRef.current.delete(chatId.toString());
      loadChats();
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        messages,
        groups,
        activeChatId,
        typingUsers,
        blockedUserIds,
        reports,
        socket,
        selectChat,
        getActiveChat,
        getChatMessages,
        sendMessage,
        uploadFile,
        editMessage,
        deleteMessage: deleteMessageForEveryone,
        deleteMessageForMe,
        deleteMessageForEveryone,
        togglePinnedMessage,
        addReaction,
        createDirectChat,
        createGroup,
        updateGroup,
        updateGroupProfile,
        updateGroupPermissions,
        handleJoinRequest,
        leaveGroup,
        deleteGroup,
        blockUser,
        unblockUser,
        reportUser,
        updateReportStatus,
        makeGroupAdmin,
        dismissGroupAdmin,
        removeFromGroup,
        addMembersToGroup,
        togglePinChat,
        toggleArchiveChat,
        toggleFavoriteChat,
        toggleUnreadChat,
        clearChatMessages,
        deleteChat,
        starredMsgIds,
        toggleStarMessage,
        clearAllStarredMessages
      }}
    >
      {children}
    </ChatContext.Provider>

  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
