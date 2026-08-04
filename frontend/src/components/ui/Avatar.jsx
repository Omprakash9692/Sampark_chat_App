import React from 'react';

export const Avatar = ({
  src,
  name = '',
  size = 'md',
  status = null, // 'online', 'offline', 'away'
  className = '',
  color = 'from-indigo-500 to-purple-600',
  onClick,
}) => {
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getInitialsColor = (fullName) => {
    if (color && color !== 'from-indigo-500 to-purple-600') return color;
    const colors = [
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-violet-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-amber-500 to-orange-600",
      "from-cyan-500 to-blue-600",
      "from-fuchsia-500 to-pink-600",
      "from-lime-500 to-green-600"
    ];
    if (!fullName) return colors[0];
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-14 w-14 text-lg font-semibold',
    xl: 'h-20 w-20 text-2xl font-bold',
    xxl: 'h-24 w-24 text-3xl font-bold',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5 border-[1px]',
    sm: 'h-2 w-2 border-[1.5px]',
    md: 'h-2.5 w-2.5 border-[2px]',
    lg: 'h-3.5 w-3.5 border-[2px]',
    xl: 'h-4 w-4 border-[2px]',
    xxl: 'h-5 w-5 border-[3px]',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-400 dark:bg-slate-500',
  };

  return (
    <div 
      className={`relative inline-flex flex-shrink-0 select-none ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={`rounded-full object-cover border border-slate-100 dark:border-slate-800/50 ${sizes[size]} ${className}`}
          onError={(e) => {
            // Fallback to initials if image fails
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div
        className={`
          ${sizes[size]} rounded-full flex items-center justify-center text-white font-medium bg-gradient-to-tr ${getInitialsColor(name)}
          ${src ? 'hidden' : 'flex'}
          border border-white/10 ${className}
        `}
      >
        {getInitials(name)}
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full border-white dark:border-slate-950
            ${statusColors[status]}
            ${statusSizes[size]}
          `}
        />
      )}
    </div>
  );
};
export default Avatar;
