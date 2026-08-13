import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Forward, Flag, Pin, Trash2, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Avatar, Badge } from '../../../components/ui/ui';

export const ForwardMessageModal = ({ forwardMessage, chats, allUsers, user, onClose, onSendForward }) => {
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [forwardSearch, setForwardSearch] = useState('');

  if (!forwardMessage) return null;

  const toggleSelectChat = (chatId) => {
    setSelectedChatIds(prev =>
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  };

  const filteredChats = chats.filter(c => {
    const name = c.name || (allUsers.find(u => u.id === c.participants?.find(p => p !== 'user_me'))?.name);
    return name?.toLowerCase().includes(forwardSearch.toLowerCase());
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Forward className="h-5 w-5 text-indigo-600" /> Forward Message
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs italic text-slate-600 mb-4 truncate">
            "{forwardMessage.text || 'Shared Attachment'}"
          </div>

          <input
            type="text"
            placeholder="Search contacts or groups..."
            value={forwardSearch}
            onChange={e => setForwardSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none mb-4"
          />

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {filteredChats.map(c => {
              const isDirect = c.type === 'direct';
              const recipientId = isDirect ? c.participants?.find(p => p !== 'user_me') : null;
              const recipient = isDirect ? allUsers.find(u => u.id === recipientId) : null;
              const title = isDirect ? (recipient?.name || c.name) : c.name;
              const isSelected = selectedChatIds.includes(c.id);

              return (
                <div
                  key={c.id}
                  onClick={() => toggleSelectChat(c.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/70 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={isDirect ? recipient?.avatar : c.avatar} name={title} size="sm" />
                    <span className="text-xs font-bold text-slate-900">{title}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => { }}
                    className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={() => onSendForward(selectedChatIds)}
              disabled={selectedChatIds.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs disabled:opacity-50"
            >
              Send ({selectedChatIds.length})
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const ReportUserModal = ({ activeChat, recipient, isOpen, onClose, onSubmitReport }) => {
  const [reason, setReason] = useState('Harassment & Bullying');
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const targetName = recipient?.name || activeChat?.name || 'User';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
              <Flag className="h-5 w-5" /> Report {targetName}
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            Please select a reason for reporting this user. Incidents will be sent directly to admin compliance reviewers.
          </p>

          <div className="space-y-2">
            {['Harassment & Bullying', 'Spam & Unsolicited Media', 'Hate Speech & Abuse', 'Inappropriate Content'].map(r => (
              <label key={r} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-800">
                <input type="radio" name="reportReason" checked={reason === r} onChange={() => setReason(r)} className="text-rose-600" />
                {r}
              </label>
            ))}
          </div>

          <textarea
            placeholder="Add extra context or details (optional)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
          />

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={() => onSubmitReport(reason, comment)}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md"
            >
              Submit Report
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const PinDurationModal = ({ isOpen, onClose, selectedDurationHours, setSelectedDurationHours, onConfirmPin }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Pin className="h-5 w-5 text-indigo-600 transform rotate-45" /> Choose Pin Duration
            </h3>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {[
              { hours: 24, label: '24 Hours' },
              { hours: 168, label: '7 Days (Default)' },
              { hours: 720, label: '30 Days' }
            ].map(item => (
              <label key={item.hours} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="radio"
                  name="pinDuration"
                  checked={selectedDurationHours === item.hours}
                  onChange={() => setSelectedDurationHours(item.hours)}
                  className="text-indigo-600"
                />
                {item.label}
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={onConfirmPin}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md"
            >
              Pin Message
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
