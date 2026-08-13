import React, { useState, useRef, useEffect } from 'react';
import { Pin, ChevronDown } from 'lucide-react';

export const PinnedMessagesBar = ({ activeChat, messages, handleTogglePinMessage }) => {
  const [pinnedBannerIndex, setPinnedBannerIndex] = useState(0);
  const [pinnedDropdownOpen, setPinnedDropdownOpen] = useState(false);
  const pinnedDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutsidePin = (e) => {
      if (pinnedDropdownRef.current && !pinnedDropdownRef.current.contains(e.target)) {
        setPinnedDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsidePin);
    return () => document.removeEventListener('mousedown', handleClickOutsidePin);
  }, []);

  const pinnedMessageIds = activeChat?.pinnedMessageIds || [];
  const pinnedMessages = pinnedMessageIds
    .map(p => {
      const msg = messages.find(m => m.id === p.id);
      return msg ? { ...msg, pinnedUntil: p.pinnedUntil } : null;
    })
    .filter(Boolean);

  if (pinnedMessages.length === 0) return null;

  const safePinnedIndex = pinnedBannerIndex % pinnedMessages.length;
  const currentPinnedMsg = pinnedMessages[safePinnedIndex] || null;

  const getPinnedPreview = (msg) => {
    if (!msg) return '';
    if (msg.type === 'image') return '📷 Photo';
    if (msg.type === 'audio') return '🎤 Voice message';
    if (msg.type === 'file') return `📄 ${msg.attachmentName || 'Document'}`;
    if (msg.text) return msg.text;
    return 'Attachment';
  };

  return (
    <div className="bg-[#f0f2f5] border-b border-[#e9edef] shrink-0 select-none z-10">
      <div
        className="max-w-4xl mx-auto flex items-center justify-between px-3 sm:px-4 py-1.5 cursor-pointer hover:bg-[#e9edef]/60 transition-colors relative"
        onClick={() => {
          if (pinnedMessages.length > 1) {
            setPinnedBannerIndex(prev => (prev + 1) % pinnedMessages.length);
          }
        }}
      >
        <div className="flex-1 min-w-0 px-3 py-2 flex items-center gap-2 text-left">
          <Pin className="h-3.5 w-3.5 text-[#54656f] shrink-0 transform rotate-45" />
          <p className="text-xs text-[#111b21] font-semibold truncate leading-none">
            {getPinnedPreview(currentPinnedMsg)}
          </p>
        </div>

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

          {pinnedDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1 w-44 text-xs font-semibold select-none animate-in fade-in zoom-in-95">
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
              <button
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left text-slate-800"
                onClick={() => {
                  setPinnedDropdownOpen(false);
                  handleTogglePinMessage(currentPinnedMsg);
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
  );
};
