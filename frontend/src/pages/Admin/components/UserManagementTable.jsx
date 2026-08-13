import React from 'react';
import { Search, Phone, Trash2, UserX, UserCheck } from 'lucide-react';
import { Avatar } from '../../../components/ui/ui';

export const UserManagementTable = ({
  usersList,
  userSearch,
  setUserSearch,
  userFilter,
  setUserFilter,
  handleToggleBlockUserConfirmed,
  handleDeleteUserConfirmed
}) => {
  // Filter users: EXCLUDE ADMIN ACCOUNTS & filter by search / active / blocked
  const filteredUsers = (usersList || []).filter(u => {
    if (u.role === 'Admin' || u.role === 'admin') return false;

    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.toLowerCase().includes(userSearch.toLowerCase()));
    if (!matchesSearch) return false;

    const isUserBlocked = u.statusText === 'Blocked' || u.isBlocked;
    if (userFilter === 'active') return !isUserBlocked;
    if (userFilter === 'blocked') return isUserBlocked;
    return true;
  });

  return (
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
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${userFilter === filter ? 'bg-slate-950 text-white shadow-sm' : 'bg-white text-slate-700 hover:text-black border border-slate-200 hover:bg-slate-50'}`}
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
                              title="Delete User Account"
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
  );
};
