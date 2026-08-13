import { useState, useEffect, useRef } from 'react';
import { chatApi } from '../services/chatApi';

export const useChatOperations = ({ user, authFetch, logout, fetchDbUsers, setMessages, setGroups }) => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [reports, setReports] = useState([]);
  const deletedChatIdsRef = useRef(new Set());

  const loadChats = async () => {
    try {
      const res = await chatApi.fetchChats(authFetch);
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

  const loadReports = async () => {
    try {
      const res = await chatApi.fetchReports(authFetch);
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

  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, unreadCount: 0, isUnread: false } : c))
    );
  };

  const getActiveChat = () => chats.find(c => c.id === activeChatId);

  // Sync browser desktop notification permissions & window title
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    document.title = totalUnread > 0 ? `(${totalUnread}) Sampark` : "Sampark";
  }, [chats]);

  // Admin reports effect
  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadReports();
    } else {
      setReports([]);
    }
  }, [user]);

  // Periodic polling for backend chats & active chat messages refresh
  useEffect(() => {
    if (!user) {
      setChats([]);
      if (typeof setMessages === 'function') setMessages([]);
      if (typeof setGroups === 'function') setGroups([]);
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
    }, 4000);

    return () => clearInterval(interval);
  }, [user]);

  // Clear unread count when chat becomes active
  useEffect(() => {
    if (activeChatId) {
      setChats(prevChats =>
        prevChats.map(c => (c.id === activeChatId || c.groupId === activeChatId ? { ...c, unreadCount: 0, isUnread: false } : c))
      );
    }
  }, [activeChatId]);

  const createDirectChat = async (userId) => {
    try {
      const res = await chatApi.createDirectChat(authFetch, userId);
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

  const toggleBlockUserOnBackend = async (targetUserId) => {
    if (!targetUserId) return;
    const targetStr = targetUserId.toString();

    setBlockedUserIds(prev => {
      const prevStrings = (prev || []).map(id => id.toString());
      return prevStrings.includes(targetStr)
        ? prevStrings.filter(id => id !== targetStr)
        : [...prevStrings, targetStr];
    });

    try {
      const res = await chatApi.toggleBlockUser(authFetch, targetStr);
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

  const blockUser = (userId) => toggleBlockUserOnBackend(userId);
  const unblockUser = (userId) => toggleBlockUserOnBackend(userId);

  const reportUser = async (reportedUserId, messageText, reason) => {
    try {
      const res = await chatApi.reportUser(authFetch, { reportedUserId, messageText, reason });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.report && user?.role === 'Admin') {
          loadReports();
        }
      }
    } catch (err) {
      console.error("Failed to submit report:", err);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const res = await chatApi.updateReportStatus(authFetch, reportId, newStatus);
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error("Failed to update report status:", err);
    }
  };

  const togglePinChat = async (chatId) => {
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, pinned: !c.pinned } : c))
    );
    try {
      const res = await chatApi.togglePinChat(authFetch, chatId);
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
      const res = await chatApi.toggleArchiveChat(authFetch, chatId);
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
      const res = await chatApi.toggleFavoriteChat(authFetch, chatId);
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
      await chatApi.toggleUnreadChat(authFetch, chatId);
    } catch (err) {
      console.error("Failed to toggle unread chat:", err);
    }
  };

  const clearChatMessages = async (chatId) => {
    if (typeof setMessages === 'function') {
      setMessages(prev => prev.filter(m => m.chatId !== chatId));
    }
    setChats(prevChats =>
      prevChats.map(c => (c.id === chatId ? { ...c, lastMessage: null, lastMessageId: null } : c))
    );
    try {
      await chatApi.clearChatMessages(authFetch, chatId);
    } catch (err) {
      console.error("Failed to clear chat messages:", err);
    }
  };

  const deleteChat = async (chatId) => {
    if (!chatId) return;
    deletedChatIdsRef.current.add(chatId.toString());
    if (typeof setMessages === 'function') {
      setMessages(prev => prev.filter(m => m.chatId !== chatId));
    }
    setChats(prevChats => prevChats.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    try {
      const res = await chatApi.deleteChat(authFetch, chatId);
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

  return {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    typingUsers,
    setTypingUsers,
    blockedUserIds,
    setBlockedUserIds,
    reports,
    deletedChatIdsRef,
    loadChats,
    selectChat,
    getActiveChat,
    createDirectChat,
    blockUser,
    unblockUser,
    reportUser,
    updateReportStatus,
    togglePinChat,
    toggleArchiveChat,
    toggleFavoriteChat,
    toggleUnreadChat,
    clearChatMessages,
    deleteChat
  };
};
