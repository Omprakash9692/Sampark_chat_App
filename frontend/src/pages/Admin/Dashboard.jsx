import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertTriangle, ShieldAlert, Search, Phone,
  Trash2, ShieldCheck, RefreshCw, BarChart2, TrendingUp, UserX, UserCheck,
  Activity, Shield, Calendar, Info, MessageSquare, ArrowLeft
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';

// Fallback weeks and daily generator for any selected month index
const getMonthWeeksFallback = (mIndex) => {
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mName = monthNamesShort[mIndex] || "Month";

  const generateDays = (start, end) => {
    const days = [];
    for (let d = start; d <= end; d++) {
      days.push({ name: `${mName} ${d}`, date: `${mName} ${d}, 2026`, users: 0, groups: 0, reports: 0 });
    }
    return days;
  };

  return {
    weeks: [
      { id: "week1", name: "Week 1", date: `${mName} 1 - 7`, users: 0, groups: 0, reports: 0 },
      { id: "week2", name: "Week 2", date: `${mName} 8 - 14`, users: 0, groups: 0, reports: 0 },
      { id: "week3", name: "Week 3", date: `${mName} 15 - 21`, users: 0, groups: 0, reports: 0 },
      { id: "week4", name: "Week 4", date: `${mName} 22 - 28`, users: 0, groups: 0, reports: 0 },
      { id: "week5", name: "Week 5", date: `${mName} 29 - 31`, users: 0, groups: 0, reports: 0 }
    ],
    daysByWeek: {
      week1: generateDays(1, 7),
      week2: generateDays(8, 14),
      week3: generateDays(15, 21),
      week4: generateDays(22, 28),
      week5: generateDays(29, 31)
    }
  };
};

const getJulyRealStats = () => {
  const fallback = getMonthWeeksFallback(6);

  // Week 2 (Jul 8 - 14): Jul 13 (2 Users), Jul 14 (1 User, 1 Group)
  fallback.weeks[1].users = 3;
  fallback.weeks[1].groups = 1;
  const jul13 = fallback.daysByWeek.week2.find(d => d.name === 'Jul 13');
  if (jul13) jul13.users = 2;
  const jul14 = fallback.daysByWeek.week2.find(d => d.name === 'Jul 14');
  if (jul14) { jul14.users = 1; jul14.groups = 1; }

  // Week 3 (Jul 15 - 21): Jul 20 (1 User)
  fallback.weeks[2].users = 1;
  const jul20 = fallback.daysByWeek.week3.find(d => d.name === 'Jul 20');
  if (jul20) jul20.users = 1;

  // Week 4 (Jul 22 - 28): Jul 23 (1 Report), Jul 26 (1 User), Jul 28 (1 Group, 1 Report)
  fallback.weeks[3].users = 1;
  fallback.weeks[3].groups = 1;
  fallback.weeks[3].reports = 2;
  const jul23 = fallback.daysByWeek.week4.find(d => d.name === 'Jul 23');
  if (jul23) jul23.reports = 1;
  const jul26 = fallback.daysByWeek.week4.find(d => d.name === 'Jul 26');
  if (jul26) jul26.users = 1;
  const jul28 = fallback.daysByWeek.week4.find(d => d.name === 'Jul 28');
  if (jul28) { jul28.groups = 1; jul28.reports = 1; }

  // Week 5 (Jul 29 - 31): Jul 31 (1 Group)
  fallback.weeks[4].groups = 1;
  const jul31 = fallback.daysByWeek.week5.find(d => d.name === 'Jul 31');
  if (jul31) jul31.groups = 1;

  return fallback;
};

// ─── Grouped SVG Bar Chart Component ──────────────────────────────────────────
const MultiMetricBarChart = ({ weekData, monthDataMap, availableMonths, yearData }) => {
  const [timeframe, setTimeframe] = useState('week');
  const currentMonthIdx = new Date().getMonth();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIdx);
  const [selectedWeek, setSelectedWeek] = useState('all'); // 'all' | 'week1' | 'week2' | 'week3' | 'week4'
  const [hoverIndex, setHoverIndex] = useState(null);
  const [visibleSeries, setVisibleSeries] = useState({ users: true, groups: true, reports: true });

  const activeMonthsList = availableMonths && availableMonths.length > 0 ? availableMonths : [
    { index: 0, name: 'January' }, { index: 1, name: 'February' }, { index: 2, name: 'March' },
    { index: 3, name: 'April' }, { index: 4, name: 'May' }, { index: 5, name: 'June' },
    { index: 6, name: 'July' }, { index: 7, name: 'August' }
  ];

  let activeData = [];
  if (timeframe === 'week') {
    activeData = (weekData && weekData.length > 0) ? weekData : [];
  } else if (timeframe === 'month') {
    const rawMonthObj = monthDataMap
      ? (monthDataMap[selectedMonthIndex] || monthDataMap[String(selectedMonthIndex)])
      : null;

    let monthObj = null;
    if (rawMonthObj && Array.isArray(rawMonthObj)) {
      monthObj = { weeks: rawMonthObj, daysByWeek: {} };
    } else if (rawMonthObj && rawMonthObj.weeks) {
      monthObj = rawMonthObj;
    } else {
      monthObj = getMonthWeeksFallback(selectedMonthIndex);
    }

    if (selectedWeek === 'all') {
      activeData = monthObj.weeks || [];
    } else {
      activeData = (monthObj.daysByWeek && monthObj.daysByWeek[selectedWeek] && monthObj.daysByWeek[selectedWeek].length > 0)
        ? monthObj.daysByWeek[selectedWeek]
        : getMonthWeeksFallback(selectedMonthIndex).daysByWeek[selectedWeek] || [];
    }
  } else {
    activeData = (yearData && yearData.length > 0) ? yearData : [];
  }

  const data = activeData;

  const maxVal = Math.max(
    5,
    ...data.flatMap(d => [
      visibleSeries.users ? (d.users || 0) : 0,
      visibleSeries.groups ? (d.groups || 0) : 0,
      visibleSeries.reports ? (d.reports || 0) : 0
    ])
  );

  const W = 760, H = 260, padTop = 30, padBottom = 40, padLeft = 35, padRight = 20;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const numSlots = Math.max(1, data.length);
  const slotW = chartW / numSlots;

  const handleMouseMove = (e) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    if (!svgRect.width) return;
    const mouseXInDOM = e.clientX - svgRect.left;
    const svgX = (mouseXInDOM / svgRect.width) * W;
    const idx = Math.floor((svgX - padLeft) / slotW);
    const clampedIdx = Math.max(0, Math.min(numSlots - 1, idx));
    setHoverIndex(clampedIdx);
  };

  const handleBarClick = (index) => {
    if (timeframe === 'month' && selectedWeek === 'all') {
      setSelectedWeek(`week${index + 1}`);
      setHoverIndex(null);
    }
  };

  const defaultIndex = React.useMemo(() => {
    if (!data || data.length === 0) return 0;
    if (timeframe === 'week') {
      const todayDayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, ..., 5 = Sat, 6 = Sun
      return Math.min(todayDayIndex, data.length - 1);
    }
    return data.length - 1;
  }, [data, timeframe]);

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[defaultIndex];

  const selectedMonthObj = activeMonthsList.find(m => m.index === selectedMonthIndex) || activeMonthsList[activeMonthsList.length - 1];
  const latestMonthObj = activeMonthsList[activeMonthsList.length - 1];
  const displayYear = selectedMonthObj?.year || latestMonthObj?.year || new Date().getUTCFullYear();

  const seriesConfig = [
    { key: 'users', label: 'Users', color: '#6366f1', icon: Users },
    { key: 'groups', label: 'Groups', color: '#10b981', icon: Users },
    { key: 'reports', label: 'Report Log', color: '#f43f5e', icon: AlertTriangle }
  ];

  const isTotalZero = data.every(d => (d.users || 0) === 0 && (d.groups || 0) === 0 && (d.reports || 0) === 0);

  return (
    <div className="glass-premium rounded-[24px] sm:rounded-[30px] p-4 sm:p-6 bg-white/85 border border-slate-200/60 text-left shadow-[0_15px_35px_rgba(15,23,42,0.03)] hover-glow-card flex flex-col gap-4 sm:gap-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
        <div>
          <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
            System Metrics Bar Chart
          </h3>
          <p className="text-[11px] text-slate-500 font-bold mt-0.5 flex items-center gap-1.5">
            {timeframe === 'week' && 'Showing Days of the Week (Mon – Sun)'}
            {timeframe === 'month' && selectedWeek === 'all' && `Showing 4 Weeks of ${selectedMonthObj?.name || 'Month'} 2026 (Click any week bar for daily breakdown)`}
            {timeframe === 'month' && selectedWeek !== 'all' && `Showing All Days of ${selectedWeek.toUpperCase()} in ${selectedMonthObj?.name || 'Month'} 2026`}
            {timeframe === 'year' && `Showing Real Database Metrics for 2026 (Jan – ${latestMonthObj?.shortName || 'Aug'})`}
            {isTotalZero && timeframe === 'month' && (
              <span className="text-[10px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                No activity recorded for this period
              </span>
            )}
          </p>
        </div>

        {/* Timeframe Buttons & Month/Week Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap select-none">
          {timeframe === 'month' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-indigo-50/80 px-3 py-1.5 rounded-2xl border border-indigo-200/80 shadow-xs">
                <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                <select
                  value={selectedMonthIndex}
                  onChange={(e) => {
                    setSelectedMonthIndex(Number(e.target.value));
                    setSelectedWeek('all');
                    setHoverIndex(null);
                  }}
                  className="bg-transparent text-xs font-black text-indigo-950 outline-none cursor-pointer pr-1"
                >
                  {activeMonthsList.map(m => (
                    <option key={m.index} value={m.index} className="text-slate-900 font-medium">
                      {m.name} {m.year || displayYear}
                    </option>
                  ))}
                </select>
              </div>

              {/* Week Sub-Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-2xl shadow-xs">
                <select
                  value={selectedWeek}
                  onChange={(e) => {
                    setSelectedWeek(e.target.value);
                    setHoverIndex(null);
                  }}
                  className="bg-transparent text-xs font-black text-white outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="text-slate-900 font-medium">Overview (All Weeks)</option>
                  <option value="week1" className="text-slate-900 font-medium">Week 1 (Days 1–7)</option>
                  <option value="week2" className="text-slate-900 font-medium">Week 2 (Days 8–14)</option>
                  <option value="week3" className="text-slate-900 font-medium">Week 3 (Days 15–21)</option>
                  <option value="week4" className="text-slate-900 font-medium">Week 4 (Days 22–28)</option>
                  <option value="week5" className="text-slate-900 font-medium">Week 5 (Days 29–31/Rest)</option>
                </select>
              </div>

              {selectedWeek !== 'all' && (
                <button
                  onClick={() => setSelectedWeek('all')}
                  className="px-3 py-1.5 rounded-2xl text-xs font-black bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200/80 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview
                </button>
              )}
            </div>
          )}

          {timeframe === 'year' && (
            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-2xl text-xs font-black shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>Year: {displayYear}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60">
            {[
              { id: 'week', label: 'Week (Days)' },
              { id: 'month', label: 'Month (Weeks)' },
              { id: 'year', label: 'Year (Months)' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => { setTimeframe(tf.id); setSelectedWeek('all'); setHoverIndex(null); }}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${timeframe === tf.id
                    ? 'bg-slate-950 text-white shadow-md scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                  }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend Toggles */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-bold select-none border-b border-slate-100 pb-3">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Legend:</span>
        {seriesConfig.map(s => (
          <button
            key={s.key}
            onClick={() => setVisibleSeries(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-pointer ${visibleSeries[s.key]
                ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'
                : 'bg-slate-50/40 border-slate-100 text-slate-400 line-through opacity-60'
              }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Grouped Bar SVG Visualization */}
      <div className="relative w-full overflow-x-auto no-scrollbar" style={{ height: 260 }}>
        <div className="min-w-[600px] sm:min-w-full h-full">
          <svg
            className="w-full h-full cursor-crosshair select-none"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
            const y = padTop + chartH * r;
            const gridVal = Math.round(maxVal * (1 - r));
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={W - padRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fontWeight="700"
                  fill="#94a3b8"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Slots & Bars */}
          {data.map((d, i) => {
            const slotX = padLeft + i * slotW;
            const isHovered = hoverIndex === i;

            const activeSeriesCount = Object.values(visibleSeries).filter(Boolean).length || 1;
            const gap = 3;
            const availableW = Math.min(slotW * 0.75, 45);
            const barW = Math.max(4, (availableW - (activeSeriesCount - 1) * gap) / activeSeriesCount);
            const groupW = activeSeriesCount * barW + (activeSeriesCount - 1) * gap;
            const groupX = slotX + (slotW - groupW) / 2;

            let currentOffset = 0;

            return (
              <g key={i} onClick={() => handleBarClick(i)} className={timeframe === 'month' && selectedWeek === 'all' ? 'cursor-pointer' : ''}>
                {isHovered && (
                  <rect
                    x={slotX + 2}
                    y={padTop - 5}
                    width={slotW - 4}
                    height={chartH + 10}
                    fill="rgba(99, 102, 241, 0.08)"
                    rx="10"
                  />
                )}

                {seriesConfig.map(s => {
                  if (!visibleSeries[s.key]) return null;
                  const val = d[s.key] || 0;
                  const barH = (val / maxVal) * chartH;
                  const barY = padTop + chartH - barH;
                  const barX = groupX + currentOffset;

                  currentOffset += barW + gap;

                  return (
                    <g key={s.key}>
                      <rect
                        x={barX}
                        y={barY}
                        width={barW}
                        height={Math.max(2, barH)}
                        rx={Math.min(4, barW / 2)}
                        fill={s.color}
                        opacity={isHovered ? 1 : 0.85}
                        className="transition-all duration-200"
                        style={{
                          filter: isHovered ? `drop-shadow(0 0 6px ${s.color}80)` : 'none'
                        }}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* X-Axis Labels */}
        <div className="flex justify-between text-[11px] text-slate-500 font-extrabold uppercase tracking-wider px-8 mt-1 select-none">
          {data.map((d, i) => (
            <span
              key={i}
              onClick={() => handleBarClick(i)}
              className={`flex-1 text-center truncate px-0.5 ${hoverIndex === i ? 'text-indigo-600 font-black scale-110' : ''
                } ${timeframe === 'month' && selectedWeek === 'all' ? 'cursor-pointer hover:underline' : ''}`}
            >
              {d.name}
            </span>
          ))}
        </div>
        </div>
      </div>

      {/* Interactive Breakdown Hover Card */}
      {activePoint && (
        <div className="bg-slate-950 text-white rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-black">
                {timeframe === 'week' ? 'Day View' : timeframe === 'month' ? `${selectedMonthObj?.name || 'Month'} (${selectedWeek === 'all' ? 'Overview' : selectedWeek.toUpperCase()})` : `${displayYear} Year View`}
              </span>
              <h4 className="text-sm font-black text-white">
                {activePoint.date && activePoint.date.startsWith(activePoint.name)
                  ? activePoint.date
                  : `${activePoint.name}${activePoint.date ? ` (${activePoint.date})` : ''}`}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap w-full md:w-auto">
            {seriesConfig.map(s => {
              if (!visibleSeries[s.key]) return null;
              const periodVal = activePoint[s.key] || 0;

              return (
                <div key={s.key} className="flex flex-col select-none">
                  <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </div>
                  <div className="text-base font-black text-white pl-4 mt-0.5">
                    {periodVal.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard Component ──────────────────────────────────────────────────
export const Dashboard = () => {
  const { allUsers, fetchDbUsers, authFetch } = useAuth();
  const { reports, updateReportStatus } = useChat();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminStats, setAdminStats] = useState(null);
  const [usersList, setUsersList] = useState(allUsers);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');

  // Manage Groups State
  const [groupsList, setGroupsList] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    onConfirm: null
  });

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const triggerConfirm = (title, message, onConfirm, confirmText = 'Confirm', variant = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      variant,
      onConfirm
    });
  };

  React.useEffect(() => { setUsersList(allUsers); }, [allUsers]);

  // Ref to hold the polling interval so we can clear it from inside fetch functions
  const pollIntervalRef = React.useRef(null);

  const fetchAdminStats = React.useCallback(async () => {
    try {
      const res = await authFetch(`http://localhost:5000/api/auth/admin/stats`, {
        method: 'GET'
      });
      if (res.status === 401) { clearInterval(pollIntervalRef.current); return; }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.stats) setAdminStats(result.data.stats);
      } else {
        const errText = await res.text();
        console.error("fetchAdminStats failed with status:", res.status, errText);
      }
    } catch (err) {
      console.error("fetchAdminStats network error:", err);
    }
  }, [authFetch]);

  const fetchAdminGroups = React.useCallback(async () => {
    try {
      const res = await authFetch(`http://localhost:5000/api/auth/admin/groups`, {
        method: 'GET'
      });
      if (res.status === 401) { clearInterval(pollIntervalRef.current); return; }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.groups) setGroupsList(result.data.groups);
      }
    } catch (err) { /* network error — silently skip */ }
  }, [authFetch]);

  const [adminReports, setAdminReports] = useState([]);

  const fetchAdminReports = React.useCallback(async () => {
    try {
      const res = await authFetch(`http://localhost:5000/api/auth/admin/reports`, {
        method: 'GET'
      });
      if (res.status === 401) { clearInterval(pollIntervalRef.current); return; }
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.reports) setAdminReports(result.data.reports);
      }
    } catch (err) { /* network error — silently skip */ }
  }, [authFetch]);

  // ─── Central refresh: call after any admin action ────────────────────────
  const refreshAll = React.useCallback(() => {
    fetchAdminStats();
    fetchAdminGroups();
    fetchAdminReports();
  }, [fetchAdminStats, fetchAdminGroups, fetchAdminReports]);

  React.useEffect(() => {
    refreshAll();
    // Poll every 3 seconds so new groups/users/reports appear quickly
    pollIntervalRef.current = setInterval(refreshAll, 3000);
    // Also refresh immediately when the user switches back to this browser tab
    const onVisible = () => { if (document.visibilityState === 'visible') refreshAll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(pollIntervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshAll]);

  // Admin tabs with Manage Groups (Blocked Users tab removed)
  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ShieldAlert },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'groups', label: 'Manage Groups', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: AlertTriangle }
  ];

  const handleToggleBlockUser = async (userId, isBlocked) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/auth/admin/users/${userId}/block`, {
        method: 'PUT', credentials: 'include'
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const updatedUser = result.data.user;
          if (typeof fetchDbUsers === 'function') fetchDbUsers();
          refreshAll(); // immediate dashboard refresh
          showToast(
            updatedUser.isBlocked ? 'User Blocked' : 'User Restored',
            'User status updated successfully.',
            updatedUser.isBlocked ? 'warning' : 'success'
          );
        }
      }
    } catch (err) {
      showToast('Error', 'Failed to update user block status.', 'danger');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/auth/admin/users/${userId}`, {
        method: 'DELETE', credentials: 'include'
      });
      if (res.ok) {
        if (typeof fetchDbUsers === 'function') fetchDbUsers();
        refreshAll(); // immediate dashboard refresh
        showToast('User Purged', `Account of ${userName} has been removed from database.`, 'danger');
      }
    } catch (err) {
      showToast('Error', 'Failed to purge user account.', 'danger');
    }
  };

  const handleToggleBlockUserConfirmed = (userId, userName, isBlocked) => {
    triggerConfirm(
      isBlocked ? 'Unblock User' : 'Block User Account',
      `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} "${userName}"? ${isBlocked ? 'The user will regain access to their account.' : 'The user will be immediately suspended and disconnected.'}`,
      () => handleToggleBlockUser(userId, isBlocked),
      isBlocked ? 'Unblock Account' : 'Block Account',
      isBlocked ? 'warning' : 'danger'
    );
  };

  const handleDeleteUserConfirmed = (userId, userName) => {
    triggerConfirm(
      'Purge User Account',
      `Are you sure you want to permanently delete the account of "${userName}"? This action cannot be undone.`,
      () => handleDeleteUser(userId, userName),
      'Purge User',
      'danger'
    );
  };

  const handleToggleBlockGroupConfirmed = (groupId, groupName, isBlocked) => {
    triggerConfirm(
      isBlocked ? 'Unblock Group' : 'Block Group',
      `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} group "${groupName}"? ${isBlocked ? 'Members will be able to send messages again.' : 'Members will NOT be able to send messages in this group.'}`,
      async () => {
        try {
          const res = await authFetch(`http://localhost:5000/api/auth/admin/groups/${groupId}/block`, {
            method: 'PUT', credentials: 'include'
          });
          if (res.ok) {
            refreshAll(); // immediate dashboard refresh
            showToast(
              isBlocked ? 'Group Restored' : 'Group Blocked',
              `Group "${groupName}" status updated.`,
              isBlocked ? 'success' : 'warning'
            );
          }
        } catch (err) {
          showToast('Error', 'Failed to update group block status.', 'danger');
        }
      },
      isBlocked ? 'Unblock' : 'Block Group',
      isBlocked ? 'warning' : 'danger'
    );
  };

  const handleDeleteGroupConfirmed = (groupId, groupName) => {
    triggerConfirm(
      'Delete Group',
      `Are you sure you want to permanently delete group "${groupName}"? All messages in this group will be deleted. This action cannot be undone.`,
      async () => {
        try {
          const res = await authFetch(`http://localhost:5000/api/auth/admin/groups/${groupId}`, {
            method: 'DELETE', credentials: 'include'
          });
          if (res.ok) {
            refreshAll(); // immediate dashboard refresh
            showToast('Group Purged', `Group "${groupName}" deleted from database.`, 'danger');
          }
        } catch (err) {
          showToast('Error', 'Failed to delete group.', 'danger');
        }
      },
      'Delete Group',
      'danger'
    );
  };

  // Filter users: EXCLUDE ADMIN ACCOUNTS & filter by all/active/blocked
  const filteredUsers = usersList.filter(u => {
    if (u.role === 'Admin' || u.role === 'admin') return false; // Exclude admin details

    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.toLowerCase().includes(userSearch.toLowerCase()));
    if (!matchesSearch) return false;

    const isUserBlocked = u.statusText === 'Blocked' || u.isBlocked;
    if (userFilter === 'active') return !isUserBlocked;
    if (userFilter === 'blocked') return isUserBlocked;
    return true;
  });

  // Filter groups: filter by all/active/blocked
  const filteredGroups = groupsList.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(groupSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (groupFilter === 'active') return !g.isBlocked;
    if (groupFilter === 'blocked') return !!g.isBlocked;
    return true;
  });

  const handleResolveReport = async (reportId) => {
    // Optimistically update local adminReports state so UI reflects change immediately
    setAdminReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    await updateReportStatus(reportId, 'resolved');
    fetchAdminReports(); // sync with backend
    showToast('Report Resolved', 'Compliance incident ticket marked as resolved.', 'success');
  };

  const handleDismissReport = async (reportId) => {
    // Optimistically update local adminReports state so UI reflects change immediately
    setAdminReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r));
    await updateReportStatus(reportId, 'dismissed');
    fetchAdminReports(); // sync with backend
    showToast('Report Dismissed', 'Incident ticket dismissed without further actions.', 'info');
  };

  const defaultStats = {
    totalUsers: allUsers.length || 0,
    totalGroups: groupsList.length || 0,
    totalReports: reports.length || 0,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    // Do not show seeded chart values before the live endpoint responds.
    weekData: [],
    availableMonths: [],
    monthDataMap: {},
    yearData: []
  };

  const S = adminStats || defaultStats;

  const cardStats = [
    {
      label: 'Total Users',
      value: S.totalUsers,
      subtext: 'Registered Accounts',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      icon: Users
    },
    {
      label: 'Total Groups',
      value: S.totalGroups || groupsList.length,
      subtext: 'Active Group Spaces',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: MessageSquare
    },
    {
      label: 'Total Report Log',
      value: S.totalReports !== undefined ? S.totalReports : reports.length,
      subtext: `${S.pendingReports || reports.filter(r => r.status === 'pending').length} Pending Action`,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      icon: AlertTriangle
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/60 relative text-left">
      <div className="absolute inset-0 bg-grid-pattern mask-radial-fade pointer-events-none -z-10 opacity-60" />

      {/* Action Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn select-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-left space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${confirmModal.variant === 'danger' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 font-medium">Please confirm this action</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 font-semibold leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (typeof confirmModal.onConfirm === 'function') confirmModal.onConfirm();
                  closeConfirmModal();
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer shadow-sm ${confirmModal.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                  }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0 select-none shadow-[0_2px_20px_rgba(15,23,42,0.02)]">
        <div className="text-left w-full lg:w-auto shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600 shrink-0" />
              Compliance Dashboard
            </h2>
            <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-[0.24em] mt-1">Admin Audit Panel — Realtime System Insights</p>
          </div>
        </div>
        <div className="flex items-center overflow-x-auto no-scrollbar w-full lg:w-auto justify-start lg:justify-center pb-1 lg:pb-0">
          <Tabs tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
        </div>
        <div className="hidden lg:block w-[140px]" />
      </div>

      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 no-scrollbar">

        {/* ═══ TAB: DASHBOARD ═══════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
              {cardStats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, scale: 1.008 }}
                  transition={{ duration: 0.25 }}
                  className="glass-premium rounded-[28px] p-6 border border-slate-200/60 bg-white/80 text-left shadow-[0_15px_30px_rgba(15,23,42,0.03)] hover-glow-card flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">{stat.label}</span>
                    <div className={`h-9 w-9 rounded-xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} shadow-xs`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mt-5">
                    <span className="text-3xl font-black text-slate-950">{stat.value.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">
                      {stat.subtext}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <MultiMetricBarChart
              weekData={S.weekData || defaultStats.weekData}
              monthDataMap={S.monthDataMap || defaultStats.monthDataMap}
              availableMonths={S.availableMonths || defaultStats.availableMonths}
              yearData={S.yearData || defaultStats.yearData}
            />
          </div>
        )}

        {/* ═══ TAB: USER MANAGEMENT (ADMINS EXCLUDED) ═════════════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 shadow-[0_10px_25px_rgba(15,23,42,0.02)]">
              <div className="relative w-full sm:w-80">
                <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
                <input
                  type="text"
                  placeholder="Search user email or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="block w-full rounded-xl bg-slate-50 border-slate-200 focus:border-slate-300 focus:ring-1 focus:ring-slate-300 text-xs py-2.5 pl-11 outline-none text-slate-800 transition-all border font-medium"
                />
              </div>
              <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar select-none">
                {['all', 'active', 'blocked'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setUserFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${userFilter === filter ? 'bg-slate-950 text-white shadow-sm' : 'bg-white text-slate-700 hover:text-black border border-slate-200 hover:bg-slate-50'
                      }`}
                  >{filter}</button>
                ))}
              </div>
            </div>

            <div className="bg-white/80 border border-slate-200/60 rounded-[20px] sm:rounded-[30px] overflow-hidden shadow-[0_15px_45px_rgba(15,23,42,0.03)] backdrop-blur-md">
              <div className="overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-600 bg-slate-50/75 select-none tracking-widest">
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Verification Email</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Account Status</th>
                      <th className="px-6 py-4 text-right">Database Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-extrabold">
                          No users match the search and filter conditions.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isUserBlocked = u.statusText === 'Blocked' || u.isBlocked;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <Avatar src={u.avatar} name={u.name} size="sm" color={u.avatarColor} />
                              <div>
                                <span className="font-black text-slate-900 block text-sm">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 select-all font-mono font-medium text-[11px] text-slate-700">
                              <span className="bg-slate-50 border border-slate-200/50 px-2 py-1 rounded-md">{u.email}</span>
                            </td>
                            <td className="px-6 py-4 select-all font-medium text-xs text-slate-700">
                              {u.phone ? (
                                <span className="inline-flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100 text-indigo-900 px-2.5 py-1 rounded-lg font-bold">
                                  <Phone className="h-3 w-3 text-indigo-600" />
                                  {u.phone}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal italic">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 select-none">
                              <span className={`inline-flex items-center gap-2 text-xs font-extrabold ${isUserBlocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                                <span className={`h-2 w-2 rounded-full ${isUserBlocked ? 'bg-rose-500' : 'bg-emerald-500'} ${!isUserBlocked && 'animate-pulse'}`} />
                                {isUserBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right select-none space-x-2.5">
                              {u.id !== 'user_me' && (
                                <>
                                  <button
                                    onClick={() => handleToggleBlockUserConfirmed(u.id, u.name, isUserBlocked)}
                                    className={`inline-flex p-2 rounded-xl border cursor-pointer hover:scale-105 active:scale-95 transition-all ${isUserBlocked ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                    title={isUserBlocked ? 'Unban Account' : 'Ban Account'}
                                  >
                                    {isUserBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUserConfirmed(u.id, u.name)}
                                    className="inline-flex p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                    title="Purge User Account"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: MANAGE GROUPS ══════════════════════════════════════════════ */}
        {activeTab === 'groups' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 shadow-[0_10px_25px_rgba(15,23,42,0.02)]">
              <div className="relative w-full sm:w-80">
                <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 h-4 w-4 my-auto" />
                <input
                  type="text"
                  placeholder="Search group name or description..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="block w-full rounded-xl bg-slate-50 border-slate-200 focus:border-slate-300 focus:ring-1 focus:ring-slate-300 text-xs py-2.5 pl-11 outline-none text-slate-800 transition-all border font-medium"
                />
              </div>
              <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar select-none items-center">
                {['all', 'active', 'blocked'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setGroupFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${groupFilter === filter ? 'bg-slate-950 text-white shadow-sm' : 'bg-white text-slate-700 hover:text-black border border-slate-200 hover:bg-slate-50'
                      }`}
                  >{filter}</button>
                ))}
              </div>
            </div>

            <div className="bg-white/80 border border-slate-200/60 rounded-[20px] sm:rounded-[30px] overflow-hidden shadow-[0_15px_45px_rgba(15,23,42,0.03)] backdrop-blur-md">
              <div className="overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[650px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-600 bg-slate-50/75 select-none tracking-widest">
                      <th className="px-6 py-4">Group Name & Info</th>
                      <th className="px-6 py-4">Members</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                    {filteredGroups.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-extrabold">
                          No groups found matching the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredGroups.map((g) => {
                        const isGroupBlocked = g.isBlocked;
                        return (
                          <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <Avatar src={g.avatar} name={g.name} size="sm" />
                              <div>
                                <span className="font-black text-slate-900 block text-sm">{g.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold block truncate max-w-xs">{g.description || 'No description'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 select-none">
                              <Badge variant="secondary">{g.membersCount} Members</Badge>
                            </td>
                            <td className="px-6 py-4 select-none">
                              <span className={`inline-flex items-center gap-2 text-xs font-extrabold ${isGroupBlocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                                <span className={`h-2 w-2 rounded-full ${isGroupBlocked ? 'bg-rose-500' : 'bg-emerald-500'} ${!isGroupBlocked && 'animate-pulse'}`} />
                                {isGroupBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right select-none space-x-2.5">
                              <button
                                onClick={() => handleToggleBlockGroupConfirmed(g.id, g.name, isGroupBlocked)}
                                className={`inline-flex p-2 rounded-xl border cursor-pointer hover:scale-105 active:scale-95 transition-all ${isGroupBlocked ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                title={isGroupBlocked ? 'Unblock Group' : 'Block Group'}
                              >
                                {isGroupBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteGroupConfirmed(g.id, g.name)}
                                className="inline-flex p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                title="Delete Group"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: COMPLIANCE REPORTS ════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex gap-2 justify-end mb-2 select-none">
              {['all', 'pending', 'resolved'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setReportFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${reportFilter === filter ? 'bg-slate-950 text-white shadow-sm border border-transparent' : 'bg-white border border-slate-200 text-slate-700 hover:text-black'
                    }`}
                >{filter} reports</button>
              ))}
            </div>

            <div className="space-y-4 text-left">
              {(adminReports.length > 0 ? adminReports : reports)
                .filter(r => {
                  if (reportFilter === 'pending') return r.status === 'pending';
                  if (reportFilter === 'resolved') return r.status === 'resolved';
                  return true;
                })
                .map((rep) => {
                  const reporter = getSenderProfile(rep.reporterId);
                  const reported = getSenderProfile(rep.reportedUserId);
                  const reporterName = rep.reporterName || reporter.name || 'Unknown User';
                  const reportedName = rep.reportedName || reported.name || 'Unknown User';
                  const reporterPhone = rep.reporterPhone || null;
                  const reportedPhone = rep.reportedPhone || null;
                  const date = new Date(rep.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const isResolved = rep.status === 'resolved';

                  return (
                    <div
                      key={rep.id}
                      className={`glass-premium rounded-[32px] p-6 bg-white/80 border hover-glow-card relative shadow-[0_15px_30px_rgba(15,23,42,0.03)] flex flex-col md:flex-row justify-between gap-6 items-start md:items-center border-l-4 ${isResolved ? 'border-l-emerald-500 border-slate-200/80' : 'border-l-amber-500 border-slate-200/80'}`}
                    >
                      <div className="space-y-3.5 max-w-2xl">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${isResolved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {rep.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {date}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-black text-slate-900">{reporterName}</span>{' '}
                            {reporterPhone && (
                              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">({reporterPhone})</span>
                            )}{' '}
                            reported{' '}
                            <span className="font-black text-slate-900">{reportedName}</span>{' '}
                            {reportedPhone && (
                              <span className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-bold">({reportedPhone})</span>
                            )}{' '}
                            for: <span className="font-bold text-rose-500">{rep.reason}</span>
                          </p>
                          <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 border-l-[3px] border-l-rose-400 text-xs italic font-semibold text-slate-800 select-text leading-relaxed">
                            "{rep.messageText}"
                          </div>
                        </div>
                      </div>
                      {!isResolved && (
                        <div className="flex gap-2.5 shrink-0 select-none w-full md:w-auto">
                          <button
                            onClick={() => handleDismissReport(rep.id)}
                            className="flex-1 md:flex-none text-center px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 font-bold rounded-xl text-slate-700 transition-all text-xs cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                          >Dismiss Ticket</button>
                          <button
                            onClick={() => handleResolveReport(rep.id)}
                            className="flex-1 md:flex-none text-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all text-xs cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-emerald-600/10 inline-flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck className="h-4 w-4" /> Resolve Report
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getSenderProfile = (senderId) => ({
  name: senderId === 'user_me' ? 'Alex Rivera' : senderId === 'user_1' ? 'Sarah Chen' :
    senderId === 'user_2' ? 'Marcus Aurelius' : senderId === 'user_4' ? 'James Wilson' : 'Aria Thorne',
  role: 'User'
});

export default Dashboard;
