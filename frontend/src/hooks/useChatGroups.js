import { useState, useEffect } from 'react';
import { chatApi } from '../services/chatApi';

export const useChatGroups = ({ authFetch, logout, chats, setChats, setActiveChatId }) => {
  const [groups, setGroups] = useState([]);

  // Sync groups state from group chat objects
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

      const res = await chatApi.createGroup(authFetch, {
        name: gName,
        description: gDesc,
        participantIds: gMembers || [],
        avatar: gAvatar
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const newChat = result.data.chat;
          setChats(prev => {
            if (prev.some(c => c.id === newChat.id)) return prev;
            return [newChat, ...prev];
          });
          if (typeof setActiveChatId === 'function') setActiveChatId(newChat.id);
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
      const res = await chatApi.leaveGroup(authFetch, groupId);
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setChats(prevChats => prevChats.filter(c => c.id !== groupId && c.groupId !== groupId));
        if (typeof setActiveChatId === 'function') setActiveChatId(null);
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
      const res = await chatApi.deleteGroup(authFetch, groupId);
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setChats(prevChats => prevChats.filter(c => c.id !== groupId && c.groupId !== groupId));
        if (typeof setActiveChatId === 'function') setActiveChatId(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to dissolve group on backend:", err);
      return false;
    }
  };

  const makeGroupAdmin = async (chatId, targetUserId) => {
    try {
      const res = await chatApi.makeGroupAdmin(authFetch, chatId, targetUserId);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.adminIds) {
          setGroups(prev => prev.map(g => g.id === chatId ? { ...g, adminIds: result.data.adminIds } : g));
          setChats(prevChats => prevChats.map(c => c.id === chatId ? { ...c, adminIds: result.data.adminIds } : c));
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
      const res = await chatApi.dismissGroupAdmin(authFetch, chatId, targetUserId);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.adminIds) {
          setGroups(prev => prev.map(g => g.id === chatId ? { ...g, adminIds: result.data.adminIds } : g));
          setChats(prevChats => prevChats.map(c => c.id === chatId ? { ...c, adminIds: result.data.adminIds } : c));
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
      const res = await chatApi.removeFromGroup(authFetch, chatId, targetUserId);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setGroups(prev =>
            prev.map(g => g.id === chatId ? { ...g, memberIds: result.data.participants, adminIds: result.data.adminIds } : g)
          );
          setChats(prevChats =>
            prevChats.map(c => c.id === chatId ? { ...c, participants: result.data.participants, adminIds: result.data.adminIds } : c)
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
      const res = await chatApi.updateGroupProfile(authFetch, chatId, updates);
      if (res.status === 401) {
        if (typeof logout === 'function') logout();
        return false;
      }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prev => prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c)));
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId
                ? { ...g, name: updatedChat.name, description: updatedChat.description, avatar: updatedChat.avatar }
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
      const res = await chatApi.addMembersToGroup(authFetch, chatId, memberIds);
      if (res.status === 401) {
        if (typeof logout === 'function') logout();
        return { success: false };
      }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prev => prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c)));
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
      const res = await chatApi.updateGroupPermissions(authFetch, chatId, permissions);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prev => prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c)));
          setGroups(prev =>
            prev.map(g =>
              g.id === chatId
                ? { ...g, permissions: updatedChat.permissions, joinRequests: updatedChat.joinRequests }
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
      const res = await chatApi.handleJoinRequest(authFetch, chatId, targetUserId, action);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.chat) {
          const updatedChat = result.data.chat;
          setChats(prev => prev.map(c => (c.id === chatId || c.groupId === chatId ? { ...c, ...updatedChat } : c)));
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

  return {
    groups,
    setGroups,
    createGroup,
    updateGroup,
    leaveGroup,
    deleteGroup,
    makeGroupAdmin,
    dismissGroupAdmin,
    removeFromGroup,
    updateGroupProfile,
    addMembersToGroup,
    updateGroupPermissions,
    handleJoinRequest
  };
};
