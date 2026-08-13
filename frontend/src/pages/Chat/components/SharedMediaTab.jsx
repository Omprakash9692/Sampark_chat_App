import React, { useState } from 'react';
import { ImageIcon, FileText, Link as LinkIcon, Download } from 'lucide-react';
import { Tabs } from '../../../components/ui/ui';

export const SharedMediaTab = ({ messages, allUsers, authUser, showToast }) => {
  const [activeMediaTab, setActiveMediaTab] = useState('media');
  const [lightboxImage, setLightboxImage] = useState(null);

  const sharedImages = messages.filter(m => m.type === 'image' && !m.isDeleted);
  const sharedDocs = messages.filter(m => m.type === 'file' && !m.isDeleted);

  const sharedLinks = [];
  const urlRegex = /(https?:\/\/[^\s\n\r]+)/gi;
  messages.forEach(m => {
    if (m.text && !m.isDeleted) {
      const matches = m.text.match(urlRegex);
      if (matches) {
        matches.forEach(url => {
          let cleanUrl = url;
          if (/[.,;:!?)]$/.test(cleanUrl)) cleanUrl = cleanUrl.slice(0, -1);

          let displayDomain = cleanUrl;
          try {
            const parsed = new URL(cleanUrl);
            displayDomain = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
          } catch (e) {
            displayDomain = cleanUrl.replace(/^https?:\/\/(www\.)?/, '');
          }

          if (displayDomain.length > 35) displayDomain = displayDomain.substring(0, 32) + '...';

          const sender = allUsers.find(u => u.id === m.senderId || u._id?.toString() === m.senderId) || (m.senderId === 'user_me' ? authUser : null);
          const senderName = sender ? sender.name : "Someone";

          if (!sharedLinks.some(link => link.url === cleanUrl)) {
            sharedLinks.push({
              url: cleanUrl,
              display: displayDomain,
              senderName,
              timestamp: new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
            });
          }
        });
      }
    }
  });

  const handleDownloadFile = async (e, url, name) => {
    e.preventDefault();
    if (!url || url === '#') {
      showToast("File Saved", "Mock file downloaded.", "success");
      return;
    }

    try {
      showToast("Downloading", "Downloading file...", "info");
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast("Downloaded", "File downloaded successfully.", "success");
    } catch (error) {
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast("Opened", "Opened file preview in a new tab.", "info");
    }
  };

  const mediaTabs = [
    { id: 'media', label: `Media (${sharedImages.length})`, icon: ImageIcon },
    { id: 'files', label: `Files (${sharedDocs.length})`, icon: FileText },
    { id: 'links', label: `Links (${sharedLinks.length})`, icon: LinkIcon }
  ];

  return (
    <div className="space-y-3 text-left">
      <div className="flex justify-center border-b border-slate-200/80 pb-2">
        <Tabs tabs={mediaTabs} activeTab={activeMediaTab} onChange={setActiveMediaTab} variant="pill" />
      </div>

      {activeMediaTab === 'media' && (
        sharedImages.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-semibold text-xs">No media shared yet.</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto no-scrollbar">
            {sharedImages.map((m, idx) => (
              <div key={m.id || idx} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-slate-100 border border-slate-200/60" onClick={() => setLightboxImage(m.attachmentUrl)}>
                <img src={m.attachmentUrl} alt="Shared media" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )
      )}

      {activeMediaTab === 'files' && (
        sharedDocs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-semibold text-xs">No files shared yet.</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {sharedDocs.map((m, idx) => (
              <div key={m.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/70 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{m.attachmentName || 'Document'}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{m.attachmentSize || 'File'}</p>
                  </div>
                </div>
                <button onClick={(e) => handleDownloadFile(e, m.attachmentUrl, m.attachmentName)} className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 cursor-pointer">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {activeMediaTab === 'links' && (
        sharedLinks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-semibold text-xs">No links shared yet.</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {sharedLinks.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/70 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-600 truncate underline">{link.display}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Shared by {link.senderName} • {link.timestamp}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Fullscreen preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};
