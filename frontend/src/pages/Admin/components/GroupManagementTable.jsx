import React from 'react';
import { Search, Trash2, UserX, UserCheck } from 'lucide-react';
import { Avatar, Badge } from '../../../components/ui/ui';

export const GroupManagementTable = ({
  groupsList,
  groupSearch,
  setGroupSearch,
  groupFilter,
  setGroupFilter,
  handleToggleBlockGroupConfirmed,
  handleDeleteGroupConfirmed
}) => {
  const filteredGroups = (groupsList || []).filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(groupSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (groupFilter === 'active') return !g.isBlocked;
    if (groupFilter === 'blocked') return !!g.isBlocked;
    return true;
  });

  return (
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
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${groupFilter === filter ? 'bg-slate-950 text-white shadow-sm' : 'bg-white text-slate-700 hover:text-black border border-slate-200 hover:bg-slate-50'}`}
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
  );
};
