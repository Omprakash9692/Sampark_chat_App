import React from 'react';
import { Calendar, ShieldCheck } from 'lucide-react';

const getSenderProfile = (senderId) => ({
  name: senderId === 'user_me' ? 'Alex Rivera' : senderId === 'user_1' ? 'Sarah Chen' :
    senderId === 'user_2' ? 'Marcus Aurelius' : senderId === 'user_4' ? 'James Wilson' : 'Aria Thorne',
  role: 'User'
});

export const AdminReportsList = ({
  adminReports,
  reports,
  reportFilter,
  setReportFilter,
  handleDismissReport,
  handleResolveReport
}) => {
  const reportsData = ((adminReports && adminReports.length > 0 ? adminReports : (reports || [])) || []).filter(r => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'resolved') return r.status === 'resolved';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end mb-2 select-none">
        {['all', 'pending', 'resolved'].map(filter => (
          <button
            key={filter}
            onClick={() => setReportFilter(filter)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${reportFilter === filter ? 'bg-slate-950 text-white shadow-sm border border-transparent' : 'bg-white border border-slate-200 text-slate-700 hover:text-black'}`}
          >{filter} reports</button>
        ))}
      </div>

      <div className="space-y-4 text-left">
        {reportsData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-extrabold bg-white/80 border border-slate-200/60 rounded-3xl">
            No compliance reports found for the selected filter.
          </div>
        ) : (
          reportsData.map((rep) => {
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
          }))}
      </div>
    </div>
  );
};
