import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

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
            Forgot Password
          </h2>
        </div>

        <p className="text-sm text-slate-550 dark:text-slate-400 text-center mb-6 leading-relaxed">
          Enter the email address registered with your account, and we will send a password reset code.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            id="email"
            label="Email Address"
            placeholder="name@company.com"
            type="email"
            icon={Mail}
            error={errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={Send}
            className="py-3"
          >
            Send Reset Code
          </Button>
        </form>

        <div className="mt-8 border-t border-slate-100 dark:border-slate-850 pt-5 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
