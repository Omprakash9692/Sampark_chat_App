import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const EmailVerification = () => {
  const { showToast } = useNotifications();
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); // Initialize to 0, start if just registered
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];
  const timerRef = useRef(null);

  // Focus on first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
    // Only start initial 60s cooldown if they just registered
    if (location.state?.justRegistered) {
      startCountdown();
    }
    return () => clearInterval(timerRef.current);
  }, [location]);

  const startCountdown = () => {
    setCountdown(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Allow numbers only
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value !== '' && index < 5 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move backward on Backspace if empty
    if (e.key === 'Backspace' && code[index] === '' && index > 0 && inputRefs[index - 1].current) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newCode = [...code];
    
    pasteData.forEach((char, idx) => {
      if (idx < 6 && !isNaN(char)) {
        newCode[idx] = char;
      }
    });
    
    setCode(newCode);
    
    // Focus last pasted or last box
    const focusIdx = Math.min(pasteData.length, 5);
    if (inputRefs[focusIdx].current) {
      inputRefs[focusIdx].current.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      showToast("Incomplete Code", "Please enter the full 6-digit verification code.", "warning");
      return;
    }

    setLoading(true);
    try {
      const verifiedUser = await verifyEmail(fullCode);
      showToast("Email Verified", "Your account has been fully validated.", "success");
      navigate(verifiedUser?.role === 'Admin' ? '/admin' : '/chat');
    } catch (err) {
      showToast("Verification Failed", err.message || "Invalid verification code.", "danger");
      // Clear code boxes on failure so user can retype
      setCode(['', '', '', '', '', '']);
      if (inputRefs[0].current) inputRefs[0].current.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      await resendVerification();
      showToast("Code Dispatched", "A new 6-digit code has been sent to your email.", "success");
      setCode(['', '', '', '', '', '']);
      if (inputRefs[0].current) inputRefs[0].current.focus();
      startCountdown(); // Restart 60s cooldown after successful resend
    } catch (err) {
      showToast("Resend Failed", err.message || "Could not resend code. Please try again.", "danger");
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = countdown === 0 && !resendLoading;

  return (
    <div className="min-h-screen bg-[#050811] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      
      {/* Mesh decorative backdrops for premium SaaS feel */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-650/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-650/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-grid-pattern mask-radial-fade pointer-events-none -z-10 opacity-30" />

      {/* Verification Card */}
      <div className="w-full max-w-[420px] bg-white rounded-[28px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 relative">
        
        {/* Top Header Section */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 mb-5">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">
            Verify Your Email
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1.5 leading-normal">
            We sent a verification code to your email.
          </p>
        </div>

        {/* Input & Form Area */}
        <form onSubmit={handleVerify} className="space-y-6 text-center">
          <div>
            <p className="text-[10px] text-slate-500 leading-normal uppercase font-black tracking-wider mb-4">
              Enter 6-digit confirmation code
            </p>

            {/* 6 input boxes */}
            <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
              {code.map((num, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={num}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-2xl border border-transparent bg-slate-950 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-150"
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="h-4.5 w-4.5" />
            )}
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>

          {/* Bottom Footer Actions */}
          <div className="flex items-center justify-between text-xs font-bold pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-slate-450 hover:text-slate-700 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </button>

            {/* Resend button — disabled during cooldown */}
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={`inline-flex items-center gap-1.5 transition-colors ${
                canResend
                  ? 'text-indigo-600 hover:text-indigo-700 cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
              {resendLoading
                ? 'Sending...'
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : 'Resend Code'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EmailVerification;
