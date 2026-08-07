import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const Login = () => {
  const { login, allUsers } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const loggedInUser = await login(data.email, data.password);
      if (!loggedInUser.isVerified) {
        sessionStorage.setItem('pendingVerificationEmail', loggedInUser.email);
        showToast("Email Verification Required", "Please verify your email address to complete login.", "warning");
        navigate('/email-verification');
        return;
      }
      showToast("Access Granted", "Logged in successfully!", "success");
      navigate(loggedInUser.role === 'Admin' ? '/admin' : '/chat');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
      showToast("Access Denied", err.message || 'Login failed', "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (email) => {
    setValue('email', email);
    setValue('password', 'password123');
    showToast("Autofill Applied", `Selected account: ${email}`, "info");
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.08),transparent_34%),linear-gradient(180deg,#fcfcfb_0%,#f6f5f2_100%)] -z-10" />

      <div className="w-full max-w-[460px]">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[2rem] font-extrabold leading-none tracking-tight text-slate-500">SAMPARK</div>
              <p className="mt-1 text-xs font-medium tracking-[0.08em] text-slate-500">
                Secure Premium Messaging
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="px-8 pt-8 pb-7">
            <div className="mb-7 text-center">
              <h2 className="text-[2rem] font-extrabold tracking-tight text-slate-800">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter your credentials to access your account
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1.5">
              <Link
                to="/login"
                className="rounded-lg bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 shadow-sm"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg px-4 py-2.5 text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
              >
                Register
              </Link>
            </div>

            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600">
                <AlertCircle className="mt-0.5 h-4.5 w-4.5 flex-shrink-0" />
                <p className="font-medium leading-normal">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                id="email"
                label="Email Address"
                placeholder="name@example.com"
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

              <Input
                id="password"
                label="Password"
                placeholder="Enter your password"
                type="password"
                icon={Lock}
                error={errors.password}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />

              <div className="flex items-center justify-end pt-1">
                <Link to="/forgot-password" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={LogIn}
                className="mt-1 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 shadow-none"
              >
                Sign In
              </Button>
            </form>

          </div>

          <div className="border-t border-slate-200 bg-slate-50/70 px-8 py-5 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-slate-800 hover:text-slate-600 transition-colors">
              Sign up
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            End-to-End Encrypted
          </span>
          <span className="hidden sm:inline">•</span>
          <span>GDPR Compliant</span>
          <span className="hidden sm:inline">•</span>
          <span>ISO 27001 Certified</span>
        </div>

        <div className="mt-6 border-t border-slate-200/70 pt-5 text-left">
          <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            Quick Reviewer Profiles
          </h4>
          <div className="flex flex-wrap gap-2">
            {allUsers.slice(0, 3).map((u) => (
              <button
                key={u.id}
                onClick={() => handleQuickFill(u.email)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-all duration-150"
              >
                {u.name.split(' ')[0]} ({u.role})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
