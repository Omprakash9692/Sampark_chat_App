import React from 'react';
import { motion } from 'framer-motion';
import {
  Check, CheckCheck, Edit2, Reply, Forward, Pin, Star, Copy, Trash2, Download, Smile, MoreVertical, Plus
} from 'lucide-react';
import { Avatar, Tooltip } from '../../../components/ui/ui';
import { SimulatedVoicePlayer, renderTextWithLinks } from './SimulatedVoicePlayer';

export const MessageBubble = ({
  msg,
  isMe,
  sender,
  isGroupChat,
  activeChat,
  starredMsgIds,
  handleCopyMsgText,
  handleToggleStarMsg,
  setReplyMessage,
  setEditingMessage,
  setForwardMessage,
  handleTogglePinMessage,
  handleDownloadFile,
  setLightboxImage,
  deleteMessageForMe,
  setTargetDeleteMessage,
  setDeleteModalOpen,
  addReaction,
  quickEmojis,
  activeMsgMenuId,
  setActiveMsgMenuId,
  showEmojiPickerMsgId,
  setShowEmojiPickerMsgId,
  msgMenuRef
}) => {
  const isStarred = starredMsgIds.includes(msg.id);
  const currentPins = activeChat?.pinnedMessageIds || [];
  const isPinned = currentPins.some(p => p.id === msg.id);

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      id={msg.id}
      className={`group flex items-end gap-2 my-1 transition-colors duration-500 rounded-xl px-1 ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      {!isMe && isGroupChat && (
        <Avatar src={sender?.avatar} name={sender?.name || 'User'} size="xs" color={sender?.avatarColor} />
      )}

      <div className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs transition-all ${isMe ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs' : 'bg-white text-[#111b21] rounded-tl-xs'}`}>
        {/* Reply Quote Header */}
        {msg.replyTo && (
          <div className="mb-2 p-2 rounded-xl bg-black/5 border-l-4 border-[#00a884] text-xs">
            <span className="font-bold text-[#00a884] block truncate">
              {msg.replyTo.senderId === 'user_me' ? 'You' : (msg.replyTo.senderName || 'Reply')}
            </span>
            <span className="text-slate-600 block truncate">{msg.replyTo.text || 'Attachment'}</span>
          </div>
        )}

        {/* Sender Name in Group */}
        {!isMe && isGroupChat && (
          <span className="text-[11px] font-black text-[#008069] block mb-1">
            {sender?.name || 'Group Member'}
          </span>
        )}

        {/* Message Content Types */}
        {msg.isDeleted ? (
          <p className="text-xs italic text-slate-500 font-medium">This message was deleted.</p>
        ) : (
          <>
            {msg.type === 'image' && msg.attachmentUrl && (
              <div className="mb-2 overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxImage(msg.attachmentUrl)}>
                <img src={msg.attachmentUrl} alt="Attachment" className="max-h-60 w-full object-cover rounded-xl hover:scale-102 transition-transform" />
              </div>
            )}

            {msg.type === 'file' && msg.attachmentUrl && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/5 mb-2">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Download className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-slate-900 truncate">{msg.attachmentName || 'Document'}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{msg.attachmentSize || 'File'}</p>
                </div>
                <button
                  onClick={(e) => handleDownloadFile(e, msg.attachmentUrl, msg.attachmentName)}
                  className="p-1.5 rounded-lg hover:bg-black/10 text-slate-600 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            )}

            {msg.type === 'audio' && (
              <div className="mb-2">
                <SimulatedVoicePlayer duration={msg.attachmentDuration} url={msg.attachmentUrl} />
              </div>
            )}

            {msg.text && (
              <p className="text-xs sm:text-sm font-medium leading-relaxed break-words whitespace-pre-wrap text-left">
                {renderTextWithLinks(msg.text)}
              </p>
            )}
          </>
        )}

        {/* Bottom Metadata Bar */}
        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-[#667781] select-none">
          {msg.edited && !msg.isDeleted && <span className="italic">edited</span>}
          {isStarred && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
          {isPinned && <Pin className="h-3 w-3 text-indigo-600 transform rotate-45 shrink-0" />}
          <span>{formatMessageTime(msg.timestamp)}</span>
          {isMe && !msg.isDeleted && (
            <span className="ml-0.5">
              {msg.status === 'seen' ? (
                <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
              ) : msg.status === 'delivered' ? (
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <Check className="h-3.5 w-3.5 text-slate-400" />
              )}
            </span>
          )}
        </div>

        {/* Reaction Badges */}
        {msg.emojiReactions && msg.emojiReactions.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {msg.emojiReactions.map((r, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 bg-white/90 shadow-xs border border-slate-200/60 rounded-full px-2 py-0.5 text-[10px] font-extrabold text-slate-800">
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Context Action Menu Trigger */}
        {!msg.isDeleted && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setActiveMsgMenuId(activeMsgMenuId === msg.id ? null : msg.id)}
              className="p-1 rounded-lg bg-black/10 hover:bg-black/20 text-slate-700 cursor-pointer"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
