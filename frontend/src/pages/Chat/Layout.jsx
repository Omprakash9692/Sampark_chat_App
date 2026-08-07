import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare, Settings as SettingsIcon, ShieldCheck, LogOut, Menu, X,
  User, Bell, Search, Info, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';
import { SidebarLeft } from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { ChatWindow } from './ChatWindow';
import { Settings } from '../Profile/Settings';
import { Dashboard } from '../Admin/Dashboard';
import { Avatar } from '../../components/ui/Avatar';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Tooltip } from '../../components/ui/Tooltip';
import { ToastContainer } from '../../components/ui/Toast';
import { BrandLogo } from '../../components/ui/BrandLogo';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { activeChatId, selectChat } = useChat();
  const { showToast, notifications } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Route matches
  const isChatRoute = location.pathname === '/chat';
  const isSettingsRoute = location.pathname === '/settings';
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Responsive and desktop slide sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast("Session Closed", "Logged out successfully.", "info");
    navigate('/login');
  };

  const handleBackToChats = () => {
    selectChat(null);
    setMobileSidebarOpen(true);
    setDesktopSidebarOpen(true);
  };

  const toggleRightSidebar = () => {
    setRightSidebarOpen(prev => !prev);
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const isAdminUser = user?.role === 'Admin';

  return (
    <div className="h-screen w-full max-w-full flex bg-[#f0f2f5] text-slate-800 overflow-x-hidden overflow-y-hidden font-sans transition-colors duration-300">

      {/* 1. Global Navigation Strip (Thin Sidebar) - Desktop */}
      <aside className="hidden sm:flex flex-col items-center justify-between w-18 py-6 bg-[#f0f2f5] border-r border-slate-200/80 flex-shrink-0 z-20">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Navigation Links */}
          <div className="flex flex-col gap-4.5 w-full items-center">
            {!isAdminUser && (
              <button
                onClick={() => {
                  if (isChatRoute) {
                    setDesktopSidebarOpen(prev => !prev);
                    setMobileSidebarOpen(prev => !prev);
                  } else {
                    navigate('/chat');
                    setDesktopSidebarOpen(true);
                    setMobileSidebarOpen(true);
                  }
                }}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${isChatRoute ? 'bg-[#00a884] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'}`}
              >
                <MessageSquare className="h-5.5 w-5.5" />
              </button>
            )}

            {isAdminUser && (
              <Link to="/admin">
                <button className={`p-3 rounded-xl cursor-pointer transition-colors ${isAdminRoute ? 'bg-[#00a884] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'}`}>
                  <ShieldCheck className="h-5.5 w-5.5" />
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 w-full">

          <button
            onClick={handleLogout}
            className="p-3 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="h-5.5 w-5.5" />
          </button>

          {/* User profile button */}
          <Link to="/settings">
            <Avatar
              src={user?.avatar}
              name={user?.name || "Me"}
              size="sm"
              status="online"
              color={user?.avatarColor}
            />
          </Link>
        </div>
      </aside>

      {/* 2. Middle Content Container */}
      <div className="flex-1 flex overflow-hidden relative w-full max-w-full">

        {/* Mobile Header bar - Clean, only Sampark and Profile Avatar icon (only show on chat list / settings) */}
        {!activeChatId && (
          <div className="sm:hidden absolute top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200 z-30 flex items-center justify-between px-4">
            <Link to="/chat" title="Return to main chats" className="cursor-pointer hover:opacity-80 transition-opacity">
              <BrandLogo size="sm" showSubtitle={false} />
            </Link>
            <div className="flex items-center">
              <Link to="/settings" title="Profile">
                <Avatar src={user?.avatar} name={user?.name} size="xs" color={user?.avatarColor} />
              </Link>
            </div>
          </div>
        )}

        {/* Left conversations list sidebar drawer - only show on chat routes */}
        {isChatRoute && (
          <div className={`
            absolute sm:static ${!activeChatId ? 'top-14 h-[calc(100vh-3.5rem)]' : 'top-0 h-full'} bottom-0 left-0 right-0 z-20 
            bg-white/92 backdrop-blur-xl
            transition-all duration-300 ease-in-out transform flex flex-col sm:h-full flex-shrink-0
            w-full sm:w-80
            ${desktopSidebarOpen ? 'sm:w-80 border-r border-slate-200/80' : 'sm:w-0 overflow-hidden border-r-0'}
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none sm:pointer-events-auto'}
            sm:translate-x-0
          `}>
            <SidebarLeft closeMobileSidebar={() => {
              setMobileSidebarOpen(false);
              setDesktopSidebarOpen(false);
            }} />
          </div>
        )}

        {/* Center active chat/settings/admin pane */}
        <main className={`
          flex-grow flex flex-col bg-white/55 relative h-full w-full max-w-full overflow-hidden
          transition-all duration-300
          ${!activeChatId ? 'pt-14 sm:pt-0' : 'pt-0'}
        `}>
          {isChatRoute && (
            activeChatId ? (
              <ChatWindow toggleRightSidebar={toggleRightSidebar} isRightSidebarOpen={rightSidebarOpen} onBack={handleBackToChats} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-4 animate-bounce shadow-[0_16px_35px_rgba(15,23,42,0.16)]">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Start a conversation</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  Select a channel or direct message from the sidebar list to exchange secure files, images, or audio voice reports.
                </p>
              </div>
            )
          )}

          {isSettingsRoute && <Settings />}

          {isAdminRoute && <Dashboard />}
        </main>

        {/* Right context info panel - only show on chat routes */}
        {isChatRoute && activeChatId && rightSidebarOpen && (
          <div className="absolute lg:static top-0 bottom-0 right-0 w-full sm:w-80 bg-white/94 backdrop-blur-xl border-l border-slate-200/80 z-30 lg:z-10 flex flex-col h-full flex-shrink-0">
            <SidebarRight onClose={toggleRightSidebar} />
          </div>
        )}
      </div>

      {/* Floating toast alerts */}
      <ToastContainer />
    </div>
  );
};
export default Layout;
