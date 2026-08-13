import React, { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { Avatar, Modal } from '../../../components/ui/ui';

export const EditGroupDetailsModal = ({
  isOpen,
  onClose,
  group,
  updateGroupProfile,
  uploadFile,
  showToast
}) => {
  const [groupName, setGroupName] = useState(group?.name || '');
  const [groupDesc, setGroupDesc] = useState(group?.description || '');
  const [groupAvatarUrl, setGroupAvatarUrl] = useState(group?.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen || !group) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Invalid File", "Please select an image file.", "danger");
      return;
    }

    setIsUploadingAvatar(true);
    const uploaded = await uploadFile(file);
    setIsUploadingAvatar(false);

    if (uploaded && uploaded.url) {
      setGroupAvatarUrl(uploaded.url);
      showToast("Uploaded", "Group icon ready.", "info");
    } else {
      setGroupAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast("Validation Error", "Group name cannot be empty.", "warning");
      return;
    }

    const updated = await updateGroupProfile(group.id, {
      name: groupName.trim(),
      description: groupDesc.trim(),
      avatar: groupAvatarUrl
    });

    if (updated) {
      showToast("Group Updated", "Group details updated successfully.", "success");
      onClose();
    } else {
      showToast("Error", "Could not update group profile.", "danger");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Group Profile" size="md">
      <form onSubmit={handleSave} className="space-y-4 text-left p-1 select-none">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar src={groupAvatarUrl} name={groupName || 'Group'} size="xl" className="h-20 w-20 border-2 border-slate-200 object-cover rounded-full" />
            <div className="absolute inset-0 bg-slate-950/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400">
            {isUploadingAvatar ? "Uploading icon..." : "Change Group Icon"}
          </span>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase">Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-900"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase">Description</label>
          <textarea
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-semibold text-slate-900 min-h-[70px] resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
