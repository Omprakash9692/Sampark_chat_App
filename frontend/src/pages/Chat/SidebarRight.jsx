import React, { useState, useRef,useEffect } from 'react';
import {
  X, Mail, Calendar, UserX, AlertTriangle, LogOut, Trash,
  ChevronRight, ImageIcon, FileText, Link as LinkIcon, Users, UserCheck, Shield,
  Pencil, Camera, UserPlus, MessageSquare, UserMinus, ShieldCheck, ChevronDown, Check,
  Star, StarOff, ArrowLeft, Search, MoreVertical
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export const SidebarRight = ({ onClose }) => {
  const {
    activeChatId, getActiveChat, getChatMessages, groups,
    blockUser, unblockUser, blockedUserIds, reportUser, leaveGroup, deleteGroup,
    makeGroupAdmin, dismissGroupAdmin, removeFromGroup, addMembersToGroup, updateGroupProfile, uploadFile,
    createDirectChat, updateGroupPermissions, handleJoinRequest
  } = useChat();
  const { user: authUser, allUsers } = useAuth();
  const { showToast } = useNotifications();

  // Media tabs
  const [activeMediaTab, setActiveMediaTab] = useState('media'); // 'media' | 'files' | 'links'

  // Dialog triggers
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);

  // Add members modal state
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [selectedMemberIdsToAdd, setSelectedMemberIdsToAdd] = useState([]);

  // Member popover menu state
  const [activeMemberMenuId, setActiveMemberMenuId] = useState(null);

  // Edit group profile modal state
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupAvatarUrl, setEditGroupAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const editAvatarInputRef = useRef(null);

  // Starred Messages view states
  const [showStarredView, setShowStarredView] = useState(false);
  const [starredSearchQuery, setStarredSearchQuery] = useState('');
  const [isUnstarMenuOpen, setIsUnstarMenuOpen] = useState(false);
  const [isUnstarConfirmModalOpen, setIsUnstarConfirmModalOpen] = useState(false);
  const [starredMsgIds, setStarredMsgIds] = useState(() => JSON.parse(localStorage.getItem('starredMsgIds') || '[]'));

  // Sync starredMsgIds whenever showStarredView toggles
  useEffect(() => {
    if (showStarredView) {
      setStarredMsgIds(JSON.parse(localStorage.getItem('starredMsgIds') || '[]'));
    }
  }, [showStarredView]);

  const handleUnstarSingleMessage = (msgId) => {
    const updated = starredMsgIds.filter(id => id !== msgId);
    setStarredMsgIds(updated);
    localStorage.setItem('starredMsgIds', JSON.stringify(updated));
    showToast("Message Unstarred", "Removed message from starred list.", "info");
  };

  const handleConfirmUnstarAll = () => {
    setStarredMsgIds([]);
    localStorage.setItem('starredMsgIds', '[]');
    setIsUnstarConfirmModalOpen(false);
    setIsUnstarMenuOpen(false);
    showToast("All Messages Unstarred", "Starred messages list cleared.", "success");
  };



  const activeChat = getActiveChat();
  const messages = getChatMessages(activeChatId);

  if (!activeChat) return null;

  const isDirect = activeChat.type === 'direct';

  const recipient = isDirect
    ? allUsers.find(u => u.id === activeChat.participants.find(p => p !== 'user_me'))
    : null;
  const group = !isDirect
    ? groups.find(g => g.id === activeChat.groupId)
    : null;

  const title = isDirect ? recipient?.name : group?.name;
  const coverImage = isDirect ? recipient?.coverImage : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";

  // Filter messages for shared attachments
  const sharedImages = messages.filter(m => m.type === 'image');
  const sharedDocs = messages.filter(m => m.type === 'file');

  // Extract shared links dynamically from chat message history
  const sharedLinks = [];
  const urlRegex = /(https?:\/\/[^\s\n\r]+)/gi;
  messages.forEach(m => {
    if (m.text && !m.isDeleted) {
      const matches = m.text.match(urlRegex);
      if (matches) {
        matches.forEach(url => {
          let cleanUrl = url;
          // Trim trailing common punctuation marks that might be part of sentence structure but not the URL
          if (/[.,;:!?)]$/.test(cleanUrl)) {
            cleanUrl = cleanUrl.slice(0, -1);
          }

          let displayDomain = cleanUrl;
          try {
            const parsed = new URL(cleanUrl);
            displayDomain = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
          } catch (e) {
            displayDomain = cleanUrl.replace(/^https?:\/\/(www\.)?/, '');
          }

          if (displayDomain.length > 35) {
            displayDomain = displayDomain.substring(0, 32) + '...';
          }

          const sender = allUsers.find(u => u.id === m.senderId || u._id?.toString() === m.senderId) || (m.senderId === 'user_me' ? authUser : null);
          const senderName = sender ? sender.name : "Someone";

          // Avoid duplicate links in the tab view
          if (!sharedLinks.some(link => link.url === cleanUrl)) {
            sharedLinks.push({
              url: cleanUrl,
              display: displayDomain,
              senderName,
              timestamp: new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
            });
          }
        });
      }
    }
  });

  const mediaTabs = [
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'links', label: 'Links', icon: LinkIcon }
  ];

  const handleBlockToggle = () => {
    if (isDirect && recipient) {
      const isBlocked = blockedUserIds.includes(recipient.id);
      if (isBlocked) {
        unblockUser(recipient.id);
        showToast("Access Restored", `${recipient.name} is now unblocked.`, "success");
      } else {
        blockUser(recipient.id);
        showToast("Access Revoked", `${recipient.name} has been blocked.`, "warning");
      }
      setIsBlockModalOpen(false);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (isDirect && recipient) {
      reportUser(recipient.id, messages[messages.length - 1]?.text || 'No message history', `${reportReason}: ${reportDetails}`);
      showToast("Report Submitted", "Your complaint has been queued for administrator review.", "success");
      setIsReportModalOpen(false);
      setReportDetails('');
    }
  };

  const handleLeaveGroup = async () => {
    if (group) {
      const success = await leaveGroup(group.id);
      if (success) {
        showToast("Space Left", `You exited the "${group.name}" group.`, "info");
      } else {
        showToast("Action Failed", "Could not leave group space.", "danger");
      }
      setIsLeaveModalOpen(false);
      if (onClose) onClose();
    }
  };

  const handleDeleteGroup = async () => {
    if (group) {
      const success = await deleteGroup(group.id);
      if (success) {
        showToast("Space Dissolved", `The "${group.name}" group has been fully deleted.`, "warning");
      } else {
        showToast("Action Failed", "Could not dissolve group space.", "danger");
      }
      setIsDeleteGroupModalOpen(false);
      if (onClose) onClose();
    }
  };

  const myRealId = authUser?.id || authUser?._id?.toString();
  const amIAdmin = !isDirect && group && (group.adminIds || []).some(
    id => id === 'user_me' || id === myRealId
  );

  const handleOpenEditGroupModal = () => {
    if (group) {
      setEditGroupName(group.name || '');
      setEditGroupDesc(group.description || '');
      setEditGroupAvatarUrl(group.avatar || '');
      setIsEditGroupModalOpen(true);
    }
  };

  const handleAvatarFileChange = async (e) => {
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
      setIsUploadingAvatar(true);
      const uploadedData = await uploadFile(file);
      setIsUploadingAvatar(false);

      if (uploadedData && uploadedData.url) {
        setEditGroupAvatarUrl(uploadedData.url);
        showToast("Image Uploaded", "New group avatar ready to save.", "info");
      } else {
        const localUrl = URL.createObjectURL(file);
        setEditGroupAvatarUrl(localUrl);
        showToast("Avatar Selected", "Local image selected for group profile.", "info");
      }
    }
  };

  const handleSaveGroupProfile = async (e) => {
    e.preventDefault();
    if (!editGroupName.trim()) {
      showToast("Validation Error", "Group name cannot be empty.", "warning");
      return;
    }

    const success = await updateGroupProfile(group.id, {
      name: editGroupName.trim(),
      description: editGroupDesc.trim(),
      avatar: editGroupAvatarUrl
    });

    if (success) {
      showToast("Group Updated", "Group profile settings saved successfully.", "success");
      setIsEditGroupModalOpen(false);
    } else {
      showToast("Update Failed", "Could not save group profile settings.", "danger");
    }
  };

  const handleTogglePermission = async (key, newValue) => {
    if (!group || !amIAdmin) return;
    const currentPermissions = group.permissions || { sendMessages: true, addMembers: true, approveMembers: false };
    const updatedPermissions = { ...currentPermissions, [key]: newValue };
    const success = await updateGroupPermissions(group.id, updatedPermissions);
    if (success) {
      showToast("Permissions Updated", "Group space permissions updated.", "success");
    } else {
      showToast("Update Failed", "Could not update group permissions.", "danger");
    }
  };

  const handleAddMembersSubmit = async (e) => {
    e.preventDefault();
    if (selectedMemberIdsToAdd.length === 0) {
      showToast("Validation Error", "Please select at least one member to add.", "warning");
      return;
    }

    const res = await addMembersToGroup(group.id, selectedMemberIdsToAdd);
    if (res && res.success) {
      if (res.isPending) {
        showToast("Request Sent", "Join request submitted to group admin for approval.", "info");
      } else {
        showToast("Members Added", `${selectedMemberIdsToAdd.length} member(s) added successfully.`, "success");
      }
      setIsAddMembersModalOpen(false);
      setSelectedMemberIdsToAdd([]);
    } else {
      showToast("Action Failed", "Could not add members to space.", "danger");
    }
  };

  const isBlocked = isDirect && recipient ? blockedUserIds.includes(recipient.id) : false;

  const starredMessagesList = messages.filter(m => starredMsgIds.includes(m.id)).filter(m => {
    if (!starredSearchQuery.trim()) return true;
    const query = starredSearchQuery.toLowerCase();
    const sender = allUsers.find(u => u.id === m.senderId);
    return (m.text && m.text.toLowerCase().includes(query)) || (sender && sender.name.toLowerCase().includes(query));
  });

  if (showStarredView) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800">

        {/* Top Header */}
        <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 select-none bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStarredView(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Back to Contact Info"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Starred messages
            </h4>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsUnstarMenuOpen(!isUnstarMenuOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {/* Three Dot Dropdown Menu */}
            {isUnstarMenuOpen && (
              <div
                className="absolute right-0 top-10 z-50 bg-slate-900/95 dark:bg-slate-950 text-slate-200 rounded-xl shadow-2xl border border-slate-700/80 py-1.5 w-40 text-xs font-semibold select-none animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={() => {
                    setIsUnstarMenuOpen(false);
                    if (starredMsgIds.length === 0) {
                      showToast("No Starred Messages", "You have no starred messages to remove.", "info");
                      return;
                    }
                    setIsUnstarConfirmModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left text-slate-200 cursor-pointer"
                >
                  <StarOff className="h-4 w-4 text-slate-400" />
                  Unstar all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search starred messages..."
              value={starredSearchQuery}
              onChange={(e) => setStarredSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 border border-transparent focus:border-indigo-500 focus:outline-none transition-all"
            />
            {starredSearchQuery && (
              <button
                onClick={() => setStarredSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Messages List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {starredMessagesList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="h-14 w-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
                <Star className="h-7 w-7 fill-amber-500/20 text-amber-500" />
              </div>
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">No starred messages</h5>
              <p className="text-xs text-slate-450 dark:text-slate-500 max-w-xs leading-relaxed">
                {starredSearchQuery ? "No starred messages match your search filter." : "Hover over any message and select Star to save it here."}
              </p>
            </div>
          ) : (
            starredMessagesList.map((msg) => {
              const isMe = msg.senderId === 'user_me';
              const sender = isMe ? authUser : (allUsers.find(u => u.id === msg.senderId) || { name: 'Unknown User' });
              const recipientName = isDirect ? recipient?.name : group?.name;
              const dateStr = new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id}
                  className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-750 rounded-2xl p-3 space-y-2 text-left transition-all hover:border-indigo-400 dark:hover:border-slate-600 shadow-2xs relative group"
                >
                  {/* Sender & Recipient Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-750 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={sender.avatar} name={sender.name} size="xs" color={sender.avatarColor} />
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {sender.name} <span className="text-slate-400 font-normal">▸</span> {isMe ? recipientName : 'You'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-450 font-semibold">{dateStr}</span>
                      <button
                        onClick={() => handleUnstarSingleMessage(msg.id)}
                        className="p-1 rounded-md text-slate-450 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Unstar Message"
                      >
                        <StarOff className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Bubble Content */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed relative">
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                    {msg.attachmentName && (
                      <div className="flex items-center gap-2 mt-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{msg.attachmentName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-slate-400 font-bold">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span>{timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Unstar All Confirmation Modal */}
        <Modal
          isOpen={isUnstarConfirmModalOpen}
          onClose={() => setIsUnstarConfirmModalOpen(false)}
          title="Unstar all messages?"
        >
          <div className="space-y-4 py-2 text-left">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Are you sure you want to unstar all messages? This action will clear all saved starred messages.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUnstarConfirmModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmUnstarAll}
              >
                Unstar all
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    );
  }


  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f0f4f8] border-l border-slate-200/80 select-none">


        {/* Header */}
        <div className="h-16 px-4 border-b border-[#e9edef] bg-[#f0f2f5] flex items-center justify-between shrink-0 select-none">
          <h4 className="text-sm font-bold text-[#111b21] uppercase tracking-wider">
            {isDirect ? "Contact Details" : "Group Space Details"}
          </h4>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Main details body scroll */}
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* Profile Info Section */}
          <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center bg-white border-b border-slate-200/80">
            <div className="mb-3.5 relative inline-block">
              <Avatar
                src={isDirect ? recipient?.avatar : group?.avatar}
                name={title}
                size="xl"
                color={isDirect ? recipient?.avatarColor : group?.avatarColor}
                className="shadow-sm ring-4 ring-slate-100"
              />
            </div>

            <div className="flex items-center justify-center gap-2 max-w-full">
              <h3 className="text-lg font-bold text-[#111b21] flex items-center gap-1.5 truncate">
                {title}
                {isDirect && recipient?.role === 'Admin' && (
                  <Badge variant="primary">Admin</Badge>
                )}
              </h3>
              {amIAdmin && (
                <button
                  onClick={handleOpenEditGroupModal}
                  title="Edit Group Profile"
                  className="p-1.5 rounded-full bg-[#f0f4f8] text-[#008069] hover:bg-[#e9edef] cursor-pointer transition-all shrink-0 hover:scale-110"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isDirect && (
              <p className="text-[11px] text-[#008069] mt-1 font-bold uppercase tracking-wider">
                {recipient?.statusText || "Active Member"}
              </p>
            )}


            <p className="text-xs text-[#54656f] mt-3 max-w-xs leading-relaxed font-medium">
              {isDirect ? recipient?.bio || "No biography available." : group?.description || "No space description provided."}
            </p>
          </div>

          {/* Detailed parameters */}
          {isDirect && recipient && (
            <div className="p-4 bg-white border-b border-slate-200/80 text-left text-xs font-medium">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#008069]" />
                <div>
                  <span className="text-[10px] text-[#667781] block uppercase font-bold tracking-wider">Email Address</span>
                  <span className="text-[#111b21] font-bold select-all">{recipient.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Group Permissions Section */}
          {!isDirect && group && (
            <div className="p-4 bg-[#f0f4f8] border-b border-slate-200/80 text-left space-y-3.5 select-none">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111b21] flex items-center gap-1.5 tracking-wide uppercase">
                  <Shield className="h-4 w-4 text-[#008069]" />
                  Group permissions
                </h4>
                {!amIAdmin && (
                  <span className="text-[10px] font-bold text-[#667781] uppercase tracking-wider">
                    Read-only
                  </span>
                )}
              </div>

              {/* Section 1: Members can */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="text-[10px] font-bold uppercase text-[#008069] tracking-wider">
                  Members can
                </div>

                {/* Toggle 1: Send new messages */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#111b21] block truncate">
                      Send new messages
                    </span>
                    <span className="text-[10px] text-[#667781] block font-medium truncate mt-0.5">
                      {(group.permissions?.sendMessages !== false) ? "All members can send messages" : "Only admins can send messages"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!amIAdmin}
                    onClick={() => handleTogglePermission('sendMessages', (group.permissions?.sendMessages === false))}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${(group.permissions?.sendMessages !== false) ? 'bg-[#008069]' : 'bg-slate-300'
                      } ${!amIAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${(group.permissions?.sendMessages !== false) ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Add other members */}
                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#111b21] block truncate">
                      Add other members
                    </span>
                    <span className="text-[10px] text-[#667781] block font-medium truncate mt-0.5">
                      {(group.permissions?.addMembers !== false) ? "Members can add new members" : "Only admins can add members"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!amIAdmin}
                    onClick={() => handleTogglePermission('addMembers', (group.permissions?.addMembers === false))}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${(group.permissions?.addMembers !== false) ? 'bg-[#008069]' : 'bg-slate-300'
                      } ${!amIAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${(group.permissions?.addMembers !== false) ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* Section 2: Admins can */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-3">
                <div className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">
                  Admins can
                </div>

                {/* Toggle 3: Approve new members */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#111b21] block truncate">
                      Approve new members
                    </span>
                    <span className="text-[10px] text-[#667781] block font-medium truncate mt-0.5">
                      {group.permissions?.approveMembers ? "Require admin approval for additions" : "Members join directly"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!amIAdmin}
                    onClick={() => handleTogglePermission('approveMembers', !group.permissions?.approveMembers)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${group.permissions?.approveMembers ? 'bg-[#008069]' : 'bg-slate-300'
                      } ${!amIAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${group.permissions?.approveMembers ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Join Requests Section for Admins */}
          {!isDirect && group && amIAdmin && group.joinRequests && group.joinRequests.length > 0 && (
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-left bg-amber-500/5">
              <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-3 tracking-wide uppercase">
                <UserCheck className="h-4 w-4" />
                Pending Join Requests ({group.joinRequests.length})
              </h4>
              <div className="space-y-2">
                {group.joinRequests.map((req) => {
                  const reqUser = typeof req.user === 'object' ? req.user : allUsers.find(u => u.id === req.user || u._id?.toString() === req.user);
                  if (!reqUser) return null;

                  const reqUserRealId = reqUser.id || reqUser._id?.toString() || req.user;
                  const requestedByObj = req.requestedBy === 'user_me' ? authUser : allUsers.find(u => u.id === req.requestedBy || u._id?.toString() === req.requestedBy);

                  return (
                    <div key={req.id || reqUserRealId} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/40 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={reqUser.avatar} name={reqUser.name} size="sm" />
                        <div className="text-xs min-w-0">
                          <span className="font-black text-slate-900 dark:text-white block truncate leading-tight">
                            {reqUser.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                            Added by {requestedByObj?.name || 'Member'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            const success = await handleJoinRequest(group.id, reqUserRealId, 'approve');
                            if (success) {
                              showToast("Member Approved", `${reqUser.name} has been added to the group.`, "success");
                            }
                          }}
                          className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                          title="Approve Member"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const success = await handleJoinRequest(group.id, reqUserRealId, 'reject');
                            if (success) {
                              showToast("Request Rejected", `Join request for ${reqUser.name} was rejected.`, "info");
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                          title="Reject Request"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group member roster */}
          {!isDirect && group && (
            <div className="p-4 bg-[#f0f4f8] border-b border-slate-200/80 text-left relative">

              {/* Backdrop click outside to close popover menu */}
              {activeMemberMenuId && (
                <div
                  className="fixed inset-0 z-30 bg-transparent"
                  onClick={() => setActiveMemberMenuId(null)}
                />
              )}

              <h4 className="text-xs font-bold text-[#111b21] flex items-center gap-1.5 mb-3.5 tracking-wide uppercase">
                <Users className="h-4 w-4 text-[#008069]" />
                Members list ({group.memberIds.length})
              </h4>
              <div className="space-y-2">
                {group.memberIds.map(mid => {
                  const isMe = mid === 'user_me';
                  const member = isMe ? authUser : allUsers.find(u => u.id === mid || u._id?.toString() === mid);
                  if (!member) return null;

                  const memberRealId = member.id || member._id?.toString();
                  const myRealId = authUser?.id || authUser?._id?.toString();

                  const isTargetAdmin = (group.adminIds || []).some(
                    id => id === mid || id === memberRealId || (isMe && id === 'user_me')
                  );
                  const amIAdmin = (group.adminIds || []).some(
                    id => id === 'user_me' || id === myRealId
                  );

                  const isMenuOpen = activeMemberMenuId === mid;

                  return (
                    <div key={mid} className={`relative ${isMenuOpen ? 'z-50' : 'z-1'}`}>
                      <div
                        onClick={() => {
                          if (!isMe) {
                            setActiveMemberMenuId(isMenuOpen ? null : mid);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all ${!isMe ? 'cursor-pointer hover:bg-slate-50 hover:border-[#008069]/40' : 'cursor-default'
                          } ${isMenuOpen ? 'ring-2 ring-[#008069]/30 border-[#008069]' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={member.avatar} name={member.name} size="sm" color={member.avatarColor} />
                          <div className="text-xs text-left min-w-0">
                            <span className="font-bold text-[#111b21] block truncate text-xs leading-tight">
                              {member.name} {isMe && "(You)"}
                            </span>
                            <span className="text-[11px] font-medium text-[#667781] block truncate mt-0.5">
                              {member.statusText || member.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isTargetAdmin && (
                            <span className="px-2 py-0.5 rounded-md bg-[#008069]/15 text-[#008069] border border-[#008069]/30 text-[10px] font-bold uppercase tracking-wider">
                              Group admin
                            </span>
                          )}

                          {!isMe && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMemberMenuId(isMenuOpen ? null : mid);
                              }}
                              className="p-1 rounded-lg text-[#667781] hover:text-[#111b21] hover:bg-slate-100 cursor-pointer transition-all shrink-0"
                              title="Member options"
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-[#008069]' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp style Member Context Action Dropdown Menu */}
                      {isMenuOpen && !isMe && (
                        <div className="absolute right-0 top-full mt-1.5 z-[100] w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-950/50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">

                          {/* 1. Message option */}
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setActiveMemberMenuId(null);
                              const targetId = member._id?.toString() || member.id;
                              await createDirectChat(targetId);
                              showToast("Opening Direct Chat", `Navigated to chat with ${member.name}.`, "info");
                              if (onClose) onClose();
                            }}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl cursor-pointer transition-colors text-left"
                          >
                            <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span>Message {member.name}</span>
                          </button>

                          {/* 2. Make/Dismiss group admin option */}
                          {amIAdmin && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActiveMemberMenuId(null);
                                const targetId = member._id?.toString() || member.id;
                                if (isTargetAdmin) {
                                  const success = await dismissGroupAdmin(group.id, targetId);
                                  if (success) {
                                    showToast("Admin Dismissed", `${member.name} is no longer a group admin.`, "info");
                                  } else {
                                    showToast("Action Failed", "Could not revoke admin status.", "danger");
                                  }
                                } else {
                                  const success = await makeGroupAdmin(group.id, targetId);
                                  if (success) {
                                    showToast("Admin Assigned", `${member.name} is now a group admin.`, "success");
                                  } else {
                                    showToast("Action Failed", "Could not assign admin permissions.", "danger");
                                  }
                                }
                              }}
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl cursor-pointer transition-colors text-left"
                            >
                              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                              <span>{isTargetAdmin ? "Dismiss as group admin" : "Make group admin"}</span>
                            </button>
                          )}

                          {/* 3. Remove option */}
                          {amIAdmin && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActiveMemberMenuId(null);
                                const targetId = member._id?.toString() || member.id;
                                const success = await removeFromGroup(group.id, targetId);
                                if (success) {
                                  showToast("Member Removed", `${member.name} was removed from space.`, "warning");
                                } else {
                                  showToast("Action Failed", "Could not remove member.", "danger");
                                }
                              }}
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-xl cursor-pointer transition-colors text-left border-t border-slate-100 dark:border-slate-800 mt-1 pt-2.5"
                            >
                              <UserMinus className="h-4 w-4 text-rose-500 shrink-0" />
                              <span>Remove {member.name}</span>
                            </button>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          {/* Media / Files Archive Tabs */}
          <div className="p-4 text-left">
            <h4 className="text-xs font-black uppercase text-black dark:text-slate-300 tracking-wider mb-3.5">
              Conversation Archive
            </h4>
            <Tabs
              tabs={mediaTabs}
              activeTab={activeMediaTab}
              onChange={setActiveMediaTab}
              variant="underline"
              className="mb-4"
            />

            {/* Media Tab contents */}
            {activeMediaTab === 'media' && (
              <div className="grid grid-cols-3 gap-2">
                {sharedImages.length === 0 ? (
                  <div className="col-span-3 text-center py-6 text-[10px] text-slate-450 dark:text-slate-500">
                    No images shared.
                  </div>
                ) : (
                  sharedImages.map((m, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-800 shrink-0">
                      <img
                        src={m.attachmentUrl}
                        alt="shared thumbnail"
                        className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeMediaTab === 'files' && (
              <div className="space-y-2">
                {sharedDocs.length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-slate-450 dark:text-slate-500">
                    No documents shared.
                  </div>
                ) : (
                  sharedDocs.map((m, idx) => (
                    <a
                      key={idx}
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={m.attachmentName}
                      onClick={(e) => {
                        if (m.attachmentUrl === '#') {
                          e.preventDefault();
                          showToast("File Saved", "Mock download initiated.", "success");
                        }
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group/sidebar-file text-slate-800 dark:text-slate-200 decoration-transparent"
                    >
                      <FileText className="h-5 w-5 text-red-500 shrink-0" />
                      <div className="min-w-0 text-left flex-1">
                        <h5 className="text-[11px] font-bold truncate text-slate-800 dark:text-slate-250 group-hover/sidebar-file:text-indigo-600 dark:group-hover/sidebar-file:text-indigo-400 transition-colors">
                          {m.attachmentName}
                        </h5>
                        <span className="text-[9px] text-slate-450 dark:text-slate-500">{m.attachmentSize}</span>
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}

            {activeMediaTab === 'links' && (
              <div className="space-y-2">
                {sharedLinks.length === 0 ? (
                  <div className="text-center py-6 text-[10px] text-slate-450 dark:text-slate-500">
                    No links shared in this conversation.
                  </div>
                ) : (
                  sharedLinks.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group/sidebar-link text-slate-800 dark:text-slate-200 decoration-transparent"
                    >
                      <LinkIcon className="h-4.5 w-4.5 text-indigo-500 shrink-0 group-hover/sidebar-link:scale-105 transition-transform" />
                      <div className="min-w-0 text-left flex-1">
                        <h5 className="text-[11px] font-bold truncate text-indigo-650 dark:text-indigo-400 group-hover/sidebar-link:underline">
                          {item.display}
                        </h5>
                        <span className="text-[9px] text-slate-450 dark:text-slate-500 block mt-0.5">
                          Shared by {item.senderName} • {item.timestamp}
                        </span>
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}
            {/* Starred Messages Entry Point */}
            <div className="px-4 py-2 bg-[#f0f4f8] border-t border-slate-200/80 text-left">
              <button
                onClick={() => setShowStarredView(true)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-[#111b21] flex items-center justify-between text-xs font-bold transition-all cursor-pointer select-none shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400 shrink-0" />
                  <span>Starred messages</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#667781]" />
              </button>
            </div>

            {/* Actions list triggers */}
            <div className="p-4 bg-[#f0f4f8] border-t border-slate-200/80 space-y-2 text-left">
              {isDirect ? (
                <>
                  <button
                    onClick={() => setIsBlockModalOpen(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer select-none shadow-xs"
                  >
                    <UserX className="h-4.5 w-4.5" />
                    {isBlocked ? "Unblock Contact" : "Block User"}
                  </button>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-[#54656f] flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer select-none shadow-xs"
                  >
                    <AlertTriangle className="h-4.5 w-4.5" /> Report Message History
                  </button>
                </>
              ) : (
                <>
                  {(amIAdmin || group.permissions?.addMembers !== false) && (
                    <button
                      onClick={() => {
                        setSelectedMemberIdsToAdd([]);
                        setIsAddMembersModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-[#008069]/30 bg-white hover:bg-[#008069]/10 text-[#008069] flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer select-none shadow-xs"
                    >
                      <UserPlus className="h-4.5 w-4.5" /> Add Members to Space
                    </button>
                  )}
                  <button
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer select-none shadow-xs"
                  >
                    <LogOut className="h-4.5 w-4.5" /> Leave Group
                  </button>

                  {amIAdmin && (
                    <button
                      onClick={() => setIsDeleteGroupModalOpen(true)}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-600 hover:text-white text-rose-600 flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer select-none shadow-xs"
                    >
                      <Trash className="h-4.5 w-4.5" /> Dissolve Group Space
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* EDIT GROUP PROFILE MODAL */}
          <Modal
            isOpen={isEditGroupModalOpen}
            onClose={() => setIsEditGroupModalOpen(false)}
            title="Edit Group Profile"
            size="md"
          >
            <form onSubmit={handleSaveGroupProfile} className="space-y-5 text-left p-1 select-none">
              {/* Avatar Upload Container */}
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => editAvatarInputRef.current?.click()}
                >
                  <Avatar
                    src={editGroupAvatarUrl}
                    name={editGroupName || "Group"}
                    size="xl"
                    className="h-20 w-20 border-2 border-slate-200 dark:border-slate-800 object-cover shadow-md rounded-full transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={editAvatarInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  {isUploadingAvatar ? "Uploading avatar..." : "Click image to change avatar"}
                </span>
              </div>

              {/* Group Name Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  Group Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Group name"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  required
                  className="block w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs py-3 px-4 outline-none text-slate-800 dark:text-white transition-all font-semibold shadow-xs"
                />
              </div>

              {/* Group Description Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  Group Description
                </label>
                <textarea
                  placeholder="Group description"
                  value={editGroupDesc}
                  onChange={(e) => setEditGroupDesc(e.target.value)}
                  className="block w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs p-3.5 outline-none text-slate-800 dark:text-white transition-all min-h-[90px] shadow-xs resize-none font-semibold"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditGroupModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-extrabold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploadingAvatar}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Modal>

          {/* BLOCK MODAL */}
          <Modal
            isOpen={isBlockModalOpen}
            onClose={() => setIsBlockModalOpen(false)}
            title={isBlocked ? "Restore Access?" : "Revoke Access?"}
            size="sm"
          >
            <div className="text-left space-y-4">
              <p className="text-xs text-slate-650 dark:text-slate-400 leading-normal">
                {isBlocked
                  ? `Are you sure you want to unblock ${recipient?.name}? They will be able to send you files, voice notes, and messages again.`
                  : `Are you sure you want to block ${recipient?.name}? They will no longer be able to message you or invite you to spaces.`
                }
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsBlockModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant={isBlocked ? "primary" : "danger"} onClick={handleBlockToggle}>
                  {isBlocked ? "Unblock Contact" : "Block User"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* REPORT MODAL */}
          <Modal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            title="Submit Incident Report"
            size="md"
          >
            <form onSubmit={handleReportSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="block w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-3 outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                >
                  <option value="spam">Spam / Advertising</option>
                  <option value="harassment">Harassment or Abuse</option>
                  <option value="intellectual">Intellectual Property Infringement</option>
                  <option value="compliance">Corporate Compliance Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Incident Details
                </label>
                <textarea
                  placeholder="Describe the incident. Include context details about what messages were shared."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  required
                  className="block w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-3 outline-none focus:border-indigo-500 text-slate-800 dark:text-white min-h-[90px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger">
                  Submit Report
                </Button>
              </div>
            </form>
          </Modal>

          {/* LEAVE GROUP MODAL */}
          <Modal
            isOpen={isLeaveModalOpen}
            onClose={() => setIsLeaveModalOpen(false)}
            title="Exit Group Space?"
            size="sm"
          >
            <div className="text-left space-y-4">
              <p className="text-xs text-slate-650 dark:text-slate-400 leading-normal">
                Are you sure you want to leave the "{group?.name}" group space? You will lose access to the message history and no longer receive updates.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleLeaveGroup}>
                  Exit Space
                </Button>
              </div>
            </div>
          </Modal>

          {/* ADD MEMBERS MODAL */}
          <Modal
            isOpen={isAddMembersModalOpen}
            onClose={() => setIsAddMembersModalOpen(false)}
            title="Add Members to Space"
            size="md"
          >
            <form onSubmit={handleAddMembersSubmit} className="space-y-4 text-left p-1 select-none">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Select users to add to <strong className="text-slate-900 dark:text-slate-100 font-extrabold">{group?.name}</strong>:
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {allUsers
                  .filter(u => {
                    const uId = u.id || u._id?.toString();
                    const isAdmin = u.role === 'admin' || u.role === 'Admin';
                    return !isAdmin &&
                      !group?.memberIds?.includes(uId) &&
                      uId !== authUser?.id &&
                      uId !== authUser?._id?.toString();
                  })
                  .map(u => {
                    const uId = u.id || u._id?.toString();
                    const isChecked = selectedMemberIdsToAdd.includes(uId);
                    return (
                      <div
                        key={uId}
                        onClick={() => {
                          setSelectedMemberIdsToAdd(prev =>
                            isChecked ? prev.filter(id => id !== uId) : [...prev, uId]
                          );
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${isChecked
                            ? 'bg-indigo-50/80 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/40 shadow-2xs'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={u.avatar} name={u.name} size="sm" color={u.avatarColor} />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{u.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">{u.email}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }}
                          className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                        />
                      </div>
                    );
                  })}
                {allUsers.filter(u => {
                  const uId = u.id || u._id?.toString();
                  const isAdmin = u.role === 'admin' || u.role === 'Admin';
                  return !isAdmin && !group?.memberIds?.includes(uId) && uId !== authUser?.id && uId !== authUser?._id?.toString();
                }).length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center italic font-medium">
                      All registered users are already members of this space.
                    </p>
                  )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddMembersModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={selectedMemberIdsToAdd.length === 0}
                >
                  Add {selectedMemberIdsToAdd.length > 0 ? `(${selectedMemberIdsToAdd.length})` : ''} Members
                </Button>
              </div>
            </form>
          </Modal>

          {/* DISSOLVE GROUP MODAL */}

          <Modal
            isOpen={isDeleteGroupModalOpen}
            onClose={() => setIsDeleteGroupModalOpen(false)}
            title="Dissolve Group Space?"
            size="sm"
          >
            <div className="text-left space-y-4">
              <p className="text-xs text-slate-650 dark:text-slate-400 leading-normal">
                Are you sure you want to dissolve the "{group?.name}" group space? This action is permanent. All message history and participant list links will be cleared for everyone.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsDeleteGroupModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteGroup}>
                  Dissolve Space
                </Button>
              </div>
            </div>
          </Modal>
        </div>

      </div>
    </>

  );
};
export default SidebarRight;

