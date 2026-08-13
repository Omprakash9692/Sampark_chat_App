import React, { useState } from 'react';
import { AlertTriangle, Flag, UserX, LogOut, Trash2 } from 'lucide-react';
import { Modal, Button } from '../../../components/ui/ui';

export const SidebarRightModals = ({
  isBlockModalOpen,
  setIsBlockModalOpen,
  isBlocked,
  recipientName,
  handleBlockToggle,
  isLeaveModalOpen,
  setIsLeaveModalOpen,
  groupName,
  groupMembersCount,
  amIAdmin,
  otherAdminsCount,
  groupOtherMembers,
  handleLeaveGroup,
  handleMakeAdminAndLeave,
  isDeleteGroupModalOpen,
  setIsDeleteGroupModalOpen,
  handleDeleteGroup,
  isReportModalOpen,
  setIsReportModalOpen,
  handleReportSubmit,
  reportReason,
  setReportReason,
  reportDetails,
  setReportDetails
}) => {
  const [selectedPromoteAdminId, setSelectedPromoteAdminId] = useState('');

  return (
    <>
      {/* Block User Modal */}
      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title={isBlocked ? "Unblock Contact" : "Block Contact"} size="sm">
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            {isBlocked
              ? `Are you sure you want to unblock ${recipientName}? They will be able to send you direct messages.`
              : `Are you sure you want to block ${recipientName}? They will no longer be able to send you direct messages.`}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsBlockModalOpen(false)}>Cancel</Button>
            <Button variant={isBlocked ? "primary" : "danger"} onClick={handleBlockToggle}>
              {isBlocked ? "Unblock Contact" : "Block Contact"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Group Modal */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title={`Leave "${groupName}" Group`} size="md">
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to leave this group space? You will no longer receive new messages from group members.
          </p>

          {amIAdmin && otherAdminsCount === 0 && groupMembersCount > 1 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> You are the sole group admin!
              </p>
              <p className="text-[11px] text-amber-700 font-medium">Please assign a new admin before leaving:</p>
              <select
                value={selectedPromoteAdminId}
                onChange={e => setSelectedPromoteAdminId(e.target.value)}
                className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-900 outline-none"
              >
                <option value="">Select a member to make admin...</option>
                {groupOtherMembers.map(m => (
                  <option key={m.id || m._id} value={m.id || m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
            {amIAdmin && otherAdminsCount === 0 && groupMembersCount > 1 ? (
              <Button
                variant="danger"
                disabled={!selectedPromoteAdminId}
                onClick={() => handleMakeAdminAndLeave(selectedPromoteAdminId)}
              >
                Assign & Leave
              </Button>
            ) : (
              <Button variant="danger" onClick={handleLeaveGroup}>
                Leave Group
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Group Modal */}
      <Modal isOpen={isDeleteGroupModalOpen} onClose={() => setIsDeleteGroupModalOpen(false)} title={`Delete "${groupName}" Group`} size="sm">
        <div className="space-y-4 text-left p-1 select-none">
          <p className="text-xs text-slate-600 font-medium">
            Are you sure you want to permanently delete the "{groupName}" group? All message history will be deleted for all members.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteGroupModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteGroup}>Delete Group</Button>
          </div>
        </div>
      </Modal>

      {/* Report User Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={`Report ${recipientName}`} size="sm">
        <form onSubmit={handleReportSubmit} className="space-y-4 text-left p-1 select-none">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Reason</label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
            >
              <option value="spam">Spam & Unsolicited Messages</option>
              <option value="harassment">Harassment & Bullying</option>
              <option value="hate">Hate Speech & Abuse</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Additional Details</label>
            <textarea
              value={reportDetails}
              onChange={e => setReportDetails(e.target.value)}
              placeholder="Provide extra details for admin reviewer..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none min-h-[70px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger">Submit Report</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
