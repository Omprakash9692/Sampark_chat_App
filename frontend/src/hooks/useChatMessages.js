import { useState, useEffect } from 'react';
import { chatApi } from '../services/chatApi';

export const useChatMessages = ({ user, authFetch, logout, activeChatId, chats, setChats, setGroups }) => {
  const [messages, setMessages] = useState([]);
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

  // Fetch active chat messages on chat change
  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      try {
        const res = await chatApi.fetchMessages(authFetch, activeChatId);
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

  // Expiration check for pinned messages
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
    const sendMsgToServer = async () => {
      try {
        const res = await chatApi.sendMessage(authFetch, chatId, {
          text,
          type,
          attachmentUrl: fileData?.attachmentUrl || "",
          attachmentName: fileData?.attachmentName || "",
          attachmentSize: fileData?.attachmentSize || "",
          attachmentDuration: fileData?.attachmentDuration || "",
          isForwarded,
          replyToId
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
    try {
      const res = await chatApi.uploadFile(authFetch, file);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) return result.data;
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
    if (existingMsg && (existingMsg.text || "").trim() === cleanNewText) return;

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, text: cleanNewText, edited: true } : m))
    );

    const saveEditOnBackend = async () => {
      try {
        const res = await chatApi.editMessage(authFetch, messageId, cleanNewText);
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
    setMessages(prev => prev.filter(m => m.id !== messageId));
    chatApi.deleteMessageForMe(authFetch, messageId).catch(err =>
      console.error("Failed to delete message for me on backend:", err)
    );
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

    if (typeof setGroups === 'function') {
      setGroups(prevGroups =>
        prevGroups.map(g => ({
          ...g,
          pinnedMessageIds: (g.pinnedMessageIds || []).filter(p => p.id !== messageId)
        }))
      );
    }

    chatApi.deleteMessageForEveryone(authFetch, messageId).catch(err =>
      console.error("Failed to delete message for everyone on backend:", err)
    );
  };

  const togglePinnedMessage = (chatId, messageId, durationHours = 168) => {
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return false;

    const currentPins = targetChat.pinnedMessageIds || [];
    const alreadyPinned = currentPins.some(p => p.id === messageId);

    if (alreadyPinned) {
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === chatId
            ? { ...c, pinnedMessageIds: (c.pinnedMessageIds || []).filter(p => p.id !== messageId) }
            : c
        )
      );
    } else {
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

    const pinOnBackend = async () => {
      try {
        const res = await chatApi.pinMessage(authFetch, chatId, messageId, durationHours);
        if (res.ok) {
          const result = await res.json();
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

  const addReaction = (messageId, emoji) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;

        const currentReactions = m.emojiReactions || [];
        const exactMatch = currentReactions.find(
          r => r.emoji === emoji && (r.userIds || []).includes('user_me')
        );

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

    const saveReaction = async () => {
      try {
        const res = await chatApi.addReaction(authFetch, messageId, emoji);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.emojiReactions) {
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

  return {
    messages,
    setMessages,
    starredMsgIds,
    toggleStarMessage,
    clearAllStarredMessages,
    getChatMessages,
    sendMessage,
    uploadFile,
    editMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    deleteMessage: deleteMessageForEveryone,
    togglePinnedMessage,
    addReaction,
    mergeMessagesPreservingStatus
  };
};
