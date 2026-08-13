import React, { useState } from 'react';
import { Search, Shield, ShieldCheck, MoreVertical, Trash2, UserPlus, MessageSquare } from 'lucide-react';
import { Avatar, Badge } from '../../../components/ui/ui';

export const GroupMembersList = ({
  group,
  allUsers,
  user,
  makeGroupAdmin,
  dismissGroupAdmin,
  removeFromGroup,
  createDirectChat,
  selectChat,
  chats,
  showToast,
  setIsAddMembersModalOpen
}) => {
  const [memberSearch, setMemberSearch] = useState('');
  const [activeMemberMenuId, setActiveMemberMenuId] = useState(null);

  if (!group) return null;

  const myRealId = user?.id?.toString() || user?._id?.toString();
  const amIAdmin = (group.adminIds || []).some(id => id === 'user_me' || id === myRealId);

  const groupMembers = (group.memberIds || []).map(id => {
    return allUsers.find(u => u.id === id || u._id?.toString() === id) || {
      id,
      name: id === 'user_me' || id === myRealId ? (user?.name || 'You') : 'Group Member',
      avatarColor: 'from-indigo-500 to-indigo-600'
    };
  });

  const filteredMembers = groupMembers.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.phone && m.phone.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const handleStartDirectChatWithMember = async (targetUser) => {
    const targetId = targetUser.id || targetUser._id?.toString();
    if (targetId === 'user_me' || targetId === myRealId) return;

    const existingChat = chats.find(c => c.type === 'direct' && c.participants.includes(targetId));
    if (existingChat) {
      selectChat(existingChat.id);
    } else {
      const newChat = await createDirectChat(targetId);
      if (newChat) selectChat(newChat.id || newChat);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
          Group Members ({group.memberIds?.length || 0})
        </h4>
        {amIAdmin && (
          <button
            onClick={() => setIsAddMembersModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add Members
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
        <input
          type="text"
          placeholder="Search member..."
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs outline-none text-slate-800 font-medium"
        />
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
        {filteredMembers.map((m) => {
          const mId = m.id || m._id?.toString();
          const isMe = mId === 'user_me' || mId === myRealId;
          const isAdmin = (group.adminIds || []).includes(mId) || (group.adminIds || []).includes('user_me') && isMe;

          return (
            <div key={mId} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 relative">
              <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => !isMe && handleStartDirectChatWithMember(m)}>
                <Avatar src={m.avatar} name={m.name} size="sm" color={m.avatarColor} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">{isMe ? `${m.name} (You)` : m.name}</span>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{m.phone || "No phone number"}</p>
                </div>
              </div>

              {amIAdmin && !isMe && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMemberMenuId(activeMemberMenuId === mId ? null : mId)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {activeMemberMenuId === mId && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 w-44 text-xs font-semibold select-none animate-fadeIn">
                      <button
                        onClick={() => handleStartDirectChatWithMember(m)}
                        className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-slate-500" /> Direct Message
                      </button>
                      {isAdmin ? (
                        <button
                          onClick={async () => {
                            setActiveMemberMenuId(null);
                            await dismissGroupAdmin(group.id, mId);
                            showToast("Admin Removed", `${m.name} is no longer admin.`, "info");
                          }}
                          className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-amber-600 font-bold"
                        >
                          <Shield className="h-3.5 w-3.5 text-amber-500" /> Dismiss Admin
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            setActiveMemberMenuId(null);
                            await makeGroupAdmin(group.id, mId);
                            showToast("Admin Promoted", `${m.name} is now group admin.`, "success");
                          }}
                          className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-indigo-600 font-bold"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> Make Group Admin
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          setActiveMemberMenuId(null);
                          await removeFromGroup(group.id, mId);
                          showToast("Member Removed", `${m.name} removed from group.`, "danger");
                        }}
                        className="w-full px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-bold border-t border-slate-100"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Remove Member
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
