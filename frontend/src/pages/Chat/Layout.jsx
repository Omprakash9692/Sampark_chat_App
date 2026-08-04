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

export const Layout = () => {
  const { user, logout } = useAuth();
  const { activeChatId } = useChat();
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

  const toggleRightSidebar = () => {
    setRightSidebarOpen(prev => !prev);
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const isAdminUser = user?.role === 'Admin';

  return (
    <div className="h-screen w-screen flex bg-[linear-gradient(180deg,#fcfcfb_0%,#f5f3ef_100%)] text-slate-800 overflow-hidden font-sans transition-colors duration-300">
      
      {/* 1. Global Navigation Strip (Thin Sidebar) - Desktop */}
      <aside className="hidden sm:flex flex-col items-center justify-between w-18 py-6 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 shadow-[0_10px_40px_rgba(15,23,42,0.04)] flex-shrink-0 z-20">
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
                className={`p-3 rounded-xl cursor-pointer transition-colors ${isChatRoute ? 'bg-slate-900 text-white shadow-[0_8px_24px_rgba(15,23,42,0.16)]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <MessageSquare className="h-5.5 w-5.5" />
              </button>
            )}

            {isAdminUser && (
              <Link to="/admin">
                <button className={`p-3 rounded-xl cursor-pointer transition-colors ${isAdminRoute ? 'bg-slate-900 text-white shadow-[0_8px_24px_rgba(15,23,42,0.16)]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}>
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
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Header bar */}
        <div className="sm:hidden absolute top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200 z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {isChatRoute && (
              <button 
                onClick={() => {
                  setMobileSidebarOpen(prev => !prev);
                  setDesktopSidebarOpen(prev => !prev);
                }}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-lg bg-slate-950 flex items-center justify-center shadow-xs">
                <span className="text-xs font-black bg-gradient-to-tr from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">S</span>
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900">Sampark</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm"
            >
              My Profile
            </Link>
            <Link to="/settings">
              <Avatar src={user?.avatar} name={user?.name} size="xs" color={user?.avatarColor} />
            </Link>
          </div>
        </div>

        {/* Left conversations list sidebar drawer - only show on chat routes */}
        {isChatRoute && (
          <div className={`
            absolute sm:static top-14 bottom-0 left-0 z-20 
            bg-white/92 backdrop-blur-xl
            transition-all duration-300 ease-in-out transform flex flex-col h-[calc(100vh-3.5rem)] sm:h-full flex-shrink-0
            ${desktopSidebarOpen ? 'w-80 border-r border-slate-200/80' : 'w-0 overflow-hidden border-r-0'}
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
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
          flex-grow flex flex-col bg-white/55 relative h-full pt-14 sm:pt-0
          transition-all duration-300
        `}>
          {isChatRoute && (
            activeChatId ? (
              <ChatWindow toggleRightSidebar={toggleRightSidebar} isRightSidebarOpen={rightSidebarOpen} />
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
          <div className="absolute lg:static top-14 bottom-0 right-0 w-80 bg-white/94 backdrop-blur-xl border-l border-slate-200/80 z-20 lg:z-10 flex flex-col h-[calc(100vh-3.5rem)] sm:h-full flex-shrink-0">
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
