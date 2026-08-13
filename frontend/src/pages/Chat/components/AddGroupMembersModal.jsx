import React, { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { Avatar, Modal } from '../../../components/ui/ui';

export const AddGroupMembersModal = ({
  isOpen,
  onClose,
  group,
  allUsers,
  user,
  addMembersToGroup,
  showToast
}) => {
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !group) return null;

  const currentMemberIds = group.memberIds || [];
  const candidateUsers = allUsers.filter(u => {
    const uId = u.id || u._id?.toString();
    const myRealId = user?.id || user?._id?.toString();
    const isAdmin = u.role === 'admin' || u.role === 'Admin';

    return !currentMemberIds.includes(uId) &&
      uId !== 'user_me' &&
      uId !== myRealId &&
      !isAdmin &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase())));
  });

  const toggleSelectMember = (uId) => {
    setSelectedMemberIds(prev =>
      prev.includes(uId) ? prev.filter(id => id !== uId) : [...prev, uId]
    );
  };

  const handleConfirmAdd = async () => {
    if (selectedMemberIds.length === 0) return;
    const success = await addMembersToGroup(group.id, selectedMemberIds);
    if (success) {
      showToast("Members Added", `Added ${selectedMemberIds.length} members to group.`, "success");
      setSelectedMemberIds([]);
      onClose();
    } else {
      showToast("Error", "Could not add members to group.", "danger");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Members to ${group.name}`} size="md">
      <div className="space-y-4 text-left p-1 select-none">
        <div className="relative">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
          <input
            type="text"
            placeholder="Search contact by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs outline-none text-slate-800 font-medium"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1.5 no-scrollbar">
          {candidateUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-semibold">No contacts available to add.</div>
          ) : (
            candidateUsers.map((u) => {
              const uId = u.id || u._id?.toString();
              const isSelected = selectedMemberIds.includes(uId);

              return (
                <div
                  key={uId}
                  onClick={() => toggleSelectMember(uId)}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${isSelected ? 'bg-indigo-50/70 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size="sm" color={u.avatarColor} />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{u.phone || "No phone"}</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={isSelected} onChange={() => { }} className="h-4 w-4 text-indigo-600 rounded cursor-pointer" />
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button
            onClick={handleConfirmAdd}
            disabled={selectedMemberIds.length === 0}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs disabled:opacity-50"
          >
            Add Selected ({selectedMemberIds.length})
          </button>
        </div>
      </div>
    </Modal>
  );
};
