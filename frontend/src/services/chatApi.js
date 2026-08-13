const API_BASE = "http://localhost:5000/api";

export const chatApi = {
  fetchChats: async (authFetch) => {
    const res = await authFetch(`${API_BASE}/chats`, { method: "GET" });
    return res;
  },

  fetchMessages: async (authFetch, chatId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/messages`, {
      method: "GET",
      credentials: "include"
    });
    return res;
  },

  sendMessage: async (authFetch, chatId, payload) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    return res;
  },

  uploadFile: async (authFetch, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await authFetch(`${API_BASE}/chats/upload`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    return res;
  },

  editMessage: async (authFetch, messageId, text) => {
    const res = await authFetch(`${API_BASE}/chats/messages/${messageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      credentials: "include"
    });
    return res;
  },

  deleteMessageForMe: async (authFetch, messageId) => {
    const res = await authFetch(`${API_BASE}/chats/messages/${messageId}/me`, {
      method: "DELETE",
      credentials: "include"
    });
    return res;
  },

  deleteMessageForEveryone: async (authFetch, messageId) => {
    const res = await authFetch(`${API_BASE}/chats/messages/${messageId}/everyone`, {
      method: "DELETE",
      credentials: "include"
    });
    return res;
  },

  pinMessage: async (authFetch, chatId, messageId, durationHours) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/pin-message`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, durationHours }),
      credentials: "include"
    });
    return res;
  },

  addReaction: async (authFetch, messageId, emoji) => {
    const res = await authFetch(`${API_BASE}/chats/messages/${messageId}/reaction`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
      credentials: "include"
    });
    return res;
  },

  createDirectChat: async (authFetch, userId) => {
    const res = await authFetch(`${API_BASE}/chats/direct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
      credentials: "include"
    });
    return res;
  },

  createGroup: async (authFetch, payload) => {
    const res = await authFetch(`${API_BASE}/chats/group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    return res;
  },

  leaveGroup: async (authFetch, groupId) => {
    const res = await authFetch(`${API_BASE}/chats/${groupId}/leave`, {
      method: "PUT",
      credentials: "include"
    });
    return res;
  },

  deleteGroup: async (authFetch, groupId) => {
    const res = await authFetch(`${API_BASE}/chats/${groupId}`, {
      method: "DELETE",
      credentials: "include"
    });
    return res;
  },

  toggleBlockUser: async (authFetch, targetUserIdStr) => {
    const res = await authFetch(`${API_BASE}/auth/block/${targetUserIdStr}`, {
      method: "PUT",
      credentials: "include"
    });
    return res;
  },

  reportUser: async (authFetch, payload) => {
    const res = await authFetch(`${API_BASE}/auth/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    return res;
  },

  fetchReports: async (authFetch) => {
    const res = await authFetch(`${API_BASE}/auth/admin/reports`, {
      method: "GET"
    });
    return res;
  },

  updateReportStatus: async (authFetch, reportId, status) => {
    const res = await authFetch(`${API_BASE}/auth/admin/reports/${reportId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      credentials: "include"
    });
    return res;
  },

  makeGroupAdmin: async (authFetch, chatId, targetUserId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/make-admin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
      credentials: "include"
    });
    return res;
  },

  dismissGroupAdmin: async (authFetch, chatId, targetUserId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/dismiss-admin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
      credentials: "include"
    });
    return res;
  },

  removeFromGroup: async (authFetch, chatId, targetUserId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/remove-member`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
      credentials: "include"
    });
    return res;
  },

  updateGroupProfile: async (authFetch, chatId, updates) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/group-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include"
    });
    return res;
  },

  addMembersToGroup: async (authFetch, chatId, memberIds) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/add-members`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds }),
      credentials: "include"
    });
    return res;
  },

  updateGroupPermissions: async (authFetch, chatId, permissions) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
      credentials: "include"
    });
    return res;
  },

  handleJoinRequest: async (authFetch, chatId, targetUserId, action) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/join-request`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId, action }),
      credentials: "include"
    });
    return res;
  },

  togglePinChat: async (authFetch, chatId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/pin`, {
      method: "PUT",
      credentials: "include"
    });
    return res;
  },

  toggleArchiveChat: async (authFetch, chatId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/archive`, {
      method: "PUT",
      credentials: "include"
    });
    return res;
  },

  toggleFavoriteChat: async (authFetch, chatId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/favorite`, {
      method: "PUT",
      credentials: "include"
    });
    return res;
  },

  toggleUnreadChat: async (authFetch, chatId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/unread`, {
      method: "PUT",
      credentials: "include"
    });
    return res;
  },

  clearChatMessages: async (authFetch, chatId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/clear-messages`, {
      method: "DELETE",
      credentials: "include"
    });
    return res;
  },

  deleteChat: async (authFetch, chatId) => {
    const res = await authFetch(`${API_BASE}/chats/${chatId}/delete-chat`, {
      method: "DELETE",
      credentials: "include"
    });
    return res;
  }
};
