import React from 'react';
import { motion } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import {
  Send, Smile, Paperclip, Mic, Image as ImageIcon, FileText, X, Trash2, Lock
} from 'lucide-react';

export const ChatInputBar = ({inputText,setInputText,handleInputChange,handleKeyPress,handleSend,replyMessage,setReplyMessage,editingMessage,setEditingMessage,isRecording,startRecording,stopRecording,cancelRecording,recordTimer,showEmojiPicker,setShowEmojiPicker,emojiPickerRef,showAttachmentMenu,setShowAttachmentMenu,attachmentMenuRef,handleSimulateAttachment,pendingAttachment,handleRemovePendingAttachment,isUploadingAttachment,imageInputRef,fileInputRef,handleImageSelection,handleFileSelection,isBlocked,isGroupBlocked,isMessagingRestricted}) => {
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (isBlocked || isGroupBlocked || isMessagingRestricted) {
    return (
      <div className="p-4 bg-slate-100/90 border-t border-slate-200 text-center select-none shrink-0">
        <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
          <Lock className="h-4 w-4 text-slate-400" />
          {isBlocked
            ? "You cannot send messages to a blocked contact."
            : isGroupBlocked
              ? "This group has been administrative blocked."
              : "Only group admins are permitted to send messages."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f2f5] p-2.5 sm:p-3 border-t border-[#e9edef] shrink-0 relative select-none z-20">
      {/* Hidden file inputs */}
      <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleImageSelection} />
      <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={handleFileSelection} />

      {/* Reply Quote Banner */}
      {replyMessage && (
        <div className="mb-2 p-2.5 rounded-2xl bg-white border-l-4 border-[#00a884] flex items-center justify-between shadow-xs">
          <div className="min-w-0 text-left">
            <span className="text-[11px] font-bold text-[#00a884] block">Replying to {replyMessage.senderName || 'Message'}</span>
            <span className="text-xs text-slate-600 truncate block">{replyMessage.text || 'Attachment'}</span>
          </div>
          <button onClick={() => setReplyMessage(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Editing Banner */}
      {editingMessage && (
        <div className="mb-2 p-2.5 rounded-2xl bg-indigo-50 border-l-4 border-indigo-600 flex items-center justify-between shadow-xs">
          <div className="min-w-0 text-left">
            <span className="text-[11px] font-bold text-indigo-600 block">Editing Message</span>
            <span className="text-xs text-slate-600 truncate block">{editingMessage.text}</span>
          </div>
          <button onClick={() => { setEditingMessage(null); setInputText(''); }} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pending Attachment Modal Preview */}
      {pendingAttachment && (
        <div className="mb-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {pendingAttachment.type === 'image' && pendingAttachment.previewUrl ? (
              <img src={pendingAttachment.previewUrl} alt="Preview" className="h-10 w-10 object-cover rounded-xl border" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            )}
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{pendingAttachment.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold">{pendingAttachment.size}</p>
            </div>
          </div>
          <button onClick={handleRemovePendingAttachment} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-rose-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Voice Recording Active Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-rose-200 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-rose-600 font-mono">{formatTimer(recordTimer)}</span>
            <span className="text-xs text-slate-500 font-medium">Recording audio note...</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cancelRecording} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
              <Trash2 className="h-5 w-5" />
            </button>
            <button onClick={stopRecording} className="px-4 py-2 rounded-xl bg-[#00a884] text-white font-extrabold text-xs shadow-md cursor-pointer">
              Send Voice
            </button>
          </div>
        </div>
      ) : (
        /* Normal Input Toolbar */
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Emoji Picker Button & Popup */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker(prev => !prev)}
              className="p-2.5 rounded-xl text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <Smile className="h-6 w-6" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-14 left-0 z-50 shadow-2xl rounded-3xl border border-slate-200 overflow-hidden">
                <EmojiPicker
                  onEmojiClick={(emojiObj) => setInputText(prev => prev + emojiObj.emoji)}
                  width={320}
                  height={400}
                />
              </div>
            )}
          </div>

          {/* Attachment Button & Popup */}
          <div className="relative" ref={attachmentMenuRef}>
            <button
              onClick={() => setShowAttachmentMenu(prev => !prev)}
              className="p-2.5 rounded-xl text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <Paperclip className="h-6 w-6" />
            </button>
            {showAttachmentMenu && (
              <div className="absolute bottom-14 left-0 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 w-44 space-y-1 text-left">
                <button
                  onClick={() => handleSimulateAttachment('image')}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 text-indigo-500" /> Photos & Images
                </button>
                <button
                  onClick={() => handleSimulateAttachment('pdf')}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-emerald-500" /> Documents & PDF
                </button>
              </div>
            )}
          </div>

          {/* Text Input Area */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-white text-[#111b21] rounded-2xl py-2.5 px-4 text-xs sm:text-sm outline-none border border-[#e9edef] focus:border-[#00a884] transition-all resize-none font-medium max-h-32 shadow-xs"
            />
          </div>

          {/* Send Button or Voice Mic Button */}
          {inputText.trim() || pendingAttachment ? (
            <button
              onClick={handleSend}
              disabled={isUploadingAttachment}
              className="p-3 rounded-2xl bg-[#00a884] hover:bg-[#008069] text-white shadow-md shadow-[#00a884]/20 transition-all cursor-pointer shrink-0"
            >
              <Send className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-3 rounded-2xl bg-white hover:bg-slate-100 text-[#54656f] hover:text-[#111b21] border border-[#e9edef] shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
