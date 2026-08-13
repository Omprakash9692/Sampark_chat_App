import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Avatar, Modal } from '../../../components/ui/ui';

export const NewContactModal = ({ isOpen, onClose, allUsers, user, handleStartDirectChat }) => {
  const [contactSearch, setContactSearch] = useState('');

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter(u => {
    const uId = u.id || u._id?.toString();
    const myRealId = user?.id || user?._id?.toString();
    const isAdmin = u.role === 'admin' || u.role === 'Admin';

    return uId !== 'user_me' &&
      uId !== myRealId &&
      u.email !== user?.email &&
      !isAdmin &&
      (u.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        (u.phone && u.phone.toLowerCase().includes(contactSearch.toLowerCase())) ||
        u.email.toLowerCase().includes(contactSearch.toLowerCase()));
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { setContactSearch(''); onClose(); }}
      title="Start New Chat"
      size="md"
    >
      <div className="space-y-4 text-left p-1 select-none">
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4.5 w-4.5 my-auto" />
          <input
            type="text"
            placeholder="Search user by name or phone number..."
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs py-2.5 pl-10 pr-4 outline-none text-[#111b21] placeholder-[#667781] font-medium"
          />
        </div>

        <div className="max-h-64 overflow-y-auto border border-slate-200/80 rounded-xl p-2 space-y-1.5 bg-[#f8fafc] no-scrollbar">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#667781] font-semibold">
              No users found
            </div>
          ) : (
            filteredUsers.map((u) => {
              const targetId = u.id || u._id?.toString();
              return (
                <div
                  key={targetId}
                  onClick={() => { setContactSearch(''); handleStartDirectChat(u); }}
                  className="p-3 rounded-2xl flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors border bg-white border-slate-200/80 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={u.avatar} name={u.name} size="sm" color={u.avatarColor} />
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-[#111b21] truncate">{u.name}</div>
                      <div className="text-[11px] text-[#667781] font-medium truncate mt-0.5">{u.phone || "No phone number"}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={() => { setContactSearch(''); onClose(); }}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60 active:scale-95 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
