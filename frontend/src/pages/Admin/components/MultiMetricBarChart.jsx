import React, { useState } from 'react';
import { BarChart2, Calendar } from 'lucide-react';

export const MultiMetricBarChart = ({ weekData, monthDataMap, availableMonths, yearData }) => {
  const [timeframe, setTimeframe] = useState('week');
  const currentMonthIdx = new Date().getMonth();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIdx);
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [visibleSeries, setVisibleSeries] = useState({ users: true, groups: true, reports: true });

  const activeMonthsList = availableMonths && availableMonths.length > 0 ? availableMonths : [
    { index: 0, name: 'January' }, { index: 1, name: 'February' }, { index: 2, name: 'March' },
    { index: 3, name: 'April' }, { index: 4, name: 'May' }, { index: 5, name: 'June' },
    { index: 6, name: 'July' }, { index: 7, name: 'August' }
  ];

  const rawMonthObj = monthDataMap
    ? (monthDataMap[selectedMonthIndex] || monthDataMap[String(selectedMonthIndex)])
    : null;

  const availableWeekIds = (rawMonthObj && rawMonthObj.weeks && rawMonthObj.weeks.length > 0)
    ? rawMonthObj.weeks.map(w => w.id)
    : ['week1', 'week2', 'week3', 'week4', 'week5'];

  let activeData = [];
  if (timeframe === 'week') {
    activeData = (weekData && weekData.length > 0) ? weekData : [];
  } else if (timeframe === 'month') {
    let monthObj = null;
    if (rawMonthObj && Array.isArray(rawMonthObj)) {
      monthObj = { weeks: rawMonthObj, daysByWeek: {} };
    } else if (rawMonthObj && rawMonthObj.weeks) {
      monthObj = rawMonthObj;
    } else {
      monthObj = { weeks: [], daysByWeek: {} };
    }

    if (selectedWeek === 'all') {
      activeData = monthObj.weeks || [];
    } else {
      activeData = (monthObj.daysByWeek && monthObj.daysByWeek[selectedWeek] && monthObj.daysByWeek[selectedWeek].length > 0)
        ? monthObj.daysByWeek[selectedWeek]
        : [];
    }
  } else if (timeframe === 'year') {
    activeData = (yearData && yearData.length > 0) ? yearData : [];
  }

  const data = activeData;

  const maxVal = Math.max(
    1,
    ...data.flatMap(d => [
      visibleSeries.users ? (d.users || 0) : 0,
      visibleSeries.groups ? (d.groups || 0) : 0,
      visibleSeries.reports ? (d.reports || 0) : 0
    ])
  );

  const getYRatio = (val) => (val / maxVal);
  const chartHeight = 170;

  const toggleSeries = (key) => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedMonthObj = activeMonthsList.find(m => m.index === selectedMonthIndex);
  const latestMonthObj = activeMonthsList[activeMonthsList.length - 1];

  const isTotalZero = data.every(d => (d.users || 0) === 0 && (d.groups || 0) === 0 && (d.reports || 0) === 0);

  return (
    <div className="glass-premium rounded-[24px] sm:rounded-[30px] p-4 sm:p-6 bg-white/85 border border-slate-200/60 text-left shadow-[0_15px_35px_rgba(15,23,42,0.03)] hover-glow-card flex flex-col gap-4 sm:gap-5">
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
                  }}
                  className="bg-transparent text-xs font-black text-indigo-950 outline-none cursor-pointer"
                >
                  {activeMonthsList.map(m => (
                    <option key={m.index} value={m.index}>{m.name} 2026</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                <button
                  onClick={() => setSelectedWeek('all')}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${selectedWeek === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >All Weeks</button>
                {availableWeekIds.map((w, idx) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${selectedWeek === w ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                  >W{idx + 1}</button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            {['week', 'month', 'year'].map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${timeframe === t ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-y border-slate-100 py-2.5 px-1 select-none flex-wrap gap-2 text-xs font-bold">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleSeries('users')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${visibleSeries.users ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}
          >
            <span className="h-3 w-3 rounded-md bg-indigo-600 inline-block" />
            <span>Users Signed Up</span>
          </button>
          <button
            onClick={() => toggleSeries('groups')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${visibleSeries.groups ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}
          >
            <span className="h-3 w-3 rounded-md bg-emerald-500 inline-block" />
            <span>Groups Created</span>
          </button>
          <button
            onClick={() => toggleSeries('reports')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${visibleSeries.reports ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}
          >
            <span className="h-3 w-3 rounded-md bg-rose-500 inline-block" />
            <span>Reports Submitted</span>
          </button>
        </div>
      </div>

      <div className="relative pt-6 pb-2 px-2">
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-[220px] w-full border-b border-slate-200 relative">
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <div
              key={i}
              className="absolute w-full border-b border-slate-100 pointer-events-none"
              style={{ bottom: `${r * 100}%` }}
            />
          ))}

          {data.map((item, idx) => {
            const isHovered = hoverIndex === idx;
            const uHeight = visibleSeries.users ? Math.max(8, getYRatio(item.users || 0) * chartHeight) : 0;
            const gHeight = visibleSeries.groups ? Math.max(8, getYRatio(item.groups || 0) * chartHeight) : 0;
            const rHeight = visibleSeries.reports ? Math.max(8, getYRatio(item.reports || 0) * chartHeight) : 0;

            const isWeekBarInMonth = timeframe === 'month' && selectedWeek === 'all' && item.id;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={() => {
                  if (isWeekBarInMonth) {
                    setSelectedWeek(item.id);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer transition-all duration-200 ${isHovered ? 'bg-slate-50/80 rounded-2xl' : ''}`}
              >
                {isHovered && (
                  <div className="absolute -top-16 z-30 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none flex flex-col items-center animate-fadeIn">
                    <span className="font-extrabold text-slate-200 border-b border-slate-700/80 pb-0.5 mb-1 w-full text-center">{item.name || item.date}</span>
                    <div className="flex items-center gap-3 font-bold text-[10px]">
                      {visibleSeries.users && <span className="text-indigo-300">Users: {item.users || 0}</span>}
                      {visibleSeries.groups && <span className="text-emerald-300">Groups: {item.groups || 0}</span>}
                      {visibleSeries.reports && <span className="text-rose-300">Reports: {item.reports || 0}</span>}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-1.5 sm:gap-2 justify-center w-full px-1">
                  {visibleSeries.users && (
                    <div
                      style={{ height: `${uHeight}px` }}
                      className={`w-3 sm:w-5 md:w-6 rounded-t-xl bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-md transition-all duration-300 ${isHovered ? 'brightness-125 scale-y-105' : 'opacity-90 hover:opacity-100'}`}
                    />
                  )}
                  {visibleSeries.groups && (
                    <div
                      style={{ height: `${gHeight}px` }}
                      className={`w-3 sm:w-5 md:w-6 rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md transition-all duration-300 ${isHovered ? 'brightness-125 scale-y-105' : 'opacity-90 hover:opacity-100'}`}
                    />
                  )}
                  {visibleSeries.reports && (
                    <div
                      style={{ height: `${rHeight}px` }}
                      className={`w-3 sm:w-5 md:w-6 rounded-t-xl bg-gradient-to-t from-rose-600 to-rose-400 shadow-md transition-all duration-300 ${isHovered ? 'brightness-125 scale-y-105' : 'opacity-90 hover:opacity-100'}`}
                    />
                  )}
                </div>

                <span className={`text-[10px] font-black mt-2.5 truncate max-w-full tracking-wider shrink-0 ${isHovered ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {item.name || item.shortName || item.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
