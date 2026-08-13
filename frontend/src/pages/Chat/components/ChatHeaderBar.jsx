import React from 'react';
import { ArrowLeft, Search, Info, MoreVertical, X, Phone, ShieldCheck, Flag } from 'lucide-react';
import { Avatar, Tooltip } from '../../../components/ui/ui';

export const ChatHeaderBar = ({
  activeChat,
  isDirect,
  recipient,
  group,
  typingUsers,
  showSearchInChat,
  setShowSearchInChat,
  searchInChatQuery,
  setSearchInChatQuery,
  onBack,
  toggleRightSidebar,
  isRightSidebarOpen,
  headerMenuOpen,
  setHeaderMenuOpen,
  headerMenuRef,
  setReportModalOpen
}) => {
  if (!activeChat) return null;

  const currentTyping = typingUsers[activeChat.id] || [];

  return (
    <div className="h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between shrink-0 z-20 shadow-[0_2px_15px_rgba(15,23,42,0.03)] select-none">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="cursor-pointer flex items-center gap-3 min-w-0" onClick={toggleRightSidebar}>
          <Avatar
            src={isDirect ? (recipient?.avatar || activeChat.avatar) : (group?.avatar || activeChat.avatar)}
            name={isDirect ? (recipient?.name || activeChat.name) : (group?.name || activeChat.name)}
            size="md"
            status={isDirect ? (recipient?.status || 'online') : null}
            color={isDirect ? recipient?.avatarColor : "from-blue-600 to-indigo-600"}
          />

          <div className="min-w-0 text-left">
            <h2 className="text-sm sm:text-base font-black text-slate-900 truncate tracking-tight">
              {isDirect ? (recipient?.name || activeChat.name) : (group?.name || activeChat.name)}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
              {currentTyping.length > 0 ? (
                <span className="text-indigo-600 font-bold animate-pulse flex items-center gap-1">
                  <span>typing</span>
                  <span className="flex gap-0.5">
                    <span className="h-1 w-1 rounded-full bg-indigo-600 animate-bounce" />
                    <span className="h-1 w-1 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1 w-1 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  </span>
                </span>
              ) : isDirect ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              ) : (
                <span>{(group?.memberIds || activeChat.participants || []).length} Members</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {showSearchInChat ? (
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search in chat..."
              value={searchInChatQuery}
              onChange={(e) => setSearchInChatQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-slate-800"
              autoFocus
            />
            <button onClick={() => { setShowSearchInChat(false); setSearchInChatQuery(''); }} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Tooltip content="Search messages">
            <button
              onClick={() => setShowSearchInChat(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Search className="h-5 w-5" />
            </button>
          </Tooltip>
        )}

        <Tooltip content="Chat Details">
          <button
            onClick={toggleRightSidebar}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${isRightSidebarOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <Info className="h-5 w-5" />
          </button>
        </Tooltip>

        <div className="relative" ref={headerMenuRef}>
          <button
            onClick={() => setHeaderMenuOpen(prev => !prev)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {headerMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-2 z-50 text-left animate-fadeIn">
              <button
                onClick={() => { setHeaderMenuOpen(false); toggleRightSidebar(); }}
                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Info className="h-4 w-4 text-slate-400" /> View Details
              </button>
              {isDirect && (
                <button
                  onClick={() => { setHeaderMenuOpen(false); if (typeof setReportModalOpen === 'function') setReportModalOpen(true); }}
                  className="w-full px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Flag className="h-4 w-4 text-rose-500" /> Report User
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
