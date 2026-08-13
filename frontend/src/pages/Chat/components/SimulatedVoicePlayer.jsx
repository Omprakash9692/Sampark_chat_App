import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export const SimulatedVoicePlayer = ({ duration, url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (url && url !== '#') {
      audioRef.current = new Audio(url);

      const onTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration || 1;
        setProgress((current / total) * 100);
      };

      const onEnded = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audioRef.current.addEventListener("timeupdate", onTimeUpdate);
      audioRef.current.addEventListener("ended", onEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener("timeupdate", onTimeUpdate);
          audioRef.current.removeEventListener("ended", onEnded);
        }
      };
    }
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const waveBars = [15, 24, 18, 30, 42, 20, 12, 28, 35, 22, 10, 18, 25, 32, 40, 26, 12, 18, 30, 38, 22, 14, 26, 32, 18, 10];

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 max-w-[280px]">
      <button
        onClick={togglePlay}
        className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
      >
        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1">
        <div className="flex items-end gap-[2px] h-10 w-full overflow-hidden select-none">
          {waveBars.map((height, idx) => {
            const barProgress = (idx / waveBars.length) * 100;
            const isActive = progress >= barProgress;
            return (
              <div
                key={idx}
                style={{ height: `${height}%` }}
                className={`w-[3px] rounded-full transition-colors duration-150 ${isActive ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-350 dark:bg-slate-700'}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-1 select-none font-semibold">
          <span>{audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'}</span>
          <span>{duration || "0:00"}</span>
        </div>
      </div>
    </div>
  );
};

export const getMsgDateKey = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export const formatDateSeparator = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return "Today";
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  }
};

export const renderTextWithLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className='text-blue-500 underline underline-offset-2 hover:text-blue-600 break-all relative z-10'
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};
