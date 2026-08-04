import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldCheck, MessageSquare, KeyRound } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const ResetPassword = () => {
  const { showToast } = useNotifications();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetPasswordEmail');
    if (!storedEmail) {
      showToast("Session Expired", "Please request a new password reset link", "warning");
      navigate('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
  }, [navigate, showToast]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { code: '', password: '', confirmPassword: '' }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const currentEmail = email || sessionStorage.getItem('resetPasswordEmail');
      if (!currentEmail) {
        showToast("Session Expired", "Please request a new verification code from Forgot Password page", "warning");
        navigate('/forgot-password');
        return;
      }
      await resetPassword(currentEmail.trim(), data.code.trim(), data.password);
      sessionStorage.removeItem('resetPasswordEmail');
      showToast("Password Reset Successfully", "Your password has been updated! You can now log in.", "success");
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      showToast("Reset Failed", err.message || "Could not reset password", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Decorative backdrop blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main card */}
      <div className="w-full max-w-md glass-premium rounded-2xl p-8 border border-slate-200 dark:border-slate-850 shadow-2xl relative bg-white/70 dark:bg-slate-900/70">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 mb-4">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
            Reset Password
          </h2>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Choose a new, secure password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            id="code"
            label="Verification Code"
            placeholder="6-digit code"
            type="text"
            icon={KeyRound}
            error={errors.code}
            {...register('code', {
              required: 'Verification code is required',
              pattern: { value: /^[0-9]{6}$/, message: 'Must be a 6-digit code' }
            })}
          />

          <Input
            id="password"
            label="New Password"
            placeholder="••••••••"
            type="password"
            icon={Lock}
            error={errors.password}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
          />

          <Input
            id="confirmPassword"
            label="Confirm New Password"
            placeholder="••••••••"
            type="password"
            icon={Lock}
            error={errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Confirm password is required',
              validate: value => value === password || 'Passwords do not match'
            })}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={ShieldCheck}
            className="py-3 shadow-md shadow-indigo-600/10"
          >
            Update Password
          </Button>
        </form>

        <div className="mt-8 border-t border-slate-100 dark:border-slate-850 pt-5 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ResetPassword;
