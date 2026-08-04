import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, ArrowLeft, Eye, Check, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from './Avatar';

const PAGE_LIMIT = 10;

const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return (
    d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
};

const UserRow = ({ user, time, detail }) => (
  <div className="flex items-center gap-3 py-3 px-1">
    <Avatar src={user?.avatar} name={user?.name} size="md" color={user?.avatarColor} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Unknown'}</p>
      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{detail || '—'}</p>
    </div>
    {time && (
      <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap shrink-0 ml-2">
        {formatTime(time)}
      </span>
    )}
  </div>
);

const SectionHeader = ({ icon: Icon, label, count, iconBg }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconBg}`}>
      <Icon className="h-3.5 w-3.5" />
    </div>
    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{label}</span>
    <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
      {count}
    </span>
  </div>
);

export const MessageInfoPanel = ({ message, onClose }) => {
  const isOpen = !!message;
  const { socket } = useChat();
  const { authFetch } = useAuth();

  const [readBy, setReadBy] = useState([]);
  const [deliveredTo, setDeliveredTo] = useState([]);
  const [totalRead, setTotalRead] = useState(0);
  const [totalDelivered, setTotalDelivered] = useState(0);
  const [readPage, setReadPage] = useState(1);
  const [deliveredPage, setDeliveredPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMoreRead, setLoadingMoreRead] = useState(false);
  const [loadingMoreDelivered, setLoadingMoreDelivered] = useState(false);

  // Fetch first page of both sections when panel opens
  const fetchInfo = useCallback(async (msgId) => {
    if (!msgId) return;
    setLoading(true);
    setReadBy([]);
    setDeliveredTo([]);
    setReadPage(1);
    setDeliveredPage(1);

    try {
      const res = await authFetch(
        `http://localhost:5000/api/chats/messages/${msgId}/info?page=1&limit=${PAGE_LIMIT}`
      );
      if (res.ok) {
        const result = await res.json();
        const { readBy: rb, deliveredTo: dt, totalRead: tr, totalDelivered: td } = result.data;
        setReadBy(rb || []);
        setDeliveredTo(dt || []);
        setTotalRead(tr || 0);
        setTotalDelivered(td || 0);
      }
    } catch (err) {
      console.error('Failed to fetch message info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Silent refresh for real-time live updates without showing spinner
  const refreshSilent = useCallback(async (msgId) => {
    if (!msgId) return;
    try {
      const res = await authFetch(
        `http://localhost:5000/api/chats/messages/${msgId}/info?page=1&limit=${PAGE_LIMIT}`
      );
      if (res.ok) {
        const result = await res.json();
        const { readBy: rb, deliveredTo: dt, totalRead: tr, totalDelivered: td } = result.data;
        setReadBy(rb || []);
        setDeliveredTo(dt || []);
        setTotalRead(tr || 0);
        setTotalDelivered(td || 0);
      }
    } catch (err) {
      console.error('Failed to silently refresh message info:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen && message?.id) {
      fetchInfo(message.id);
    }
  }, [isOpen, message?.id, fetchInfo]);

  // Real-time live update: listen to socket events for instant UI update
  useEffect(() => {
    if (!socket || !isOpen || !message?.id) return;

    const handleSocketUpdate = () => {
      refreshSilent(message.id);
    };

    socket.on('messages-seen', handleSocketUpdate);
    socket.on('messages-delivered', handleSocketUpdate);
    socket.on('receive-message', handleSocketUpdate);

    return () => {
      socket.off('messages-seen', handleSocketUpdate);
      socket.off('messages-delivered', handleSocketUpdate);
      socket.off('receive-message', handleSocketUpdate);
    };
  }, [socket, isOpen, message?.id, refreshSilent]);

  // Fallback poll every 3 seconds while panel is open
  useEffect(() => {
    if (!isOpen || !message?.id) return;

    const interval = setInterval(() => {
      refreshSilent(message.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, message?.id, refreshSilent]);

  const loadMoreRead = async () => {
    const nextPage = readPage + 1;
    setLoadingMoreRead(true);
    try {
      const res = await authFetch(
        `http://localhost:5000/api/chats/messages/${message.id}/info?page=${nextPage}&limit=${PAGE_LIMIT}`
      );
      if (res.ok) {
        const result = await res.json();
        setReadBy(prev => [...prev, ...(result.data.readBy || [])]);
        setReadPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more read receipts:', err);
    } finally {
      setLoadingMoreRead(false);
    }
  };

  const loadMoreDelivered = async () => {
    const nextPage = deliveredPage + 1;
    setLoadingMoreDelivered(true);
    try {
      const res = await authFetch(
        `http://localhost:5000/api/chats/messages/${message.id}/info?page=${nextPage}&limit=${PAGE_LIMIT}`
      );
      if (res.ok) {
        const result = await res.json();
        setDeliveredTo(prev => [...prev, ...(result.data.deliveredTo || [])]);
        setDeliveredPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more delivery receipts:', err);
    } finally {
      setLoadingMoreDelivered(false);
    }
  };

  const remainingRead = totalRead - readBy.length;
  const remainingDelivered = totalDelivered - deliveredTo.length;

  const msgPreview = message?.text
    ? message.text.length > 80 ? message.text.slice(0, 80) + '…' : message.text
    : message?.type === 'image' ? '🖼️ Image'
    : message?.type === 'file' ? `📄 ${message.attachmentName || 'Document'}`
    : message?.type === 'audio' ? '🎵 Voice Note'
    : '—';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
          />

          {/* Slide-in Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Message Info</h2>
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message preview bubble */}
            <div className="px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/60">
              <div className="inline-block max-w-full px-4 py-2.5 rounded-2xl rounded-tr-xs bg-slate-900 text-white text-xs leading-relaxed break-words shadow-md">
                {msgPreview}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                <span className="text-[10px] text-slate-400 font-semibold">
                  {message?.timestamp
                    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8 no-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs font-semibold">Loading receipts…</span>
                </div>
              ) : (
                <>
                  {/* Read By */}
                  <div>
                    <SectionHeader
                      icon={Eye}
                      label="Read By"
                      count={totalRead}
                      iconBg="bg-emerald-50 text-emerald-600"
                    />
                    {readBy.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-4 text-center">
                        No one has read this message yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {readBy.map((item, i) => (
                          <UserRow
                            key={i}
                            user={item.user}
                            time={item.time}
                            detail={item.user?.email}
                          />
                        ))}
                        {remainingRead > 0 && (
                          <button
                            onClick={loadMoreRead}
                            disabled={loadingMoreRead}
                            className="mt-3 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {loadingMoreRead ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              `${remainingRead} Remaining`
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100" />

                  {/* Delivered To */}
                  <div>
                    <SectionHeader
                      icon={Check}
                      label="Delivered To"
                      count={totalDelivered}
                      iconBg="bg-slate-100 text-slate-500"
                    />
                    {deliveredTo.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-4 text-center">
                        No delivery receipts yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {deliveredTo.map((item, i) => (
                          <UserRow
                            key={i}
                            user={item.user}
                            time={item.time}
                            detail={item.user?.phone || item.user?.email}
                          />
                        ))}
                        {remainingDelivered > 0 && (
                          <button
                            onClick={loadMoreDelivered}
                            disabled={loadingMoreDelivered}
                            className="mt-3 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {loadingMoreDelivered ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              `${remainingDelivered} Remaining`
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MessageInfoPanel;
