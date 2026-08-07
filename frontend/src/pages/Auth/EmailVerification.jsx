import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/ui/BrandLogo';

export const EmailVerification = () => {
  const { showToast } = useNotifications();
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
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

  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
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
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value !== '' && index < 5 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
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
      startCountdown();
    } catch (err) {
      showToast("Resend Failed", err.message || "Could not resend code. Please try again.", "danger");
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = countdown === 0 && !resendLoading;

  return (
    <div className="min-h-screen bg-[#efeae2] text-[#111b21] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      
      {/* WhatsApp Chat UI Wallpaper Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none -z-10" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 border border-[#e9edef] shadow-[0_12px_40px_rgba(11,20,26,0.08)] relative z-10">
        
        {/* Top Header Section */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-[#00a884] to-[#008069] flex items-center justify-center text-white shadow-lg shadow-[#00a884]/20 mb-4 transition-transform hover:scale-105">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <BrandLogo size="lg" showSubtitle={false} className="mb-2" />

          <h2 className="text-xl sm:text-2xl font-black text-[#111b21] tracking-tight mt-1">
            Verify Your Email
          </h2>
          <p className="text-xs sm:text-sm text-[#667781] font-medium mt-1.5 leading-relaxed max-w-xs">
            Enter the 6-digit confirmation code sent to your registered email address.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6 text-center">
          <div>
            <p className="text-[10px] text-[#667781] uppercase font-black tracking-wider mb-4">
              6-digit Confirmation Code
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
                  className="w-11 sm:w-12 h-13 text-center text-xl font-black rounded-2xl border border-[#e9edef] bg-[#f0f2f5] text-[#111b21] focus:bg-white focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all duration-150"
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#00a884] hover:bg-[#008069] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-[#00a884]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verifying Account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Verify Account
              </span>
            )}
          </button>

          {/* Bottom Footer Actions */}
          <div className="flex items-center justify-between text-xs font-bold pt-4 border-t border-[#f0f2f5]">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-[#667781] hover:text-[#111b21] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[#00a884]" /> Back to Login
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={`inline-flex items-center gap-1.5 transition-colors ${
                canResend
                  ? 'text-[#00a884] hover:text-[#008069] cursor-pointer'
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
