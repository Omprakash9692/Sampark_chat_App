import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BrandLogo } from '../../components/ui/BrandLogo';

export const Register = () => {
  const { register: registerUser } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await registerUser(data.email, data.name, data.password, data.phone);
      sessionStorage.setItem('pendingVerificationEmail', data.email);
      showToast("Account Created", "Check your email for the 6-digit verification code!", "success");
      navigate('/email-verification', { state: { justRegistered: true } });
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong");
      showToast("Registration Failed", err.message || "Something went wrong", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efeae2] text-[#111b21] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none my-6 sm:my-0">
      
      {/* WhatsApp Chat UI Wallpaper Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none -z-10" />

      {/* Main Clean Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 border border-[#e9edef] shadow-[0_12px_40px_rgba(11,20,26,0.08)] relative z-10 my-4">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size="lg" showSubtitle={false} className="mb-2" />
          <p className="text-xs text-[#667781] font-medium leading-relaxed">
            Create an account to start secure conversations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-[#f0f2f5] p-1 border border-[#e9edef]">
          <Link
            to="/login"
            className="rounded-xl py-2 text-center text-xs font-bold text-[#667781] hover:text-[#111b21] transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-[#00a884] py-2 text-center text-xs font-black text-white shadow-sm transition-all"
          >
            Register
          </Link>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <p className="font-medium leading-normal">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-left">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#667781] ml-0.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4 w-4 my-auto" />
              <input
                type="text"
                placeholder="John Doe"
                className={`block w-full rounded-2xl bg-[#f0f2f5] border ${errors.name ? 'border-rose-500' : 'border-[#e9edef] focus:bg-white focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]'} text-xs text-[#111b21] py-3 pl-10 pr-4 outline-none transition-all placeholder:text-[#8696a0] font-medium`}
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' }
                })}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] font-bold text-rose-500 pl-1 mt-0.5">{errors.name.message}</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#667781] ml-0.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4 w-4 my-auto" />
              <input
                type="email"
                placeholder="name@example.com"
                className={`block w-full rounded-2xl bg-[#f0f2f5] border ${errors.email ? 'border-rose-500' : 'border-[#e9edef] focus:bg-white focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]'} text-xs text-[#111b21] py-3 pl-10 pr-4 outline-none transition-all placeholder:text-[#8696a0] font-medium`}
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
              <p className="text-[11px] font-bold text-rose-500 pl-1 mt-0.5">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#667781] ml-0.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4 w-4 my-auto" />
              <input
                type="tel"
                placeholder="+1 555-0199 or +91 9876543210"
                className={`block w-full rounded-2xl bg-[#f0f2f5] border ${errors.phone ? 'border-rose-500' : 'border-[#e9edef] focus:bg-white focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]'} text-xs text-[#111b21] py-3 pl-10 pr-4 outline-none transition-all placeholder:text-[#8696a0] font-medium`}
                {...register('phone', {
                  required: 'Phone number is required'
                })}
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] font-bold text-rose-500 pl-1 mt-0.5">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#667781] ml-0.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4 w-4 my-auto" />
              <input
                type="password"
                placeholder="••••••••"
                className={`block w-full rounded-2xl bg-[#f0f2f5] border ${errors.password ? 'border-rose-500' : 'border-[#e9edef] focus:bg-white focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]'} text-xs text-[#111b21] py-3 pl-10 pr-4 outline-none transition-all placeholder:text-[#8696a0] font-medium`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] font-bold text-rose-500 pl-1 mt-0.5">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#667781] ml-0.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#667781] h-4 w-4 my-auto" />
              <input
                type="password"
                placeholder="••••••••"
                className={`block w-full rounded-2xl bg-[#f0f2f5] border ${errors.confirmPassword ? 'border-rose-500' : 'border-[#e9edef] focus:bg-white focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]'} text-xs text-[#111b21] py-3 pl-10 pr-4 outline-none transition-all placeholder:text-[#8696a0] font-medium`}
                {...register('confirmPassword', {
                  required: 'Confirm password is required',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] font-bold text-rose-500 pl-1 mt-0.5">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="acceptTerms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-[#e9edef] bg-[#f0f2f5] text-[#00a884] focus:ring-[#00a884] cursor-pointer"
              {...register('acceptTerms', {
                required: 'You must accept the terms & privacy policies'
              })}
            />
            <label htmlFor="acceptTerms" className="text-[11px] leading-tight text-[#667781] select-none">
              I agree to the <span className="font-bold text-[#111b21]">Terms of Service</span> and <span className="font-bold text-[#111b21]">Privacy Policy</span>.
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-[11px] font-bold text-rose-500 pl-1">{errors.acceptTerms.message}</p>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 mt-2 rounded-2xl bg-[#00a884] hover:bg-[#008069] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-[#00a884]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating Account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Create Account
              </span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 border-t border-[#f0f2f5] pt-4 text-center text-xs text-[#667781] font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#00a884] hover:text-[#008069] transition-colors">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
