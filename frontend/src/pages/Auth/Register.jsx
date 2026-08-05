import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const Register = () => {
  const { register: registerUser } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.name, data.password);
      // Store email so the verification page can resend code even if context resets
      sessionStorage.setItem('pendingVerificationEmail', data.email);
      showToast("Account Created", "Check your email for the 6-digit verification code!", "success");
      navigate('/email-verification', { state: { justRegistered: true } });
    } catch (err) {
      showToast("Registration Failed", err.message || "Something went wrong", "danger");
    } finally {
      setLoading(false);
    }
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
              <h2 className="text-[2rem] font-extrabold tracking-tight text-slate-800">Create account</h2>
              <p className="mt-2 text-sm text-slate-500">
                Set up your profile to start secure conversations
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1.5">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2.5 text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-800 shadow-sm"
              >
                Register
              </Link>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                id="name"
                label="Full Name"
                placeholder="John Doe"
                type="text"
                icon={User}
                error={errors.name}
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' }
                })}
              />

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
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />

              <Input
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Re-enter your password"
                type="password"
                icon={Lock}
                error={errors.confirmPassword}
                {...register('confirmPassword', {
                  required: 'Confirm password is required',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />

              <div className="flex items-start gap-2.5 text-left">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-300 cursor-pointer"
                  {...register('acceptTerms', {
                    required: 'You must accept the terms & privacy policies'
                  })}
                />
                <label htmlFor="acceptTerms" className="text-xs leading-normal text-slate-500 select-none">
                  I agree to the{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); showToast("Policy View", "Mock Terms display.", "info"); }} className="font-semibold text-slate-700 hover:text-slate-900">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); showToast("Policy View", "Mock Privacy display.", "info"); }} className="font-semibold text-slate-700 hover:text-slate-900">
                    Privacy Policy
                  </a>.
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-left text-xs font-medium text-rose-500">
                  {errors.acceptTerms.message}
                </p>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={UserPlus}
                className="mt-1 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 shadow-none"
              >
                Register
              </Button>
            </form>

          </div>

          <div className="border-t border-slate-200 bg-slate-50/70 px-8 py-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-slate-800 hover:text-slate-600 transition-colors">
              Sign in
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
      </div>
    </div>
  );
};

export default Register;
