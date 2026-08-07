import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { AlertTriangle } from 'lucide-react';
import { 
  Phone, Search, Info, MoreVertical, Send, Smile, Paperclip, 
  Mic, Image as ImageIcon, FileText, Check, CheckCheck, Trash2, Edit2, 
  CornerUpLeft, Reply, Forward, Pin, Play, Pause, X, Trash, Sparkles, Download, Video, Lock,
  ChevronDown, Copy, Star, Plus, UserX, Loader2, ArrowLeft
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Tooltip } from '../../components/ui/Tooltip';
import { Button } from '../../components/ui/Button';
import { MessageInfoPanel } from '../../components/ui/MessageInfoPanel';

// Simulated Audio Waveform Player
// Actual Audio Player for Voice Notes
export const SimulatedVoicePlayer = ({ duration, url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (url && url !== '#') {
      audioRef.current = new Audio(url);
      
      const onTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration || 1;
        setProgress((current / total) * 100);
      };

      const onEnded = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audioRef.current.addEventListener("timeupdate", onTimeUpdate);
      audioRef.current.addEventListener("ended", onEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener("timeupdate", onTimeUpdate);
          audioRef.current.removeEventListener("ended", onEnded);
        }
      };
    }
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const waveBars = [15, 24, 18, 30, 42, 20, 12, 28, 35, 22, 10, 18, 25, 32, 40, 26, 12, 18, 30, 38, 22, 14, 26, 32, 18, 10];

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 max-w-[280px]">
      <button
        onClick={togglePlay}
        className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>
      
      <div className="flex-1">
        <div className="flex items-end gap-[2px] h-10 w-full overflow-hidden select-none">
          {waveBars.map((height, idx) => {
            const barProgress = (idx / waveBars.length) * 100;
            const isActive = progress >= barProgress;
            return (
              <div
                key={idx}
                style={{ height: `${height}%` }}
                className={`w-[3px] rounded-full transition-colors duration-150 ${isActive ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-350 dark:bg-slate-700'}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-1 select-none font-semibold">
          <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}</span>
          <span>{duration || "0:00"}</span>
        </div>
      </div>
    </div>
  );
};

const getMsgDateKey = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatDateSeparator = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (msgDate.getTime() === today.getTime()) {
    return "Today";
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  }
};
const renderTextWithLinks = (text)=> {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part,i)=>
    urlRegex.test(part) ? (
      <a
      key={i}
      href={part}
      target="_blank"
      rel="noopener noreferrer"
      className='text-blue-500 underline underline-offset-2 hover:text-blue-600 break-all relative z-10'
      onClick={(e)=> e.stopPropagation()}
      >
        {part}
      </a>
    ):(
      <span key={i}>{part}</span>
    )
  );
};

export const ChatWindow = ({ toggleRightSidebar, isRightSidebarOpen, onBack }) => {
  const { 
    chats, activeChatId, getActiveChat, getChatMessages, sendMessage, uploadFile,
    editMessage, deleteMessage, deleteMessageForMe, deleteMessageForEveryone, togglePinnedMessage, addReaction, typingUsers, groups, 
    blockUser, unblockUser, reportUser, socket, blockedUserIds, selectChat
  } = useChat();
  const { user, allUsers } = useAuth();
  const { showToast } = useNotifications();

  // Scroll management
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevLastMessageIdRef = useRef(null);
  const prevActiveChatIdRef = useRef(null);
  const prevTypingUsersCountRef = useRef(0);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  
  const [inputText, setInputText] = useState('');
  
  // Interaction states
  const [replyMessage, setReplyMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [searchInChatQuery, setSearchInChatQuery] = useState('');
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  
  // Pin Duration Modal states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [targetPinMessage, setTargetPinMessage] = useState(null);
  const [selectedDurationHours, setSelectedDurationHours] = useState(168);

  // Multi-pin banner state
  const [pinnedBannerIndex, setPinnedBannerIndex] = useState(0);
  const [pinnedDropdownOpen, setPinnedDropdownOpen] = useState(false);
  const pinnedDropdownRef = useRef(null);

  // Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteMessage, setTargetDeleteMessage] = useState(null);

  // Media uploads states
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [uploadingFileType, setUploadingFileType] = useState('image');

  // Message Info panel state (group chats only)
  const [msgInfoTarget, setMsgInfoTarget] = useState(null);

  // Message dropdown menu states
  const [activeMsgMenuId, setActiveMsgMenuId] = useState(null);
  const [showEmojiPickerMsgId, setShowEmojiPickerMsgId] = useState(null);
  const [showFullEmojiPickerMsgId, setShowFullEmojiPickerMsgId] = useState(null);
  const [starredMsgIds, setStarredMsgIds] = useState(() => JSON.parse(localStorage.getItem('starredMsgIds') || '[]'));
  const msgMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideMsgMenu = (e) => {
      if (msgMenuRef.current && !msgMenuRef.current.contains(e.target)) {
        setActiveMsgMenuId(null);
        setShowEmojiPickerMsgId(null);
        setShowFullEmojiPickerMsgId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMsgMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMsgMenu);
  }, []);

  // Close pinned dropdown on outside click
  useEffect(() => {
    const handleClickOutsidePin = (e) => {
      if (pinnedDropdownRef.current && !pinnedDropdownRef.current.contains(e.target)) {
        setPinnedDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsidePin);
    return () => document.removeEventListener('mousedown', handleClickOutsidePin);
  }, []);

  const handleToggleStarMsg = (msgId) => {
    const isStarred = starredMsgIds.includes(msgId);
    const updated = isStarred
      ? starredMsgIds.filter(id => id !== msgId)
      : [...starredMsgIds, msgId];
    setStarredMsgIds(updated);
    localStorage.setItem('starredMsgIds', JSON.stringify(updated));
    showToast(isStarred ? "Message Unstarred" : "Message Starred", isStarred ? "Removed from starred" : "Saved to starred messages", "info");
  };

  const handleCopyMsgText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied to Clipboard", "Message text copied", "success");
  };

  const activeChat = getActiveChat();

  if (!activeChat) return null;

  const myRealId = user?.id?.toString() || user?._id?.toString();
  const isDirect = activeChat.type === 'direct';

  const getPId = (p) => {
    if (!p) return null;
    if (typeof p === 'string') return p;
    return (p._id || p.id)?.toString() || p.toString();
  };

  const recipientParticipant = isDirect
    ? activeChat.participants?.find(p => {
        const pId = getPId(p);
        return pId && pId !== 'user_me' && pId !== myRealId;
      })
    : null;

  const recipientId = getPId(recipientParticipant);

  const recipient = isDirect && recipientId
    ? allUsers.find(u => {
        const uId = (u.id || u._id)?.toString();
        return uId === recipientId;
      })
    : null;

  const group = !isDirect
    ? groups.find(g => g.id === activeChat.groupId || g.id === activeChat.id)
    : null;

  const targetUnblockId = recipientId || recipient?.id?.toString() || recipient?._id?.toString();

  const isBlocked = isDirect && targetUnblockId && (
    (blockedUserIds || []).map(id => id.toString()).includes(targetUnblockId.toString())
  );
  const isGroupBlocked = !isDirect && (activeChat?.isBlocked || group?.isBlocked);

  const amIAdmin = !isDirect && group && (group?.adminIds || []).some(
    id => id === 'user_me' || id === myRealId
  );
  const isMessagingRestricted = !isDirect && group && !amIAdmin && (group?.permissions?.sendMessages === false);

  // Simulated Voice Recorder state
  const [isRecording, setIsRecording] = useState(false);
  
  // Typing Indicator States
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // If activeChatId changes, clean up any active typing indicator for the old chat
    return () => {
      if (isTypingRef.current && socket) {
        const oldChat = getActiveChat();
        if (oldChat) {
          const oldIsDirect = oldChat.type === 'direct';
          const payload = {
            fromUserId: user.id || user._id,
            chatId: activeChatId
          };
          if (oldIsDirect) {
            const oldRecipientId = oldChat.participants.find(p => p !== 'user_me');
            if (oldRecipientId) payload.toUserId = oldRecipientId;
          } else {
            const oldGroup = groups.find(g => g.id === oldChat.groupId);
            if (oldGroup) payload.participantIds = oldGroup.memberIds;
          }
          socket.emit("stop-typing", payload);
        }
      }
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeChatId, socket, groups, user, getActiveChat]);



  const [recordTimer, setRecordTimer] = useState(0);
  const recordIntervalRef = useRef(null);

  // Emojis list (quick reaction bar)
  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👀"];

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const attachmentMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const messages = getChatMessages(activeChatId);

  const lastMessageId = messages[messages.length - 1]?.id;
  const typingUsersCount = typingUsers[activeChatId]?.length || 0;

  // Smart auto scroll to bottom: only scroll when user switches chats, sends a message, or is already near the bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const chatSwitched = prevActiveChatIdRef.current !== activeChatId;
    const lastMsg = messages[messages.length - 1];
    const newMsgArrived = lastMsg && prevLastMessageIdRef.current !== lastMsg.id;
    const typingIncreased = typingUsersCount > prevTypingUsersCountRef.current;

    prevActiveChatIdRef.current = activeChatId;
    prevLastMessageIdRef.current = lastMsg ? lastMsg.id : null;
    prevTypingUsersCountRef.current = typingUsersCount;

    if (chatSwitched) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
      return;
    }

    const threshold = 150; // pixels from the bottom
    const isCloseToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    if (newMsgArrived) {
      const isMe = lastMsg.senderId === 'user_me';
      if (isMe || isCloseToBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    } else if (typingIncreased && isCloseToBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [activeChatId, lastMessageId, messages.length, typingUsersCount]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordTimer(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  const formatLastSeen = (lastSeenTime) => {
    if (!lastSeenTime) return "Offline";
    const date = new Date(lastSeenTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just left";
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  const chatTitle = isDirect ? recipient?.name : group?.name;
  const chatSubtitle = isDirect 
    ? (recipient?.isOnline ? 'Active now' : formatLastSeen(recipient?.lastSeen))
    : `${group?.memberIds?.length || 0} participants`;

  // Start voice recording using browser MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast("Voice Recorder", "Recording voice message...", "info");
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      showToast("Access Denied", "Could not access microphone.", "error");
    }
  };

  // Stop voice recording and upload to Cloudinary/server
  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const durationMin = Math.floor(recordTimer / 60);
      const durationSec = (recordTimer % 60).toString().padStart(2, '0');
      const finalDuration = `${durationMin}:${durationSec}`;
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });

      showToast("Sending Voice Note", "Uploading voice message...", "info");
      
      const uploaded = await uploadFile(audioFile);
      if (uploaded) {
        sendMessage(activeChatId, '', 'audio', {
          attachmentUrl: uploaded.url,
          attachmentDuration: finalDuration
        });
        showToast("Voice Sent", `Voice note (${finalDuration}) sent.`, "success");
      } else {
        showToast("Error", "Failed to upload voice note.", "error");
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    showToast("Recording Canceled", "Voice note discarded.", "warning");
  };

  // Fetch and download cross-origin files safely
  const handleDownloadFile = async (e, url, name) => {
    e.preventDefault();
    if (!url || url === '#') {
      showToast("File Saved", "Mock download initiated.", "success");
      return;
    }
    
    try {
      showToast("Downloading", "Downloading file...", "info");
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast("Downloaded", "File downloaded successfully.", "success");
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: Open in new tab if CORS prevents fetch
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast("Opened", "Opened file preview in a new tab.", "info");
    }
  };

  // Handle typing simulation
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket) return;

    const emitTypingInfo = (isTyping) => {
      const payload = {
        fromUserId: user.id || user._id,
        chatId: activeChatId
      };
      if (isDirect && recipient) {
        payload.toUserId = recipient.id;
      } else if (group) {
        payload.participantIds = group.memberIds;
      }
      socket.emit(isTyping ? "typing" : "stop-typing", payload);
    };

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTypingInfo(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitTypingInfo(false);
    }, 3000);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Clear typing indicator instantly
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket) {
        const payload = {
          fromUserId: user.id || user._id,
          chatId: activeChatId
        };
        if (isDirect && recipient) {
          payload.toUserId = recipient.id;
        } else if (group) {
          payload.participantIds = group.memberIds;
        }
        socket.emit("stop-typing", payload);
      }
    }

    if (editingMessage) {
      editMessage(editingMessage.id, inputText);
      showToast("Message Edited", "Your message text has been updated.", "success");
      setEditingMessage(null);
    } else {
      sendMessage(activeChatId, inputText, 'text', null, replyMessage?.id);
      if (replyMessage) setReplyMessage(null);
    }
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };



  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const handleSimulateAttachment = (type) => {
    setShowAttachmentMenu(false);
    if (type === 'image') {
      imageInputRef.current?.click();
    } else if (type === 'pdf') {
      fileInputRef.current?.click();
    }
  };

  const handleImageSelection = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    setUploadingFileName(file.name);
    setUploadingFileType('image');
    showToast("Sharing Image", `Uploading ${file.name}...`, "info");

    try {
      const uploaded = await uploadFile(file);
      if (uploaded) {
        sendMessage(activeChatId, '', 'image', {
          attachmentUrl: uploaded.url,
          attachmentName: uploaded.name
        });
        showToast("Image Shared", `${file.name} shared successfully.`, "success");
      } else {
        showToast("Sharing Failed", "Failed to upload image to server.", "danger");
      }
    } catch (err) {
      showToast("Sharing Failed", "An error occurred during image upload.", "danger");
    } finally {
      setIsUploadingAttachment(false);
      setUploadingFileName('');
      e.target.value = '';
    }
  };

  const handleFileSelection = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    setUploadingFileName(file.name);
    setUploadingFileType('file');
    showToast("Sharing File", `Uploading ${file.name}...`, "info");

    try {
      const uploaded = await uploadFile(file);
      if (uploaded) {
        sendMessage(activeChatId, '', 'file', {
          attachmentUrl: uploaded.url,
          attachmentName: uploaded.name,
          attachmentSize: formatFileSize(uploaded.size || file.size)
        });
        showToast("File Shared", `${file.name} shared successfully.`, "success");
      } else {
        showToast("Sharing Failed", "Failed to upload file to server.", "danger");
      }
    } catch (err) {
      showToast("Sharing Failed", "An error occurred during file upload.", "danger");
    } finally {
      setIsUploadingAttachment(false);
      setUploadingFileName('');
      e.target.value = '';
    }
  };

  // Filter messages if search is active
  const filteredMessages = messages.filter(m => {
    if (!searchInChatQuery) return true;
    return m.text && m.text.toLowerCase().includes(searchInChatQuery.toLowerCase());
  });

  const getSenderProfile = (senderId) => {
    return allUsers.find(u => u.id === senderId) || { name: 'Unknown User', avatarColor: 'from-slate-500 to-slate-650' };
  };

  const handleTogglePinMessage = (message) => {
    const currentPins = activeChat?.pinnedMessageIds || [];
    const isCurrentlyPinned = currentPins.some(p => p.id === message.id);
    if (isCurrentlyPinned) {
      togglePinnedMessage(activeChatId, message.id);
      showToast("Message Unpinned", "Pinned message removed from this chat.", "info");
    } else {
      setTargetPinMessage(message);
      setSelectedDurationHours(168); // Default 7 days
      setPinModalOpen(true);
    }
  };

  const confirmPinMessage = () => {
    if (!targetPinMessage) return;
    togglePinnedMessage(activeChatId, targetPinMessage.id, selectedDurationHours);

    let durationLabel = "7 days";
    if (selectedDurationHours === 24) durationLabel = "24 hours";
    if (selectedDurationHours === 720) durationLabel = "30 days";

    showToast("Message Pinned", `Pinned for ${durationLabel}. You can unpin it at any time.`, "success");
    setPinModalOpen(false);
    setTargetPinMessage(null);
  };

  const formatRemainingPinTime = (pinnedUntilISO) => {
    if (!pinnedUntilISO) return null;
    const diffMs = new Date(pinnedUntilISO).getTime() - Date.now();
    if (diffMs <= 0) return "Expiring...";
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (hours <= 24) return `Expires in ${hours}h`;
    const days = Math.ceil(hours / 24);
    return `Expires in ${days}d`;
  };

  // Build the list of resolved pinned messages (ids → actual message objects)
  const pinnedMessageIds = activeChat?.pinnedMessageIds || [];
  const pinnedMessages = pinnedMessageIds
    .map(p => {
      const msg = messages.find(m => m.id === p.id);
      return msg ? { ...msg, pinnedUntil: p.pinnedUntil } : null;
    })
    .filter(Boolean);
  // Clamp banner index so it's always in range
  const safePinnedIndex = pinnedMessages.length > 0 ? pinnedBannerIndex % pinnedMessages.length : 0;
  const currentPinnedMsg = pinnedMessages[safePinnedIndex] || null;

  // Helper: build a smart content preview for pinned message
  const getPinnedPreview = (msg) => {
    if (!msg) return '';
    if (msg.type === 'image') return '📷 Photo';
    if (msg.type === 'audio') return '🎤 Voice message';
    if (msg.type === 'file') return `📄 ${msg.attachmentName || 'Document'}`;
    if (msg.text) return msg.text;
    return 'Attachment';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-whatsapp-wallpaper">
      
      {/* 1. Top Header */}
      <div className="h-16 px-3 sm:px-4 border-b border-[#e9edef] bg-[#f0f2f5] flex items-center justify-between z-10 shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button 
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                selectChat(null);
              }
            }}
            className="sm:hidden p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Avatar 
            src={isDirect ? recipient?.avatar : group?.avatar} 
            name={chatTitle} 
            size="md" 
            status={isDirect ? (recipient?.isOnline ? 'online' : 'offline') : null}
            color={isDirect ? recipient?.avatarColor : group?.avatarColor}
          />
          <div className="text-left min-w-0">
            <h4 className="text-sm font-bold text-[#111b21] truncate">
              {chatTitle}
            </h4>
            <p className={`text-[10px] truncate ${isDirect && recipient?.isOnline ? 'text-[#00a884] font-semibold' : 'text-[#667781]'}`}>
              {chatSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSearchInChat(!showSearchInChat)} 
            className={`p-2 rounded-xl cursor-pointer ${showSearchInChat ? 'bg-slate-900 text-white' : 'text-slate-450 hover:text-slate-750 hover:bg-slate-100'}`}
          >
            <Search className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={toggleRightSidebar} 
            className={`p-2 rounded-xl cursor-pointer ${isRightSidebarOpen ? 'bg-slate-900 text-white' : 'text-slate-450 hover:text-slate-750 hover:bg-slate-100'}`}
          >
            <Info className="h-4.5 w-4.5" />
          </button>
          <button 
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                selectChat(null);
              }
            }} 
            className="hidden sm:flex p-2 rounded-xl cursor-pointer text-slate-450 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200/60 ml-1"
            title="Close chat"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Multi-Pin Banner */}
      {pinnedMessages.length > 0 && currentPinnedMsg && (
        <div className="border-b border-[#e9edef] bg-[#f0f2f5] shrink-0 select-none relative">
          <div
            className="flex items-stretch cursor-pointer hover:bg-black/5 transition-colors"
            onClick={() => {
              // Cycle to next pinned message and scroll to it
              const nextIdx = (safePinnedIndex + 1) % pinnedMessages.length;
              setPinnedBannerIndex(nextIdx);
              const nextMsg = pinnedMessages[nextIdx];
              if (nextMsg) {
                const el = document.getElementById(nextMsg.id);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el?.classList.add('bg-yellow-200/60');
                setTimeout(() => el?.classList.remove('bg-yellow-200/60'), 1500);
              }
            }}
          >
            {/* Coloured left accent bar (cycles colours for each pin slot) */}
            <div className={`w-1 shrink-0 rounded-sm my-1 ml-2 ${
              safePinnedIndex % 3 === 0 ? 'bg-indigo-500' :
              safePinnedIndex % 3 === 1 ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />

            {/* Pin icon + counter + content */}
            <div className="flex-1 min-w-0 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Pin className="h-3 w-3 text-[#54656f] shrink-0" />
                <span className="text-[10px] font-bold text-[#54656f] uppercase tracking-wider">
                  {pinnedMessages.length > 1
                    ? `Pinned message ${safePinnedIndex + 1} of ${pinnedMessages.length}`
                    : 'Pinned message'}
                </span>
              </div>
              <p className="text-xs text-[#111b21] font-medium truncate leading-snug">
                {getPinnedPreview(currentPinnedMsg)}
              </p>
            </div>

            {/* Chevron dropdown trigger */}
            <div
              ref={pinnedDropdownRef}
              className="relative flex items-center px-3 shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="p-1.5 rounded-full hover:bg-black/10 transition-colors text-[#54656f]"
                onClick={() => setPinnedDropdownOpen(prev => !prev)}
                title="Pinned message options"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${pinnedDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {pinnedDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1 w-44 text-xs font-semibold select-none animate-in fade-in zoom-in-95">
                  {/* Go to message */}
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left text-slate-800"
                    onClick={() => {
                      setPinnedDropdownOpen(false);
                      const el = document.getElementById(currentPinnedMsg.id);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el?.classList.add('bg-yellow-200/60');
                      setTimeout(() => el?.classList.remove('bg-yellow-200/60'), 1500);
                    }}
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    Go to message
                  </button>
                  {/* Unpin */}
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left text-slate-800"
                    onClick={() => {
                      setPinnedDropdownOpen(false);
                      handleTogglePinMessage(currentPinnedMsg);
                      // If we just unpinned the last pin, reset banner index
                      if (pinnedMessages.length <= 1) setPinnedBannerIndex(0);
                    }}
                  >
                    <Pin className="h-4 w-4 shrink-0 text-slate-500" />
                    Unpin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Embedded Search Box in active chat */}
      <AnimatePresence>
        {showSearchInChat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/88 border-b border-slate-200 shrink-0"
          >
            <div className="max-w-3xl md:max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-3 w-full">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search words within this chat history..."
                value={searchInChatQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInChatQuery(val);
                  if (val === '') {
                    setShowSearchInChat(false);
                  }
                }}
                className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-800"
              />
              {searchInChatQuery && (
                <button 
                  onClick={() => {
                    setSearchInChatQuery('');
                    setShowSearchInChat(false);
                  }} 
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={() => { setShowSearchInChat(false); setSearchInChatQuery(''); }} 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Messages Window timeline scroll */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar bg-whatsapp-wallpaper">
        <div className="max-w-3xl md:max-w-4xl mx-auto px-2.5 py-3 sm:p-4 space-y-3.5 w-full">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-450 dark:text-slate-500 text-xs py-20">
              {searchInChatQuery ? "No search results match." : "No messages. Send a message to start conversation."}
            </div>
          ) : (
            filteredMessages.map((msg, index) => {
              const isMe = msg.senderId === 'user_me';
              const sender = getSenderProfile(msg.senderId);
              const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              // Fetch reply context text
              const replyCtx = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;

              // Date separator calculation
              const currentDateKey = getMsgDateKey(msg.timestamp);
              const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
              const prevDateKey = prevMsg ? getMsgDateKey(prevMsg.timestamp) : null;
              const showDateSeparator = currentDateKey !== prevDateKey;

              return (
                <React.Fragment key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-3 select-none w-full">
                      <span className="px-3 py-1 rounded-lg bg-white text-[#667781] text-[11px] font-semibold tracking-wide shadow-xs border border-slate-200/40 uppercase">
                        {formatDateSeparator(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  <div 
                    id={msg.id}
                    className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[70%] transition-colors duration-500 rounded-xl p-0.5 ${isMe ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
                  >
                  {/* Avatar */}
                  {!isMe && (
                    <div className="shrink-0">
                      <Avatar 
                        src={sender.avatar} 
                        name={sender.name} 
                        size="sm" 
                        color={sender.avatarColor}
                      />
                    </div>
                  )}

                  <div className={`space-y-1 flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name tag */}
                    {!isMe && activeChat.type !== 'direct' && (
                      <span className="text-[11px] font-bold text-[#008069] tracking-tight block ml-0.5 mb-0.5">
                        {sender.name}
                      </span>
                    )}

                    {/* Message Bubble Container */}
                    <div className="relative group flex flex-col max-w-full">

                      {/* Hover / Touch action dropdown trigger button */}
                      {!msg.isDeleted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveMsgMenuId(prev => prev === msg.id ? null : msg.id);
                            setShowEmojiPickerMsgId(null);
                            setShowFullEmojiPickerMsgId(null);
                          }}
                          className={`
                            absolute top-1.5 right-1.5 p-1 rounded-md transition-all z-20 cursor-pointer shadow-xs pointer-events-auto
                            ${activeMsgMenuId === msg.id 
                              ? 'opacity-100' 
                              : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100'
                            }
                            ${isMe 
                              ? 'text-slate-500 hover:text-slate-900 hover:bg-black/10 bg-emerald-100/50' 
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 bg-white/70'
                            }
                          `}
                          title="Message Options"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Standalone Full Emoji Picker Popover for this specific message */}
                      {showFullEmojiPickerMsgId === msg.id && (() => {
                        const isNearBottom = filteredMessages.length >= 4 && index >= filteredMessages.length - 2;
                        return (
                          <>
                            <div 
                              className="fixed inset-0 z-[95] bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowFullEmojiPickerMsgId(null);
                              }}
                            />
                            <div 
                              className={`
                                absolute z-[100] ${isMe ? 'right-0' : 'left-0'} 
                                ${isNearBottom ? 'bottom-full mb-2 top-auto' : 'top-full mt-2 bottom-auto'} 
                                shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 animate-in fade-in zoom-in-95
                              `}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <EmojiPicker
                                theme="dark"
                                onEmojiClick={(emojiData) => {
                                  addReaction(msg.id, emojiData.emoji);
                                  setShowFullEmojiPickerMsgId(null);
                                  setShowEmojiPickerMsgId(null);
                                  setActiveMsgMenuId(null);
                                }}
                                searchPlaceholder="Search emoji..."
                                width={Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 32 : 300)}
                                height={320}
                              />
                            </div>
                          </>
                        );
                      })()}

                      {/* WhatsApp Context Dropdown Menu */}
                      {activeMsgMenuId === msg.id && (() => {
                        const isNearBottom = filteredMessages.length >= 4 && index >= filteredMessages.length - 2;
                        return (
                          <div 
                            ref={msgMenuRef}
                            onClick={(e) => e.stopPropagation()}
                            className={`
                              absolute z-50 bg-slate-900/95 dark:bg-slate-950 backdrop-blur-md text-slate-200 rounded-xl shadow-2xl border border-slate-700/80 py-1.5 w-48 text-xs font-semibold select-none animate-in fade-in zoom-in-95 max-h-[70vh] overflow-y-auto no-scrollbar
                              ${isMe ? 'right-0' : 'left-0'}
                              ${isNearBottom ? 'bottom-full mb-1 top-auto' : 'top-full mt-1 bottom-auto'}
                            `}
                          >
                            {/* Quick reaction bar toggle */}
                            {showEmojiPickerMsgId === msg.id && (
                              <div className="flex items-center justify-around p-2 border-b border-slate-800 relative">
                                {quickEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      addReaction(msg.id, emoji);
                                      setShowEmojiPickerMsgId(null);
                                      setShowFullEmojiPickerMsgId(null);
                                      setActiveMsgMenuId(null);
                                    }}
                                    className="hover:scale-125 transition-transform text-sm cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowFullEmojiPickerMsgId(showFullEmojiPickerMsgId === msg.id ? null : msg.id);
                                    setActiveMsgMenuId(null);
                                  }}
                                  className={`p-1 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center shrink-0 ${showFullEmojiPickerMsgId === msg.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                                  title="All Emojis"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}

                          <button
                            onClick={() => {
                              setReplyMessage(msg);
                              setActiveMsgMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                          >
                            <Reply className="h-4 w-4 text-slate-400" />
                            Reply
                          </button>

                          {msg.text && (
                            <button
                              onClick={() => {
                                handleCopyMsgText(msg.text);
                                setActiveMsgMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                            >
                              <Copy className="h-4 w-4 text-slate-400" />
                              Copy
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setShowEmojiPickerMsgId(showEmojiPickerMsgId === msg.id ? null : msg.id);
                              setShowFullEmojiPickerMsgId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                          >
                            <Smile className="h-4 w-4 text-slate-400" />
                            React
                          </button>

                          <button
                            onClick={() => {
                              setForwardMessage(msg);
                              setActiveMsgMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                          >
                            <Forward className="h-4 w-4 text-slate-400" />
                            Forward
                          </button>

                          <button
                            onClick={() => {
                              handleTogglePinMessage(msg);
                              setActiveMsgMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                          >
                            <Pin className="h-4 w-4 text-slate-400" />
                            {(activeChat?.pinnedMessageIds || []).some(p => p.id === msg.id) ? "Unpin" : "Pin"}
                          </button>

                          <button
                            onClick={() => {
                              handleToggleStarMsg(msg.id);
                              setActiveMsgMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                          >
                            <Star className={`h-4 w-4 ${starredMsgIds.includes(msg.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                            {starredMsgIds.includes(msg.id) ? "Unstar" : "Star"}
                          </button>

                          {/* ONLY show Report for messages received from OTHER users (!isMe) */}
                          {!isMe && (
                            <button
                              onClick={() => {
                                setActiveMsgMenuId(null);
                                const targetUser = getSenderProfile(msg.senderId);
                                if (typeof reportUser === 'function' && targetUser) {
                                  reportUser(
                                    targetUser.id || targetUser._id,
                                    msg.text || '[media attachment]',
                                    'message'
                                  );
                                }
                                showToast("Report Submitted", "Message reported to administrator for review.", "warning");
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left text-amber-400"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              Report
                            </button>
                          )}

                          {/* Message Info for group admins / sender */}
                          {isMe && !isDirect && (
                            <button
                              onClick={() => {
                                setMsgInfoTarget(msg);
                                setActiveMsgMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left text-indigo-400"
                            >
                              <Info className="h-4 w-4" />
                              Message Info
                            </button>
                          )}

                          {isMe && ((Date.now() - new Date(msg.timestamp).getTime()) <= 24 * 60 * 60 * 1000) && (
                            <button
                              onClick={() => {
                                setEditingMessage(msg);
                                setInputText(msg.text);
                                setActiveMsgMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left"
                            >
                              <Edit2 className="h-4 w-4 text-slate-400" />
                              Edit
                            </button>
                          )}

                          <div className="my-1 border-t border-slate-800" />

                          <button
                            onClick={() => {
                              setTargetDeleteMessage(msg);
                              setDeleteModalOpen(true);
                              setActiveMsgMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-800 transition-colors text-left text-rose-400 font-bold"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      );
                    })()}

                    {/* Bubble background classes */}
                    <div className={`
                      pl-3.5 pr-8 py-2 rounded-2xl text-xs sm:text-xs leading-relaxed max-w-full text-left shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] relative
                      ${isMe 
                        ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs' 
                        : 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/50'
                      }
                      ${msg.isDeleted ? 'italic text-slate-400 bg-slate-50 border-dashed pr-3.5' : ''}
                      ${msg.emojiReactions && msg.emojiReactions.length > 0 ? 'pb-3.5 mb-1' : ''}
                    `}>
                      {/* Forwarded indicator */}
                      {msg.isForwarded && (
                        <div className={`flex items-center gap-1 mb-1 text-[9px] font-bold tracking-wide uppercase italic ${isMe ? 'text-indigo-300' : 'text-slate-400'}`}>
                          <Forward className="h-2.5 w-2.5" />
                          <span>Forwarded</span>
                        </div>
                      )}
                      
                      {/* Reply preview row */}
                      {replyCtx && (
                        <div className="mb-2 p-2 rounded-lg bg-black/5 border-l-[3px] border-indigo-500 text-[10px] text-slate-700 truncate max-w-full">
                          <span className="font-bold block text-indigo-500">
                            {replyCtx.senderId === 'user_me' ? 'You' : getSenderProfile(replyCtx.senderId).name}
                          </span>
                          {replyCtx.text || 'File Attachment'}
                        </div>
                      )}

                      {/* Text content */}
                      {msg.text && <p className="whitespace-pre-wrap">{renderTextWithLinks(msg.text)}</p>}

                      {/* Image attachment rendering */}
                      {msg.type === 'image' && msg.attachmentUrl && (
                        <div className="relative mt-1 max-w-full sm:max-w-[240px] overflow-hidden rounded-lg cursor-zoom-in border-0">
                          <img
                            src={msg.attachmentUrl}
                            alt={msg.attachmentName || "Attachment"}
                            className="object-cover h-40 w-full hover:scale-105 transition-transform duration-300"
                            onClick={() => setLightboxImage(msg.attachmentUrl)}
                          />
                        </div>
                      )}

                      {/* PDF / Document Attachment card */}
                      {msg.type === 'file' && (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={msg.attachmentName}
                          onClick={(e) => handleDownloadFile(e, msg.attachmentUrl, msg.attachmentName)}
                          className="flex items-center justify-between gap-3 p-3 mt-1.5 rounded-xl border-0 bg-black/5 hover:bg-black/10 transition-colors duration-200 cursor-pointer max-w-full sm:max-w-[260px] group/file text-slate-800 decoration-transparent"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 group-hover/file:bg-red-500/20 transition-colors">
                              <FileText className="h-5.5 w-5.5" />
                            </div>
                            <div className="min-w-0 text-left">
                              <h5 className="text-xs font-bold truncate text-slate-800 group-hover/file:text-indigo-600 transition-colors">
                                {msg.attachmentName}
                              </h5>
                              <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                                {msg.attachmentSize}
                              </p>
                            </div>
                          </div>
                          <div className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-200/50 shrink-0 transition-colors">
                            <Download className="h-4 w-4" />
                          </div>
                        </a>
                      )}

                      {/* Voice waveform player */}
                      {msg.type === 'audio' && (
                        <SimulatedVoicePlayer duration={msg.attachmentDuration} url={msg.attachmentUrl} />
                      )}

                      {/* Voice Call History Card */}
                      {msg.type === 'call' && (
                        <div className="flex items-center gap-3 p-3 mt-1.5 rounded-xl border-0 bg-black/5 text-slate-800 max-w-[245px]">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                            msg.text.includes("Missed") 
                              ? "bg-rose-500/10 text-rose-500" 
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}>
                            <Phone className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 text-left">
                            <h5 className="text-xs font-bold text-slate-800">
                              {msg.text}
                            </h5>
                            <p className="text-[10px] text-slate-455 font-semibold mt-0.5">
                              {msg.attachmentDuration || "0:00"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Floating Emoji Reaction with NO background */}
                      {msg.emojiReactions && msg.emojiReactions.length > 0 && (
                        <div 
                          className="absolute -bottom-2.5 left-1.5 z-10 flex items-center gap-0.5 bg-transparent border-0 shadow-none select-none cursor-pointer hover:scale-115 transition-transform duration-200"
                        >
                          {msg.emojiReactions.map((r, i) => {
                            const userHasReacted = r.userIds.includes('user_me');
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addReaction(msg.id, r.emoji);
                                }}
                                className={`flex items-center justify-center bg-transparent border-0 leading-none transition-transform cursor-pointer ${userHasReacted ? 'scale-110' : 'hover:scale-110'}`}
                                title={`Reacted with ${r.emoji}`}
                              >
                                <span className="text-xs sm:text-[13px] leading-none shrink-0 drop-shadow-xs">{r.emoji}</span>
                                {r.count > 1 && (
                                  <span className="text-[8.5px] font-black text-slate-700 dark:text-slate-200 ml-0.5">
                                    {r.count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Timestamp & read receipt info */}
                    <div className={`flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-medium ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {starredMsgIds.includes(msg.id) && (
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                      <span>{time}</span>
                      {msg.edited && <span className="text-slate-400/70 select-none">(edited)</span>}
                      {isMe && (
                        <>
                          {msg.status === 'sent' && (
                            <Check className="h-3 w-3 text-slate-400" />
                          )}
                          {msg.status === 'delivered' && (
                            <CheckCheck className="h-3 w-3 text-slate-400" />
                          )}
                          {msg.status === 'seen' && (
                            <CheckCheck className="h-3 w-3 text-sky-500" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })
        )}

        {/* Typing indicator bubble */}
        {typingUsers[activeChatId] && typingUsers[activeChatId].length > 0 && (
          <div className="flex gap-3 mr-auto items-start max-w-[70%]">
            <Avatar 
              src={recipient?.avatar} 
              name={chatTitle} 
              size="sm" 
              color={recipient?.avatarColor}
            />
            <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-white border border-slate-250 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>

      {/* 3. Bottom Text Input bar area */}
      <div className="border-t border-slate-200/80 bg-white/86 backdrop-blur-xl shrink-0">
        <div className="max-w-3xl md:max-w-4xl mx-auto p-3 flex flex-col gap-2 w-full">
          
          {/* Reply preview bar active */}
          {replyMessage && (
            <div className="bg-slate-50 px-3 py-2 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Reply className="h-4 w-4 text-indigo-500 shrink-0" />
                <div className="truncate text-left">
                  <span className="font-bold text-slate-700 block">Replying to {replyMessage.senderId === 'user_me' ? 'You' : getSenderProfile(replyMessage.senderId).name}</span>
                  <span className="text-[11px] text-slate-450 truncate">{replyMessage.text || 'Media attachment'}</span>
                </div>
              </div>
              <button onClick={() => setReplyMessage(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Editing indicator bar active */}
          {editingMessage && (
            <div className="bg-indigo-500/5 px-3 py-2 rounded-xl flex items-center justify-between border border-indigo-500/10 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Edit2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <div className="truncate text-left text-indigo-650">
                  <span className="font-bold block">Editing message</span>
                  <span className="text-[11px] truncate opacity-90">{editingMessage.text}</span>
                </div>
              </div>
              <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="p-1 rounded-md text-slate-400 hover:text-slate-650">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Recorder bar panel */}
          {isBlocked ? (
            <div className="p-1 select-none w-full">
              <div className="flex items-center justify-between gap-3 w-full bg-slate-100/90 dark:bg-slate-800/90 rounded-full px-4 py-2 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                    <UserX className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-[#111b21] dark:text-slate-200 truncate">
                    You blocked this contact. Tap Unblock to resume conversation.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (targetUnblockId) {
                      unblockUser(targetUnblockId);
                      showToast("Contact Unblocked", `${recipient?.name || 'Contact'} is now unblocked.`, "success");
                    }
                  }}
                  className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                >
                  Unblock
                </button>
              </div>
            </div>
          ) : isGroupBlocked ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl flex items-center justify-center text-center text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 select-none shadow-xs leading-relaxed gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>This group has been suspended by the administrator. Sending messages is disabled.</span>
            </div>
          ) : isMessagingRestricted ? (
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-2xl flex items-center justify-center text-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-750 select-none shadow-xs leading-relaxed gap-2">
              <Lock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Only admins can send messages to this group.</span>
            </div>
          ) : isRecording ? (
            <div className="bg-rose-500/5 dark:bg-rose-500/5 p-2 rounded-xl flex items-center justify-between border border-rose-500/20">
              <div className="flex items-center gap-3.5 pl-3.5">
                <span className="h-2.5 w-2.5 bg-rose-500 rounded-full animate-ping shrink-0" />
                <span className="text-xs font-bold font-mono text-rose-500">
                  Recording: {Math.floor(recordTimer / 60)}:{(recordTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={cancelRecording} 
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-bold cursor-pointer"
                >
                  Discard
                </button>
                <button 
                  onClick={stopRecording} 
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Stop & Send
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#f0f2f5] border-t border-[#e9edef] select-none w-full">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelection}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip"
                className="hidden"
                onChange={handleFileSelection}
              />

              {/* Active File Upload Progress Loader */}
              <AnimatePresence>
                {isUploadingAttachment && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="mb-2.5 p-3 rounded-2xl bg-white border border-[#008069]/30 shadow-md flex items-center justify-between gap-3 text-xs select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-[#008069]/10 text-[#008069] shrink-0">
                        {uploadingFileType === 'image' ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#111b21] truncate">
                            Uploading {uploadingFileType === 'image' ? 'Image' : 'PDF / Document'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#008069]/15 text-[#008069] animate-pulse shrink-0">
                            Uploading...
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-[#667781] truncate mt-0.5">
                          {uploadingFileName || 'Processing attachment...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pr-1">
                      <Loader2 className="h-5 w-5 animate-spin text-[#008069]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Single Unified Pill Capsule */}
              <div className="flex items-center gap-1.5 w-full bg-white rounded-full px-3 py-1.5 border border-slate-200/80 shadow-2xs">

                {/* 1. Plus (+) Attachments trigger */}
                <div className="relative shrink-0" ref={attachmentMenuRef}>
                  <Tooltip content="Attach File">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className="p-1.5 rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </Tooltip>

                  <AnimatePresence>
                    {showAttachmentMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute bottom-12 left-0 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-30 text-xs text-left"
                      >
                        <button
                          type="button"
                          onClick={() => handleSimulateAttachment('image')}
                          className="flex items-center gap-2.5 px-3 py-2 w-full text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors font-semibold"
                        >
                          <ImageIcon className="h-4 w-4 text-emerald-600" /> Share Image
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateAttachment('pdf')}
                          className="flex items-center gap-2.5 px-3 py-2 w-full text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors font-semibold"
                        >
                          <FileText className="h-4 w-4 text-rose-500" /> Share PDF Document
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Emoji menu trigger */}
                <div className="relative shrink-0" ref={emojiPickerRef}>
                  <Tooltip content="Emoji menu">
                    <button 
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                  </Tooltip>

                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute bottom-12 left-0 z-30 max-w-[calc(100vw-2rem)]"
                      >
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            setInputText(prev => prev + emojiData.emoji);
                            setShowEmojiPicker(false);
                          }}
                          skinTonesDisabled={false}
                          searchPlaceholder="Search emoji..."
                          height={320}
                          width={Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 32 : 300)}
                          previewConfig={{ showPreview: false }}
                          theme="light"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Text Input Field inside pill */}
                <div className="flex-1 min-w-0 flex items-center px-1">
                  <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message"
                    className="w-full bg-transparent text-xs outline-none text-[#111b21] placeholder-[#667781] max-h-[100px] min-h-[20px] resize-none leading-relaxed no-scrollbar font-medium py-1"
                    rows={1}
                  />
                </div>

                {/* 4. Mic / Send Icon on far right inside pill */}
                <div className="shrink-0 flex items-center">
                  {inputText.trim() ? (
                    <button
                      type="button"
                      onClick={handleSend}
                      className="p-2 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white cursor-pointer transition-all shadow-xs flex items-center justify-center h-8 w-8 transform active:scale-95 ml-1"
                    >
                      <Send className="h-3.5 w-3.5 fill-current ml-0.5" />
                    </button>
                  ) : (
                    <Tooltip content="Hold to Record">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="p-1.5 rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-slate-100 cursor-pointer transition-colors flex items-center justify-center h-8 w-8"
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                    </Tooltip>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Full image lightbox modal view */}
      <Modal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        title="Image Preview"
        size="lg"
      >
        <div className="flex flex-col items-center justify-center p-2">
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Lightbox View"
              className="max-h-[60vh] max-w-full rounded-lg object-contain border-0 shadow-lg"
            />
          )}
          <div className="mt-4 flex gap-3 w-full justify-end">
            <Button variant="outline" onClick={() => setLightboxImage(null)}>
              Close
            </Button>
            <Button onClick={(e) => handleDownloadFile(e, lightboxImage, lightboxImage.split('/').pop())}>
              Download file
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. Forward Message Modal */}
      <Modal
        isOpen={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        title="Forward Message"
        size="md"
      >
        <div className="text-left space-y-4 max-h-[60vh] flex flex-col select-none">
          <p className="text-xs text-slate-500 font-medium">Select a conversation to forward this message to:</p>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-[200px]">
            {chats.map(chat => {
              const isDirect = chat.type === 'direct';
              let name = "Unknown Chat";
              let avatar = "";
              let avatarColor = "from-indigo-650 to-indigo-650";
              
              if (isDirect) {
                const recipientId = chat.participants.find(p => p !== 'user_me');
                const recipient = allUsers.find(u => u.id === recipientId);
                if (recipient) {
                  name = recipient.name;
                  avatar = recipient.avatar;
                  avatarColor = recipient.avatarColor;
                }
              } else {
                const group = groups.find(g => g.id === chat.groupId);
                if (group) {
                  name = group.name;
                  avatar = group.avatar;
                  avatarColor = group.avatarColor;
                }
              }

              return (
                <div 
                  key={chat.id} 
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={avatar} name={name} size="sm" color={avatarColor} />
                    <span className="text-xs font-bold text-slate-900 truncate">{name}</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      sendMessage(
                        chat.id, 
                        forwardMessage.text, 
                        forwardMessage.type, 
                        {
                          attachmentUrl: forwardMessage.attachmentUrl,
                          attachmentName: forwardMessage.attachmentName,
                          attachmentSize: forwardMessage.attachmentSize,
                          attachmentDuration: forwardMessage.attachmentDuration
                        }, 
                        null, 
                        true
                      );
                      showToast("Message Forwarded", `Successfully forwarded to ${name}.`, "success");
                      setForwardMessage(null);
                    }}
                    className="rounded-lg text-[10px] font-extrabold px-3 py-1 bg-indigo-600 hover:bg-indigo-750 text-white cursor-pointer"
                  >
                    Forward
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-150">
            <Button variant="outline" onClick={() => setForwardMessage(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* 📌 Choose How Long Your Pin Lasts Modal */}
      <Modal
        isOpen={pinModalOpen}
        onClose={() => { setPinModalOpen(false); setTargetPinMessage(null); }}
        title="Choose how long your pin lasts"
        size="sm"
      >
        <div className="space-y-4 text-left select-none p-1">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Select a duration for how long this message will remain pinned at the top of this chat.
          </p>

          <div className="space-y-2.5">
            {[
              { hours: 24, label: '24 hours', sub: 'Best for temporary announcements' },
              { hours: 168, label: '7 days', sub: 'Best for weekly updates (Recommended)' },
              { hours: 720, label: '30 days', sub: 'Best for monthly guidelines and links' }
            ].map(option => {
              const isSelected = selectedDurationHours === option.hours;
              return (
                <div
                  key={option.hours}
                  onClick={() => setSelectedDurationHours(option.hours)}
                  className={`
                    flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-[#00a884] bg-emerald-50/80 shadow-sm ring-1 ring-[#00a884]/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#00a884] bg-[#00a884]' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className={`text-xs font-extrabold ${isSelected ? 'text-[#111b21]' : 'text-slate-800'}`}>
                        {option.label}
                      </div>
                      <div className={`text-[11px] font-medium ${isSelected ? 'text-[#008069] font-bold' : 'text-slate-500'}`}>
                        {option.sub}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Pin className="h-4 w-4 text-[#00a884] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 font-medium italic pt-1">
            💡 You can manually unpin this message at any time during this period.
          </p>

          <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { setPinModalOpen(false); setTargetPinMessage(null); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmPinMessage}
              className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008069] text-white font-extrabold text-xs shadow-md shadow-[#00a884]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Pin className="h-3.5 w-3.5" />
              Pin Message
            </button>
          </div>
        </div>
      </Modal>

      {/* 🗑️ WhatsApp Style Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setTargetDeleteMessage(null); }}
        title="Delete message?"
        size="sm"
      >
        <div className="space-y-5 text-left select-none p-1">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Choose how you want to delete this message.
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                if (targetDeleteMessage) {
                  deleteMessageForMe(targetDeleteMessage.id);
                  showToast("Message Deleted", "Deleted for you.", "info");
                }
                setDeleteModalOpen(false);
                setTargetDeleteMessage(null);
              }}
              className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Delete for me
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Remove this message from your view on this device
              </div>
            </button>

            {targetDeleteMessage?.senderId === 'user_me' && (
              <button
                onClick={() => {
                  if (targetDeleteMessage) {
                    deleteMessageForEveryone(targetDeleteMessage.id);
                    showToast("Message Deleted", "Deleted for everyone in this chat.", "success");
                  }
                  setDeleteModalOpen(false);
                  setTargetDeleteMessage(null);
                }}
                className="w-full text-left p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Delete for everyone
                </div>
                <div className="text-[10px] text-rose-500/80 font-medium">
                  Unsend and replace message for all chat participants
                </div>
              </button>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDeleteModalOpen(false); setTargetDeleteMessage(null); }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-extrabold"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Message Info Panel — group chats only */}
      <MessageInfoPanel
        message={msgInfoTarget}
        onClose={() => setMsgInfoTarget(null)}
      />

    </div>
  );
};
export default ChatWindow;
