import React, { useState, useRef } from 'react';
import { Search, Camera, X, ArrowLeft, ChevronRight } from 'lucide-react';
import { Avatar, Modal } from '../../../components/ui/ui';

export const CreateGroupModal = ({
  isOpen,
  onClose,
  allUsers,
  user,
  uploadFile,
  createGroup,
  showToast
}) => {
  const [groupStep, setGroupStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupAvatarUrl, setGroupAvatarUrl] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isUploadingGroupAvatar, setIsUploadingGroupAvatar] = useState(false);

  const groupAvatarInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setGroupStep(1);
    setGroupName('');
    setGroupDesc('');
    setSelectedMembers([]);
    setGroupAvatarUrl('');
    setMemberSearchQuery('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleToggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleGroupAvatarChange = async (e) => {
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
      setIsUploadingGroupAvatar(true);
      const uploadedData = await uploadFile(file);
      setIsUploadingGroupAvatar(false);

      if (uploadedData && uploadedData.url) {
        setGroupAvatarUrl(uploadedData.url);
        showToast("Image Uploaded", "Group avatar icon ready.", "info");
      } else {
        setGroupAvatarUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast("Validation Error", "Please enter a group name.", "warning");
      return;
    }
    if (selectedMembers.length === 0) {
      showToast("Validation Error", "Please select at least 1 member for the group.", "warning");
      return;
    }

    const newGroup = await createGroup({
      name: groupName.trim(),
      description: groupDesc.trim(),
      avatar: groupAvatarUrl,
      members: selectedMembers
    });

    if (newGroup) {
      showToast("Group Created", `Group "${groupName}" created successfully!`, "success");
      handleClose();
    } else {
      showToast("Creation Failed", "Could not create group.", "danger");
    }
  };

  const candidateUsers = allUsers.filter(u => {
    const uId = u.id || u._id?.toString();
    const myRealId = user?.id || user?._id?.toString();
    const isAdmin = u.role === 'admin' || u.role === 'Admin';
    return uId !== 'user_me' && uId !== myRealId && u.email !== user?.email && !isAdmin &&
      (u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        (u.phone && u.phone.toLowerCase().includes(memberSearchQuery.toLowerCase())) ||
        u.email.toLowerCase().includes(memberSearchQuery.toLowerCase()));
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={groupStep === 1 ? "Create Group - Select Members (1/2)" : "Create Group - Group Details (2/2)"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left p-1 select-none">
        {/* STEP 1: Select Members */}
        {groupStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#54656f]">
                Select members to add to the group ({selectedMembers.length} selected)
              </span>
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#f0f4f8] rounded-xl max-h-24 overflow-y-auto border border-slate-200/80">
                {selectedMembers.map(memberId => {
                  const m = allUsers.find(u => u.id === memberId || u._id?.toString() === memberId);
                  if (!m) return null;
                  return (
                    <div
                      key={memberId}
                      className="inline-flex items-center gap-1.5 bg-[#008069]/10 border border-[#008069]/30 pl-1.5 pr-2.5 py-1 rounded-full text-[11px] font-extrabold text-[#008069] shadow-2xs"
                    >
                      <Avatar src={m.avatar} name={m.name} size="xs" color={m.avatarColor} />
                      <span>{m.name.split(' ')[0]}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleMember(memberId)}
                        className="text-[#008069] hover:text-rose-500 transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="relative">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4.5 w-4.5 my-auto" />
              <input
                type="text"
                placeholder="Search user by name or phone number..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs py-2.5 pl-10 pr-4 outline-none text-[#111b21] placeholder-[#667781] font-medium"
              />
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-200/80 rounded-xl p-2 space-y-1.5 bg-[#f8fafc] no-scrollbar">
              {candidateUsers.map((u) => {
                const uId = u.id || u._id?.toString();
                const isSelected = selectedMembers.includes(uId);
                return (
                  <div
                    key={uId}
                    onClick={() => handleToggleMember(uId)}
                    className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${isSelected ? 'bg-[#008069]/10 border-[#008069] shadow-2xs' : 'bg-white border-slate-200/80 shadow-2xs hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size="sm" color={u.avatarColor} />
                      <div className="text-left min-w-0">
                        <div className="text-xs font-bold text-[#111b21] truncate">{u.name}</div>
                        <div className="text-[11px] text-[#667781] font-medium truncate mt-0.5">{u.phone || "No phone number"}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      className="h-4 w-4 accent-[#008069] rounded cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedMembers.length === 0}
                onClick={() => setGroupStep(2)}
                className={`px-6 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 shadow-sm ${selectedMembers.length > 0
                  ? 'bg-gradient-to-r from-[#008069] to-[#00a884] hover:from-[#006e5a] hover:to-[#008069] text-white shadow-md cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200/60'
                  }`}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Group Details */}
        {groupStep === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center gap-2 mb-2">
              <div className="relative group cursor-pointer" onClick={() => groupAvatarInputRef.current?.click()}>
                <Avatar
                  src={groupAvatarUrl}
                  name={groupName || "New Group"}
                  size="xl"
                  className="h-20 w-20 border-2 border-slate-200 object-cover shadow-md rounded-full transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-950/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <input
                  type="file"
                  ref={groupAvatarInputRef}
                  onChange={handleGroupAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <span className="text-[10px] font-black uppercase text-[#667781] tracking-wider">
                {isUploadingGroupAvatar ? "Uploading icon..." : "Group Icon (Click to change)"}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#54656f] uppercase tracking-wider">
                Group Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Developers, Marketing Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs py-3 px-4 outline-none font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-[#54656f] uppercase tracking-wider">
                Description (Optional)
              </label>
              <textarea
                placeholder="Provide a short summary of what this group is about..."
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="block w-full rounded-xl bg-[#f0f4f8] border border-slate-200/80 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs p-3.5 outline-none font-semibold min-h-[70px] resize-none"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <label className="block text-[10px] font-black text-[#54656f] uppercase tracking-wider">
                Selected Members ({selectedMembers.length})
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {selectedMembers.map(memberId => {
                  const m = allUsers.find(u => u.id === memberId || u._id?.toString() === memberId);
                  if (!m) return null;
                  return (
                    <div key={memberId} className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={m.avatar} name={m.name} size="sm" color={m.avatarColor} />
                        <div className="min-w-0 text-left">
                          <span className="font-bold text-xs text-[#111b21] block truncate">{m.name}</span>
                          <span className="text-[10px] text-[#667781] block truncate">{m.phone || "No phone number"}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleMember(memberId)}
                        className="p-1 rounded-lg text-[#667781] hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setGroupStep(1)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#008069] to-[#00a884] hover:from-[#006e5a] hover:to-[#008069] text-white shadow-md cursor-pointer"
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
