import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Shield, Zap, Check, ArrowRight,
  ShieldCheck, Sparkles, Star, Users, Lock, ChevronRight,
  Activity, Terminal, Globe, LockKeyhole, Cpu, RefreshCw
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Accordion } from '../components/ui/Accordion';
import { Tabs } from '../components/ui/Tabs';

export const Landing = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const [activeFeatureTab, setActiveFeatureTab] = useState('enc');

  const featureTabs = [
    { id: 'enc', label: 'E2E Encryption', icon: LockKeyhole },
    { id: 'speed', label: 'Instant Sync', icon: Zap },
    { id: 'admin', label: 'Admin Audit', icon: ShieldCheck },
    { id: 'collab', label: 'Rich Group Spaces', icon: Users },
  ];

  const renderFeatureDetails = () => {
    switch (activeFeatureTab) {
      case 'enc':
        return (
          <motion.div
            key="enc"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left"
          >
            <div>
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650 mb-6">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                Zero-Trust Encryption Architecture
              </h3>
              <p className="text-slate-550 leading-relaxed mb-6 text-sm">
                Your private messages, voice notes, and file exchanges are wrapped in multiple layers of cryptographic security before they leave your device.
              </p>
              <ul className="space-y-3.5">
                {['Decentralized local keys generation', 'Perfect forward secrecy enabled', 'Cryptographic verification fingerprints'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-650">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-[0_20px_50px_rgba(15,23,42,0.06)] relative overflow-hidden font-mono text-left">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-4 select-none">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="text-[10px] text-slate-500 font-semibold ml-2">fingerprint-verifier.js</span>
              </div>
              
              {/* Code */}
              <pre className="text-xs leading-relaxed text-indigo-400 overflow-x-auto select-none no-scrollbar">
                <code className="text-slate-400">
                  <span className="text-violet-400">const</span> <span className="text-indigo-300">verifyKeys</span> = (aliceKey, bobKey) =&gt; &#123;<br />
                  &nbsp;&nbsp;<span className="text-violet-400">const</span> sharedSecret = <span className="text-cyan-400">computeDH</span>(aliceKey, bobKey);<br />
                  &nbsp;&nbsp;<span className="text-violet-400">const</span> hash = <span className="text-cyan-400">sha256</span>(sharedSecret);<br />
                  &nbsp;&nbsp;console.<span className="text-cyan-400">log</span>(<span className="text-emerald-300">"Fingerprint: "</span> + hash.<span className="text-cyan-400">substring</span>(<span className="text-amber-300">0</span>, <span className="text-amber-300">16</span>));<br />
                  &nbsp;&nbsp;<span className="text-violet-400">return</span> hash;<br />
                  &#125;;<br />
                  <br />
                  <span className="text-slate-500">// Cryptographic hash verified.</span><br />
                  <span className="text-emerald-400">// Connection: 100% Encrypted</span>
                </code>
              </pre>
            </div>
          </motion.div>
        );
      case 'speed':
        return (
          <motion.div
            key="speed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left"
          >
            <div>
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650 mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                Sub-Millisecond Real-Time Synchronization
              </h3>
              <p className="text-slate-550 leading-relaxed mb-6 text-sm">
                Powered by optimized persistent sockets, messages and status updates propagate across all user sessions instantly without lag or dropped payloads.
              </p>
              <ul className="space-y-3.5">
                {['Automatic disconnect recovery with state queue', 'Under 30ms latency overhead globally', 'Smart local caching for offline editing'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-650">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-premium rounded-2xl p-6 border border-slate-200/80 flex flex-col gap-4 text-left shadow-[0_25px_60px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">WebSocket Latency</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-extrabold">12ms (Optimal)</span>
              </div>
              <div className="w-full bg-slate-100/80 rounded-full h-2.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "94%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-650 h-full rounded-full" 
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-1">
                {[{ l: 'Payload Size', v: '0.2 KB' }, { l: 'Socket Retries', v: '0' }, { l: 'Loss Rate', v: '0.00%' }].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.l}</div>
                    <div className="text-sm font-extrabold text-slate-850 mt-1">{item.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 'admin':
        return (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left"
          >
            <div>
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650 mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                Enterprise-Grade Auditing & Compliance
              </h3>
              <p className="text-slate-550 leading-relaxed mb-6 text-sm">
                Securely manage organization members, review audit trails, flag sensitive media uploads, and compile statistics on system activity.
              </p>
              <ul className="space-y-3.5">
                {['Detailed admin analytics dashboard', 'Flexible reports and message auditing tools', 'Banning, warnings, and permissions controls'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-650">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-premium rounded-2xl p-6 border border-slate-200/80 text-left shadow-[0_25px_60px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Incident Compliance Audit Log</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-extrabold uppercase tracking-wider">Pending Review</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-extrabold text-xs text-slate-750">Target Session ID: user_marcus_dev</div>
                  <div className="text-[11px] text-slate-400 mt-1">Reason: Sensitive server credentials shared.</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-extrabold text-xs text-slate-750">Action Block: regex_detector_v2</div>
                  <div className="text-[11px] text-slate-400 mt-1">Status: Blocked client transmission. Uptime secure.</div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'collab':
        return (
          <motion.div
            key="collab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left"
          >
            <div>
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650 mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                Rich Group Spaces and Threads
              </h3>
              <p className="text-slate-550 leading-relaxed mb-6 text-sm">
                Organize projects, design syncs, and team standups with nested spaces. Maintain conversational focus with visual message replies, document storage, and reaction lists.
              </p>
              <ul className="space-y-3.5">
                {['Unlimited core groups and permissions tiers', 'PDF preview lists and gallery lightboxes', 'Voice messages and simulated wave play'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-650">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-premium rounded-2xl p-5 border border-slate-200/80 text-left shadow-[0_25px_60px_rgba(15,23,42,0.04)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">DT</div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Dev Team Core</h4>
                  <p className="text-[10px] text-slate-400">Sarah, James, Marcus, You</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3.5 space-y-3">
                <div className="p-3 rounded-2xl bg-slate-50 text-[11px] self-start max-w-[85%] border border-slate-100">
                  <div className="font-extrabold text-indigo-650 text-[10px] mb-0.5">Sarah Chen</div>
                  Here is the layout config that Sarah drafted.
                </div>
                <div className="p-3 rounded-2xl bg-indigo-600 text-white text-[11px] self-end max-w-[85%] ml-auto shadow-sm shadow-indigo-600/10">
                  Looks like the build is fully active in dev.
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const faqItems = [
    {
      title: "Is this application frontend fully responsive?",
      content: "Yes, the interface transitions seamlessly from massive high-resolution desktop environments with a 3-column layout down to touch-friendly mobile views, which incorporate drawers, slide-out details panels, and a sleek bottom tab layout."
    },
    {
      title: "Does it support simulated audio files and image viewer popups?",
      content: "Absolutely. The chat logs support image lightboxes, interactive mock waveforms representing simulated audio messages, and inline PDF cards. Clicking them triggers appropriate UI overlays and simulated plays."
    },
    {
      title: "Are Dark Mode and Light Mode settings persistent?",
      content: "Yes, the ThemeContext reads local preferences on initial load and updates localStorage whenever a preference is switched, applying changes instantly across all layout elements."
    },
    {
      title: "How do the administrator analytics operate?",
      content: "The dashboard is seeded with highly detailed mock statistics including user growths, device distribution counts, and message volumes. These are plotted via custom, high-fidelity responsive SVG graphs designed directly with CSS variables and Framer Motion."
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-800 transition-colors duration-300 relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 inset-x-0 h-[1000px] bg-grid-pattern mask-radial-fade -z-10" />
      
      {/* Blurred Floating Blobs */}
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-400/12 blur-[100px] pointer-events-none -z-10 animate-blob-slow" />
      <div className="absolute top-[35%] right-[10%] w-[350px] h-[350px] rounded-full bg-violet-400/12 blur-[100px] pointer-events-none -z-10 animate-blob-slower" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_2px_20px_rgba(15,23,42,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <MessageSquare className="h-5.5 w-5.5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-950 to-indigo-700 bg-clip-text text-transparent font-sans">
              WeChat
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
            <Link to="/admin" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Admin Panel
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="px-6 py-2.5 text-sm font-extrabold rounded-xl bg-slate-950 hover:bg-indigo-600 hover:scale-[1.03] active:scale-[0.97] text-white cursor-pointer transition-all duration-300 shadow-[0_10px_25px_rgba(15,23,42,0.12)] hover:shadow-[0_10px_25px_rgba(99,102,241,0.2)] border border-slate-900/10">
                Login
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          {/* Version badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4.5 py-1.5 rounded-full border border-indigo-100 bg-indigo-50/65 text-indigo-700 text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_8px_24px_rgba(99,102,241,0.06)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-650 animate-pulse" />
            <span>Secure Enterprise Messaging Client</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 leading-[1.12] tracking-tight"
          >
            Real-time chat client built for <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-650 bg-clip-text text-transparent">high-performance</span> teams.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto text-base sm:text-lg text-slate-500/90 leading-relaxed font-medium"
          >
            Experience a gorgeous, state-of-the-art workspace that consolidates messaging, audio playback files, and interactive administrative statistics under a unified SaaS interface.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/chat" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_20px_40px_rgba(99,102,241,0.22)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.38)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 btn-shiny">
                Launch Web App <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold border border-slate-200/80 text-slate-700 bg-white/60 backdrop-blur-md hover:bg-white hover:border-slate-350 cursor-pointer transition-all duration-300 shadow-[0_8px_30px_rgba(15,23,42,0.03)] hover:scale-[1.02] active:scale-[0.98]">
                Explore Features
              </button>
            </a>
          </motion.div>

          {/* Stats Ticker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-100 mt-16"
          >
            {[
              { label: "Active Members", value: "5,000+", desc: "Syncing daily" },
              { label: "Security Encryption", value: "AES-256", desc: "End-to-end secured" },
              { label: "WebSocket Sync", value: "< 12ms", desc: "Ultra-low latency" },
              { label: "Uptime SLA", value: "99.99%", desc: "Highly available" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-br from-slate-900 to-indigo-950 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-[10px] font-bold text-indigo-650 uppercase tracking-wider mt-1.5">{stat.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{stat.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Mock Preview with floating badges */}
        <div className="max-w-6xl mx-auto px-6 mt-20 relative">
          
          {/* Floating Widget Left */}
          <div className="absolute -left-8 top-1/4 z-20 hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-[0_20px_50px_rgba(15,23,42,0.06)] animate-float select-none pointer-events-none w-52">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h5 className="text-[11px] font-black text-slate-950">E2E Secure Channel</h5>
              <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active SSL Tunnel
              </p>
            </div>
          </div>

          {/* Floating Widget Right */}
          <div className="absolute -right-8 bottom-1/4 z-20 hidden lg:flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-[0_20px_50px_rgba(15,23,42,0.06)] animate-float-slow select-none pointer-events-none w-[220px]">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex justify-between items-center">
                <h5 className="text-[11px] font-black text-slate-950">Live Analytics</h5>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-150 text-indigo-750 font-extrabold">12ms</span>
              </div>
              {/* Fake Bar Graph */}
              <div className="flex gap-0.5 items-end h-4 mt-2.5">
                {[30, 45, 25, 40, 60, 50, 35, 20, 30, 45, 55, 30, 40, 20].map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-500/20 rounded-xs" style={{ height: `${h}%` }}>
                    {i === 10 && <div className="w-full h-full bg-indigo-600 rounded-xs animate-pulse" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Device Mockup wrapper with subtle 3D hover */}
          <motion.div
            whileHover={{ y: -6, rotateX: 1.5, rotateY: -1, scale: 1.004 }}
            transition={{ duration: 0.4 }}
            className="glass-premium rounded-[32px] p-4.5 border border-slate-200/80 shadow-[0_30px_90px_rgba(15,23,42,0.12)] relative"
          >
            {/* Window bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-rose-500/80" />
                <span className="h-3.5 w-3.5 rounded-full bg-amber-500/80" />
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-mono text-[10px] bg-slate-100/90 text-slate-500 px-4 py-1 rounded-full border border-slate-200/40">app.wechat.io/chat</span>
              <div className="w-12" />
            </div>

            {/* Simulated Chat Interface Grid */}
            <div className="grid grid-cols-4 gap-4 h-[380px] overflow-hidden opacity-95 select-none text-left">
              {/* Sidebar col */}
              <div className="col-span-1 border-r border-slate-150 pr-4 space-y-4 hidden md:block">
                <div className="h-9 bg-slate-100 rounded-xl w-full flex items-center px-3 gap-2">
                  <div className="h-3 w-3 bg-slate-350 rounded-full" />
                  <div className="h-2.5 bg-slate-250 rounded-md w-1/2" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`p-2.5 rounded-xl flex items-center gap-2.5 border border-transparent ${i === 1 ? 'bg-indigo-50/50 border-indigo-100/40' : ''}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white bg-gradient-to-tr ${i === 1 ? 'from-pink-500 to-rose-500' : i === 2 ? 'from-indigo-500 to-cyan-500' : 'from-amber-500 to-orange-500'}`}>
                        {i === 1 ? 'SC' : i === 2 ? 'DT' : 'MA'}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="h-3 bg-slate-300 rounded-md w-1/2" />
                          <div className="h-2 bg-slate-200 rounded-md w-6" />
                        </div>
                        <div className="h-2.5 bg-slate-200 rounded-md w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Chat window col */}
              <div className="col-span-4 md:col-span-3 flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-150">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">SC</div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Sarah Chen</h4>
                      <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        active now
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center" />
                    <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center" />
                  </div>
                </div>
                
                {/* Simulated message bubbles */}
                <div className="flex-1 py-5 space-y-4 overflow-y-auto no-scrollbar">
                  <div className="p-3.5 bg-slate-50 rounded-2xl rounded-tl-xs max-w-md text-xs border border-slate-150 leading-relaxed text-slate-700">
                    Did you get to check the dashboard analytics statistics? We need to verify if the weekly growth charts match our database telemetry.
                  </div>
                  <div className="p-3.5 bg-indigo-600 text-white rounded-2xl rounded-tr-xs max-w-md ml-auto text-xs leading-relaxed shadow-md shadow-indigo-600/10">
                    Yes, I reviewed them. The custom SVG charts look pixel perfect. Bypassed complex dependency issues and improved rendering speed!
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl rounded-tl-xs max-w-md text-xs border border-slate-150 leading-relaxed text-slate-700">
                    Excellent, that makes the UI ready for presentation. 🚀
                  </div>
                </div>
                
                {/* Input bar */}
                <div className="pt-2">
                  <div className="h-11 bg-slate-50 rounded-2xl w-full flex items-center px-4 justify-between border border-slate-200">
                    <span className="text-xs text-slate-400 font-medium">Write a secure, encrypted message...</span>
                    <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Features Area */}
      <section id="features" className="py-24 border-t border-slate-150 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              SaaS components packed with visual elegance
            </h2>
            <p className="text-slate-500 font-medium">
              No compromises on interface details. Every corner is rounded, every layout animated, and every action state verified.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex justify-center mb-10">
            <Tabs 
              tabs={featureTabs}
              activeTab={activeFeatureTab}
              onChange={setActiveFeatureTab}
              variant="pill"
            />
          </div>

          {/* Tab contents */}
          <div className="p-8 md:p-12 rounded-[32px] bg-white/70 border border-slate-200/80 min-h-[300px] flex items-center justify-center shadow-[0_20px_50px_rgba(15,23,42,0.04)] backdrop-blur-md">
            {renderFeatureDetails()}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-slate-150 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Flexible mock plans for any team
            </h2>
            <p className="text-slate-500 font-medium">
              Pick the mock layout tier that works best. Toggling changes simulated costs instantly.
            </p>

            {/* Toggle Monthly/Yearly */}
            <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl mt-4 border border-slate-200/50">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${billingPeriod === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${billingPeriod === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Yearly Billing (-20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6">
            {/* Free plan */}
            <div className="glass-premium rounded-3xl p-8 border border-slate-200/80 flex flex-col justify-between relative hover-glow-card">
              <div>
                <h3 className="text-lg font-black text-slate-900">Free Sandbox</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Perfect for evaluating layout elements.</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-slate-950">$0</span>
                  <span className="text-xs text-slate-400 font-bold ml-1">/ forever</span>
                </div>
                <div className="border-t border-slate-100 pb-6" />
                <ul className="space-y-4 text-left text-sm text-slate-650">
                  {['Up to 5 mock users', '3 core group layouts', 'Basic theme preference persistence', 'SVG charts analytics sandbox'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-slate-600">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/chat" className="mt-8 block">
                <button className="w-full py-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-850 transition-colors cursor-pointer text-xs">
                  Get Started Free
                </button>
              </Link>
            </div>

            {/* Pro plan (Recommended) */}
            <div className="rounded-3xl p-8 border-2 border-indigo-600 flex flex-col justify-between relative bg-white shadow-[0_24px_50px_rgba(99,102,241,0.12)] hover-glow-card">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest shadow-md shadow-indigo-600/10">
                Recommended
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">Pro Workspace</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Our most premium component library package.</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-slate-950">
                    {billingPeriod === 'monthly' ? '$15' : '$12'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold ml-1">/ seat / month</span>
                </div>
                <div className="border-t border-slate-100 pb-6" />
                <ul className="space-y-4 text-left text-sm text-slate-650">
                  {[
                    'Unlimited chat windows', 
                    'E2E encryption mock templates', 
                    'Custom theme variables config', 
                    'Admin table auditing dashboard', 
                    'Simulated voice wave playbacks', 
                    'Dedicated help & support panel'
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-slate-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/chat" className="mt-8 block">
                <button className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition-colors cursor-pointer text-xs shadow-md shadow-indigo-600/10 btn-shiny">
                  Go Pro Now
                </button>
              </Link>
            </div>

            {/* Enterprise plan */}
            <div className="glass-premium rounded-3xl p-8 border border-slate-200/80 flex flex-col justify-between relative hover-glow-card">
              <div>
                <h3 className="text-lg font-black text-slate-900">Enterprise Space</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Advanced reporting features for massive scaling.</p>
                <div className="my-6">
                  <span className="text-4xl font-black text-slate-950">Custom</span>
                  <span className="text-xs text-slate-400 font-bold ml-1">/ volume pricing</span>
                </div>
                <div className="border-t border-slate-100 pb-6" />
                <ul className="space-y-4 text-left text-sm text-slate-650">
                  {[
                    'Everything in Pro plan', 
                    'Pre-configured compliance reports', 
                    'Custom security sessions details', 
                    'JWT token storage setups mock', 
                    'Multi-tenant admin controls UI', 
                    'Tailwind configurations spec'
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-slate-600">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/chat" className="mt-8 block">
                <button className="w-full py-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-850 transition-colors cursor-pointer text-xs">
                  Contact Sales
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-slate-150 bg-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Endorsed by leading UX teams
            </h2>
            <p className="text-slate-500 font-medium">
              Read how visual engineers and developers leverage our layouts to bootstrap their dashboard integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: "The responsiveness on the 3-column chat window is incredible. It functions cleanly under heavy layouts and custom widgets. Highly recommended.",
                user: "Sarah Chen", role: "Principal UI Engineer", initial: "SC", color: "from-pink-500 to-rose-500"
              },
              {
                text: "Implementing charts without bloated external libraries was a lifesaver. The custom SVG layout handles scaling perfectly with pure CSS variables.",
                user: "Marcus Aurelius", role: "Staff DevOps Architect", initial: "MA", color: "from-amber-500 to-orange-500"
              },
              {
                text: "Our product teams approved this layout blueprint immediately. Bypassed weeks of UI mock reviews and connected to our Node/Socket server in days.",
                user: "Elena Rostova", role: "VP of Product Development", initial: "ER", color: "from-emerald-500 to-teal-500"
              }
            ].map((t, idx) => (
              <div key={idx} className="p-7 rounded-3xl bg-slate-50/50 border border-slate-250/70 flex flex-col justify-between text-left hover-glow-card">
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4.5 w-4.5 fill-current" />)}
                  </div>
                  <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                    "{t.text}"
                  </p>
                </div>
                <div className="flex items-center gap-3.5 mt-7 border-t border-slate-200/60 pt-4.5">
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-tr ${t.color} text-white font-extrabold flex items-center justify-center text-xs shadow-sm`}>
                    {t.initial}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{t.user}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faq" className="py-24 border-t border-slate-150 bg-transparent">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-550 font-medium">
              Clear, transparent documentation regarding our client layouts and functionalities.
            </p>
          </div>

          <div className="glass-premium rounded-[32px] p-6 md:p-10 border border-slate-200/80 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
            <Accordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-150 bg-slate-50/50 text-slate-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-left text-sm">
          <div className="space-y-4.5">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold">
              <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <span className="font-black text-slate-950 tracking-tight">WeChat Client</span>
            </div>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold">
              Design blueprint for high-security real-time team messaging clients. Inspired by WhatsApp Desktop, Discord, and Linear.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-4">SaaS Template</h4>
            <ul className="space-y-3 text-xs text-slate-450 font-semibold">
              <li><Link to="/chat" className="hover:text-indigo-600 transition-colors">Mock Messenger</Link></li>
              <li><Link to="/admin" className="hover:text-indigo-600 transition-colors">Compliance Audit</Link></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Integrations Spec</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-4">Account Flow</h4>
            <ul className="space-y-3 text-xs text-slate-450 font-semibold">
              <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Sign In Portal</Link></li>
              <li><Link to="/register" className="hover:text-indigo-600 transition-colors">Register Space</Link></li>
              <li><Link to="/forgot-password" className="hover:text-indigo-600 transition-colors">Reset Verification</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-4">Newsletter Signup</h4>
            <p className="text-xs text-slate-450 mb-3.5 font-semibold">Get notifications when we launch Node/Socket integrations.</p>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white p-1">
              <input 
                type="email" 
                placeholder="email@saas.io" 
                className="flex-1 bg-transparent text-xs px-3 outline-none py-2 text-slate-800 border-0"
              />
              <button className="bg-indigo-650 hover:bg-indigo-650/90 text-white text-xs px-4 rounded-lg font-bold cursor-pointer transition-colors border-0">
                Join
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-slate-200/50 pt-8 text-center text-xs text-slate-450 font-semibold">
          © 2026 Antigravity. Built with React 19, Tailwind CSS v4, and Framer Motion. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
