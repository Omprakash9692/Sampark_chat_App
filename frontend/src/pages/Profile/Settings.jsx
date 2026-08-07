import React, { useState, useRef } from 'react';

import { 
  User, Mail, Camera, Lock, LogOut, Save, Loader2, Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../../components/ui/Avatar';

export const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useNotifications();

  const fileInputRef = useRef(null);

  // Edit mode state toggle
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile forms fields state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [statusText, setStatusText] = useState(user?.statusText || 'Online');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);

  const handleCancelEdit = () => {
    setName(user?.name || '');
    setBio(user?.bio || '');
    setPhone(user?.phone || '');
    setEmail(user?.email || '');
    setStatusText(user?.statusText || 'Online');
    setAvatarUrl(user?.avatar || '');
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsEditing(false);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);
    // email and phone are intentionally excluded — users cannot change their email address or phone number
    formData.append("statusText", statusText);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      await updateProfile(formData);
      showToast("Profile Updated", "Your profile details have been saved successfully.", "success");
      setIsEditing(false);
      setAvatarFile(null);
    } catch (err) {
      showToast("Update Failed", err.message || "Failed to update profile", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
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
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      showToast("Image Selected", "Click Save Changes to upload the image.", "info");
    }
  };

  const bioLength = bio.length;

  return (
    <div className="flex-grow flex h-full overflow-hidden select-none bg-slate-50/50 relative">
      
      {/* Grid background overlay for design consistency */}
      <div className="absolute inset-0 bg-grid-pattern mask-radial-fade pointer-events-none -z-10 opacity-60" />
      
      <main className="flex-grow overflow-y-auto p-6 md:p-12 no-scrollbar">
        <div className="max-w-xl md:max-w-2xl mx-auto space-y-8 select-none text-left">
          
          {/* Top Profile Header */}
          <div className="flex flex-col items-center justify-center text-center pb-4">
            <div className="relative group">
              <Avatar 
                src={avatarUrl} 
                name={name} 
                size="xl" 
                color={user?.avatarColor}
                className="h-24 w-24 border-4 border-white shadow-md rounded-full object-cover"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Change Avatar"
                >
                  <Camera className="h-4 w-4 text-slate-700" />
                </button>
              )}
            </div>
            
            <h2 className="text-xl font-black text-slate-900 mt-4">{name}</h2>
          </div>

          {/* Form wrapper */}
          <form onSubmit={handleProfileSave} className="space-y-6">
            
            {/* Section 1: Personal Information */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_12px_30px_rgba(15,23,42,0.02)] space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-950">Personal Information</h3>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">Update your profile details and how others see you.</p>
              </div>

              <div className="space-y-4">
                {/* Full name field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Enter full name"
                      disabled={!isEditing}
                      className="block w-full rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 focus:border-slate-350 focus:ring-1 focus:ring-slate-300 text-xs py-3 pl-11 outline-none text-slate-800 transition-all font-medium shadow-xs"
                    />
                  </div>
                </div>

                {/* Email address field — always read-only */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Email Address</label>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <Lock className="h-2.5 w-2.5" /> Locked
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="block w-full rounded-xl bg-slate-50 text-slate-400 border border-slate-200 text-xs py-3 pl-11 outline-none transition-all font-medium shadow-xs cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">Your email address cannot be changed.</p>
                </div>

                {/* Phone Number field — always read-only */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Phone Number</label>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <Lock className="h-2.5 w-2.5" /> Locked
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
                    <input
                      type="tel"
                      value={phone}
                      readOnly
                      disabled
                      className="block w-full rounded-xl bg-slate-50 text-slate-400 border border-slate-200 text-xs py-3 pl-11 outline-none transition-all font-medium shadow-xs cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">Your phone number cannot be changed.</p>
                </div>

                {/* Bio field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.substring(0, 200))}
                    placeholder="Write a short biography..."
                    disabled={!isEditing}
                    className="block w-full rounded-xl bg-white disabled:bg-slate-50 disabled:text-slate-500 border border-slate-200 focus:border-slate-350 focus:ring-1 focus:ring-slate-300 text-xs p-3 outline-none text-slate-800 transition-all min-h-[90px] font-medium shadow-xs"
                  />
                  <div className="text-[10px] text-slate-400 font-bold text-right pt-0.5">
                    {bioLength} / 200 characters
                  </div>
                </div>
              </div>

              {/* Edit / Save changes button */}
              <div className="pt-2 border-t border-slate-100 flex justify-start gap-2.5">
                {!isEditing ? (
                  <button
                    key="btn-edit"
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      key="btn-save"
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Save Changes
                        </>
                      )}
                    </button>
                    <button
                      key="btn-cancel"
                      type="button"
                      disabled={isSaving}
                      onClick={handleCancelEdit}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 font-extrabold text-xs cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Divider zone */}
            <div className="relative py-4 flex items-center select-none justify-center">
              <div className="absolute inset-x-0 h-px bg-slate-200" />
              <span className="relative px-4 text-[9px] font-black uppercase bg-slate-50 text-slate-400 tracking-[0.22em]">Danger Zone</span>
            </div>

            {/* Section 4: Danger Zone */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2 select-none">
              
              {/* Sign out button */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  showToast("Signed Out", "Terminated authentication session successfully.", "info");
                }}
                className="w-full sm:w-auto px-6 py-3 border border-rose-200 hover:border-rose-300 bg-white text-rose-600 font-black rounded-2xl cursor-pointer hover:bg-rose-50/60 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 text-xs"
              >
                <LogOut className="h-4.5 w-4.5" /> Sign Out of SAMPARK
              </button>
            </div>

          </form>

          {/* Page Footer */}
          <div className="pt-12 pb-6 text-center text-[10px] text-slate-400 font-bold leading-relaxed border-t border-slate-200 select-none">
            Version 2.4.0 (Build 992) <br />
            © 2026 SAMPARK Messenger. All rights reserved.
          </div>

        </div>
      </main>
    </div>
  );
};

export default Settings;
