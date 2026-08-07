import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, KeyRound } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/ui/BrandLogo';

export const ForgotPassword = () => {
  const { showToast } = useNotifications();
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      sessionStorage.setItem('resetPasswordEmail', data.email);
      showToast("Reset Code Sent", `Verification code sent to ${data.email}`, "success");
      navigate('/reset-password');
    } catch (err) {
      showToast("Request Failed", err.message || "Could not send reset code", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efeae2] text-[#111b21] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      
      {/* WhatsApp Chat UI Wallpaper Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none -z-10" />

      {/* Main Clean Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 border border-[#e9edef] shadow-[0_12px_40px_rgba(11,20,26,0.08)] relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-[#00a884] to-[#008069] flex items-center justify-center text-white shadow-lg shadow-[#00a884]/20 mb-4 transition-transform hover:scale-105">
            <KeyRound className="h-6 w-6" />
          </div>

          <BrandLogo size="lg" showSubtitle={false} className="mb-2" />

          <h2 className="text-xl sm:text-2xl font-black text-[#111b21] tracking-tight mt-1">
            Forgot Password
          </h2>
          <p className="text-xs sm:text-sm text-[#667781] font-medium mt-1.5 leading-relaxed max-w-xs">
            Enter the email address registered with your account to receive a 6-digit reset code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#667781] ml-0.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4 w-4 my-auto" />
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className={`block w-full rounded-2xl bg-[#f0f2f5] border ${errors.email ? 'border-rose-500' : 'border-[#e9edef] focus:bg-white focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]'} text-xs text-[#111b21] py-3.5 pl-10 pr-4 outline-none transition-all placeholder:text-[#8696a0] font-medium`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] font-bold text-rose-500 pl-1 mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#00a884] hover:bg-[#008069] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-[#00a884]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Sending Reset Code...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" /> Send Reset Code
              </span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-7 border-t border-[#f0f2f5] pt-5 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#667781] hover:text-[#111b21] transition-colors py-1 px-3 rounded-xl hover:bg-[#f0f2f5]">
            <ArrowLeft className="h-4 w-4 text-[#00a884]" /> Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
