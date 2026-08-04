import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, Pin, Check, CheckCheck, Users, MessageCircle, MoreVertical, 
  Camera, X, VolumeX, Mail, BellOff, UserPlus, ArrowLeft, ChevronRight,
  ChevronDown, Archive, Star, Trash2, Eraser
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Tooltip } from '../../components/ui/Tooltip';

export const SidebarLeft = ({ closeMobileSidebar }) => {
  const { 
    chats, messages, groups, selectChat, activeChatId, createGroup, createDirectChat, uploadFile,
    togglePinChat, toggleArchiveChat, toggleFavoriteChat, toggleUnreadChat, clearChatMessages, deleteChat
  } = useChat();
  const { user, allUsers } = useAuth();
  const { showToast } = useNotifications();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'favorites' | 'groups' | 'archived'

  // Context menu state for chat items
  const [openMenuChatId, setOpenMenuChatId] = useState(null);
  const menuContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setOpenMenuChatId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Floating plus menu state
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  // Group creation modal 2-step wizard state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupStep, setGroupStep] = useState(1); // 1: Select members, 2: Group info & details
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupAvatarFile, setGroupAvatarFile] = useState(null);
  const [groupAvatarUrl, setGroupAvatarUrl] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isUploadingGroupAvatar, setIsUploadingGroupAvatar] = useState(false);

  // New Contact modal state
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');

  const groupAvatarInputRef = useRef(null);

  // Fetch target info of a direct chat (recipient user profile)
  const getDirectChatInfo = (chat) => {
    const recipientId = chat.participants.find(p => p !== 'user_me');
    const recipient = allUsers.find(u => u.id === recipientId || u._id?.toString() === recipientId);
    if (!recipient) {
      return { name: "Unknown User", status: "offline", avatar: "", avatarColor: "from-slate-500 to-slate-600" };
    }
    return {
      ...recipient,
      status: recipient.isOnline ? 'online' : 'offline'
    };
  };

  // Fetch target info of a group chat
  const getGroupChatInfo = (chat) => {
    const group = groups.find(g => g.id === chat.groupId);
    return group || { name: "Unknown Group", description: "", avatar: "", avatarColor: "from-indigo-650 to-indigo-650" };
  };

  // Get last message text snippet
  const getLastMessageText = (chat) => {
    if (chat.lastMessage) {
      const msg = chat.lastMessage;
      if (msg.isDeleted) return "This message was deleted.";
      if (msg.type === 'image') return "📷 Image file";
      if (msg.type === 'file') return "📄 Document PDF";
      return msg.text;
    }
    return "No messages yet";
  };

  // Handle member checkbox toggle
  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  // Handle avatar upload click
  const handleGroupAvatarClick = () => {
    groupAvatarInputRef.current?.click();
  };

  // Handle avatar file change
  const handleGroupAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Invalid File Type", "Please select an image file.", "danger");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("File Too Large", "Max image size allowed is 5MB.", "danger");
        return;
      }
      setIsUploadingGroupAvatar(true);
      const uploadedData = await uploadFile(file);
      setIsUploadingGroupAvatar(false);

      if (uploadedData && uploadedData.url) {
        setGroupAvatarUrl(uploadedData.url);
        showToast("Image Uploaded", "Group avatar icon ready.", "info");
      } else {
        const localUrl = URL.createObjectURL(file);
        setGroupAvatarUrl(localUrl);
      }
    }
  };

  // Submit handler for creating group space
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast("Validation Error", "Please enter a group space name.", "warning");
      return;
    }
    if (selectedMembers.length === 0) {
      showToast("Validation Error", "Please select at least 1 member for the group.", "warning");
      return;
    }

    const newGroup = await createGroup({
      name: groupName.trim(),
      description: groupDesc.trim(),
      avatar: groupAvatarUrl,
      members: selectedMembers
    });

    if (newGroup) {
      showToast("Group Created", `Group space "${groupName}" created successfully!`, "success");
      setIsGroupModalOpen(false);
      setGroupStep(1);
      setGroupName('');
      setGroupDesc('');
      setSelectedMembers([]);
      setGroupAvatarFile(null);
      setGroupAvatarUrl('');
      setMemberSearchQuery('');
    } else {
      showToast("Creation Failed", "Could not create group space.", "danger");
    }
  };

  // Submit handler for searching & adding new contact
  const handleStartDirectChat = async (foundUser) => {
    const targetId = foundUser.id || foundUser._id?.toString();

    // Check if direct chat already exists
    const existingChat = chats.find(
      c => c.type === 'direct' && (c.participants.includes(targetId) || c.participants.includes(foundUser.id))
    );

    if (existingChat) {
      selectChat(existingChat.id);
      showToast("Chat Opened", `Opened direct chat with ${foundUser.name}.`, "info");
    } else {
      const newChat = await createDirectChat(targetId);
      if (newChat) {
        selectChat(newChat.id || newChat);
        showToast("Contact Added", `Added ${foundUser.name} to chats.`, "success");
      } else {
        showToast("Error", "Could not start chat with contact.", "danger");
      }
    }

    setIsNewContactModalOpen(false);
    setContactEmail('');
    setContactName('');
  };

  // Filter chats by search query and active tab filter
  const filteredChats = chats
    .filter(chat => {
      const isDirect = chat.type === 'direct';
      const info = isDirect ? getDirectChatInfo(chat) : getGroupChatInfo(chat);

      // Search Filter
      const matchesSearch = searchQuery === '' || 
        info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (isDirect && info.email?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Archived filter tab handling
      if (activeFilter === 'archived') {
        return matchesSearch && !!chat.archived;
      }
      
      // For non-archived tabs, exclude archived chats
      if (chat.archived) return false;

      // Category Tag Filter
      let matchesCategory = true;
      if (activeFilter === 'unread') {
        matchesCategory = (chat.unreadCount || 0) > 0 || chat.isUnread;
      } else if (activeFilter === 'favorites') {
        matchesCategory = !!chat.favorite;
      } else if (activeFilter === 'groups') {
        matchesCategory = chat.type === 'group';
      }

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdTime || 0) - new Date(a.createdTime || 0);
    });

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 select-none relative" ref={menuContainerRef}>
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 space-y-3.5 shrink-0">
          <div className="flex items-center">
            <div className="text-left">
              <h1 className="text-lg font-black tracking-tight text-slate-950 dark:text-white uppercase font-sans leading-none">
                SAMPARK
              </h1>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                Chats & Groups
              </p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4.5 w-4.5 my-auto" />
            <input
              type="text"
              placeholder="Search or start a new chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-2.5 pl-10 pr-9 outline-none text-slate-800 dark:text-white transition-all font-semibold"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* WhatsApp Filter Tags */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar select-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'favorites', label: 'Favorites' },
              { id: 'groups', label: 'Groups' },
              { id: 'archived', label: 'Archived' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0
                  ${activeFilter === filter.id
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat / Group Roster List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <MessageCircle className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-xs font-semibold">No chats found</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isDirect = chat.type === 'direct';
              const info = isDirect ? getDirectChatInfo(chat) : getGroupChatInfo(chat);
              const isActive = chat.id === activeChatId;
              const lastMsgText = getLastMessageText(chat);

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    selectChat(chat.id);
                    if (closeMobileSidebar) closeMobileSidebar();
                  }}
                  className={`
                    p-3.5 border-b border-slate-100/60 dark:border-slate-800/40 flex items-center gap-3 cursor-pointer transition-colors text-left relative group
                    ${isActive 
                      ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-l-4 border-l-indigo-600 dark:border-l-indigo-500' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Avatar
                    src={info.avatar}
                    name={info.name}
                    size="md"
                    status={isDirect ? info.status : null}
                    color={info.avatarColor}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {info.name}
                        </h3>
                        {chat.pinned && (
                          <Pin className="h-3 w-3 text-emerald-500 shrink-0 transform rotate-45 fill-emerald-500" />
                        )}
                      </div>
                      {chat.lastMessage && (
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {new Date(chat.lastMessage.createdAt || chat.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-semibold">
                        {lastMsgText}
                      </p>

                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        {chat.unreadCount > 0 && (
                          <Badge variant="primary">
                            {chat.unreadCount}
                          </Badge>
                        )}

                        {/* Hover action dropdown trigger button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Context Dropdown Menu */}
                  {openMenuChatId === chat.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-3 top-10 z-50 bg-slate-900/95 dark:bg-slate-950 backdrop-blur-md text-slate-200 rounded-xl shadow-2xl border border-slate-700/80 py-1.5 w-48 text-xs font-semibold select-none animate-in fade-in zoom-in-95"
                    >
                      <button
                        onClick={() => {
                          toggleArchiveChat(chat.id);
                          setOpenMenuChatId(null);
                          showToast(chat.archived ? "Chat Unarchived" : "Chat Archived", chat.archived ? "Chat restored to main list" : "Moved to Archived folder", "info");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                      >
                        <Archive className="h-4 w-4 text-slate-400" />
                        {chat.archived ? "Unarchive chat" : "Archive chat"}
                      </button>

                      <button
                        onClick={() => {
                          togglePinChat(chat.id);
                          setOpenMenuChatId(null);
                          showToast(chat.pinned ? "Chat Unpinned" : "Chat Pinned", chat.pinned ? "Unpinned from top" : "Pinned to top of chat list", "info");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                      >
                        <Pin className="h-4 w-4 text-slate-400" />
                        {chat.pinned ? "Unpin chat" : "Pin chat"}
                      </button>

                      <button
                        onClick={() => {
                          toggleUnreadChat(chat.id);
                          setOpenMenuChatId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                      >
                        <Mail className="h-4 w-4 text-slate-400" />
                        {chat.isUnread || chat.unreadCount > 0 ? "Mark as read" : "Mark as unread"}
                      </button>

                      <button
                        onClick={() => {
                          toggleFavoriteChat(chat.id);
                          setOpenMenuChatId(null);
                          showToast(chat.favorite ? "Removed from Favorites" : "Added to Favorites", chat.favorite ? "Removed from Favorites filter" : "Added to Favorites filter", "info");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                      >
                        <Star className={`h-4 w-4 ${chat.favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                        {chat.favorite ? "Remove from Favorites" : "Add to Favorites"}
                      </button>

                      <div className="my-1 border-t border-slate-800" />

                      <button
                        onClick={() => {
                          clearChatMessages(chat.id);
                          setOpenMenuChatId(null);
                          showToast("Chat Cleared", "Messages cleared for this conversation.", "info");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left text-amber-400"
                      >
                        <Eraser className="h-4 w-4" />
                        Clear chat
                      </button>

                      <button
                        onClick={() => {
                          deleteChat(chat.id);
                          setOpenMenuChatId(null);
                          showToast("Chat Deleted", "Conversation deleted successfully.", "warning");
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left text-rose-400 font-bold"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete chat
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Floating Plus Action Button */}
        <div className="absolute bottom-5 right-5 z-20">
          {isPlusMenuOpen && (
            <div className="mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 min-w-48 select-none space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setGroupStep(1);
                  setSelectedMembers([]);
                  setGroupName('');
                  setGroupDesc('');
                  setGroupAvatarUrl('');
                  setIsGroupModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
              >
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <span className="block font-black text-slate-900 dark:text-white">New Group</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold block">Create group with members</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setContactEmail('');
                  setContactName('');
                  setIsNewContactModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer text-left"
              >
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <span className="block font-black text-slate-900 dark:text-white">New Contact</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold block">Search DB user by email</span>
                </div>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
            className={`p-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 flex items-center justify-center ${
              isPlusMenuOpen ? 'rotate-45 bg-slate-900 dark:bg-slate-800' : ''
            }`}
            title="New Action Menu"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

      </div>

      {/* NEW CONTACT MODAL */}
      <Modal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        title="Start New Chat"
        size="md"
      >
        <div className="space-y-4 text-left p-1 select-none">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4.5 w-4.5 my-auto" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="block w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-2.5 pl-10 outline-none text-slate-800 dark:text-white font-semibold"
            />
          </div>

          <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1.5 bg-slate-50 dark:bg-slate-950/20 no-scrollbar">
            {allUsers
              .filter(u => {
                const uId = u.id || u._id?.toString();
                const myRealId = user?.id || user?._id?.toString();
                const isAdmin = u.role === 'admin' || u.role === 'Admin';
                return uId !== 'user_me' && uId !== myRealId && u.email !== user?.email &&
                  !isAdmin &&
                  (u.name.toLowerCase().includes(contactEmail.toLowerCase()) || 
                   u.email.toLowerCase().includes(contactEmail.toLowerCase()));
              })
              .map((u) => {
                const targetId = u.id || u._id?.toString();
                return (
                  <div
                    key={targetId}
                    onClick={() => handleStartDirectChat(u)}
                    className="p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/60 cursor-pointer transition-colors border bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size="sm" color={u.avatarColor} />
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">{u.email}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {allUsers.filter(u => {
                const uId = u.id || u._id?.toString();
                const myRealId = user?.id || user?._id?.toString();
                const isAdmin = u.role === 'admin' || u.role === 'Admin';
                return uId !== 'user_me' && uId !== myRealId && u.email !== user?.email && !isAdmin && (u.name.toLowerCase().includes(contactEmail.toLowerCase()) || u.email.toLowerCase().includes(contactEmail.toLowerCase()));
              }).length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500 font-semibold">
                  No users found
                </div>
              )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewContactModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-extrabold"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2-STEP NEW GROUP WIZARD MODAL */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setGroupStep(1);
          setGroupName('');
          setGroupDesc('');
          setSelectedMembers([]);
          setGroupAvatarFile(null);
          setGroupAvatarUrl('');
          setMemberSearchQuery('');
        }}
        title={groupStep === 1 ? "Create Group - Select Members (1/2)" : "Create Group - Group Details (2/2)"}
        size="md"
      >
        <form onSubmit={handleCreateGroupSubmit} className="space-y-5 text-left p-1 select-none">
          
          {/* STEP 1: Select Members */}
          {groupStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Select members to add to the group ({selectedMembers.length} selected)
                </span>
              </div>

              {/* Selected member chips */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-100/70 dark:bg-slate-950 rounded-xl max-h-24 overflow-y-auto border border-slate-200/60 dark:border-slate-800">
                  {selectedMembers.map(memberId => {
                    const m = allUsers.find(u => u.id === memberId || u._id?.toString() === memberId);
                    if (!m) return null;
                    return (
                      <div 
                        key={memberId} 
                        className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-1.5 pr-2.5 py-1 rounded-full text-[10px] font-black text-slate-800 dark:text-slate-200 shadow-2xs"
                      >
                        <Avatar src={m.avatar} name={m.name} size="xs" color={m.avatarColor} />
                        <span>{m.name.split(' ')[0]}</span>
                        <button 
                          type="button" 
                          onClick={() => handleToggleMember(memberId)}
                          className="text-slate-400 hover:text-rose-500 transition-colors ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* In-modal member search */}
              <div className="relative">
                <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4.5 w-4.5 my-auto" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="block w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-2.5 pl-10 outline-none text-slate-800 dark:text-white font-semibold"
                />
              </div>

              {/* Scrollable list of members */}
              <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1.5 bg-slate-50 dark:bg-slate-950/20 no-scrollbar">
                {allUsers
                  .filter(u => {
                    const uId = u.id || u._id?.toString();
                    const myRealId = user?.id || user?._id?.toString();
                    const isAdmin = u.role === 'admin' || u.role === 'Admin';
                    return uId !== 'user_me' && uId !== myRealId && u.email !== user?.email &&
                      !isAdmin &&
                      (u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) || 
                       u.email.toLowerCase().includes(memberSearchQuery.toLowerCase()));
                  })
                  .map((u) => {
                    const uId = u.id || u._id?.toString();
                    const isSelected = selectedMembers.includes(uId);
                    return (
                      <div
                        key={uId}
                        onClick={() => handleToggleMember(uId)}
                        className={`
                          p-2.5 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/60 cursor-pointer transition-colors border ${
                            isSelected 
                              ? 'bg-indigo-50/80 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/40' 
                              : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={u.avatar} name={u.name} size="sm" color={u.avatarColor} />
                          <div className="text-left min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">{u.email}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by container click
                          className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsGroupModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  variant="primary"
                  disabled={selectedMembers.length === 0}
                  onClick={() => setGroupStep(2)}
                  className="gap-1.5"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Group Info & Selected Members Roster Preview */}
          {groupStep === 2 && (
            <div className="space-y-4">
              
              {/* Avatar Upload Container */}
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <div className="relative group cursor-pointer" onClick={handleGroupAvatarClick}>
                  <Avatar
                    src={groupAvatarUrl}
                    name={groupName || "New Group"}
                    size="xl"
                    className="h-20 w-20 border-2 border-slate-200 dark:border-slate-800 object-cover shadow-md rounded-full transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={groupAvatarInputRef}
                    onChange={handleGroupAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  {isUploadingGroupAvatar ? "Uploading icon..." : "Group Space Icon (Click to change)"}
                </span>
              </div>

              {/* Group Name Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Group Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Developer Space, Marketing Team"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  className="block w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 outline-none text-slate-900 dark:text-white transition-all font-semibold shadow-xs"
                />
              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Provide a short summary of what this group space is about..."
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="block w-full rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs p-3.5 outline-none text-slate-900 dark:text-white transition-all min-h-[70px] shadow-xs resize-none font-semibold"
                />
              </div>

              {/* Selected Members Roster Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Selected Members ({selectedMembers.length})
                </label>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {selectedMembers.map(memberId => {
                    const m = allUsers.find(u => u.id === memberId || u._id?.toString() === memberId);
                    if (!m) return null;
                    return (
                      <div 
                        key={memberId}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={m.avatar} name={m.name} size="sm" color={m.avatarColor} />
                          <div className="min-w-0 text-left">
                            <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{m.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">{m.email}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleMember(memberId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setGroupStep(1)}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="submit" variant="primary" className="rounded-xl shadow-md">
                  Create Group Space
                </Button>
              </div>
            </div>
          )}

        </form>
      </Modal>
    </>
  );
};

export default SidebarLeft;
