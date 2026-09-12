import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Mail, Lock, ParkingCircle, Eye, EyeOff, Car, Zap, Shield,
  BarChart3, Clock, MapPin, CreditCard, ChevronRight, ArrowRight,
  TrendingUp, Users, Activity
} from 'lucide-react';

const features = [
  { icon: MapPin, title: 'Real-Time Availability', desc: 'See every slot live across 3 floors', color: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-500/10' },
  { icon: Clock, title: 'Smart Reservations', desc: '15-min hold with auto-release timer', color: 'from-violet-400 to-purple-500', bg: 'bg-violet-500/10' },
  { icon: CreditCard, title: 'Auto Fare Calculation', desc: 'Peak/off-peak tiered pricing in ₹', color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/10' },
  { icon: BarChart3, title: 'Admin Analytics', desc: 'Revenue charts, logs & CSV export', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10' },
];

const cellColors = {
  0: { bg: 'bg-emerald-500/40', border: 'border-emerald-500/50', shadow: 'shadow-emerald-500/20' },
  1: { bg: 'bg-red-500/40', border: 'border-red-500/50', shadow: 'shadow-red-500/20' },
  2: { bg: 'bg-amber-500/40', border: 'border-amber-500/50', shadow: 'shadow-amber-500/20' },
  3: { bg: 'bg-blue-500/40', border: 'border-blue-500/50', shadow: 'shadow-blue-500/20' },
};

const actionStyles = {
  parked: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '→' },
  exited: { color: 'text-red-400', bg: 'bg-red-500/10', icon: '←' },
  reserved: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: '◆' },
};

// Convert API grid data to cell grid rows for Floor A
function buildGridFromSlots(floorSlots) {
  if (!floorSlots || floorSlots.length === 0) return [[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]];
  return [
    floorSlots.slice(0, 10).map(s => s.status === 'occupied' ? 1 : s.status === 'reserved' ? 2 : s.type === 'EV' ? 3 : 0),
    floorSlots.slice(10, 20).map(s => s.status === 'occupied' ? 1 : s.status === 'reserved' ? 2 : s.type === 'EV' ? 3 : 0),
  ];
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [stats, setStats] = useState({ available: 0, occupied: 0, total: 60, occupancy: 0, activeUsers: 0, floors: 3 });
  const [activityLog, setActivityLog] = useState([]);
  const [gridFloors, setGridFloors] = useState({});
  const [activeFloor, setActiveFloor] = useState('A');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Fetch real-time data from public API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes, gridRes] = await Promise.all([
          axios.get('/api/public/stats'),
          axios.get('/api/public/activity'),
          axios.get('/api/public/grid'),
        ]);
        setStats(statsRes.data);
        setActivityLog(activityRes.data);
        setGridFloors(gridRes.data);
      } catch {
        // silently fail on login page
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Cycle features
  useEffect(() => {
    const timer = setInterval(() => setActiveFeature(prev => (prev + 1) % features.length), 3000);
    return () => clearInterval(timer);
  }, []);

  // Cycle activity log highlight
  useEffect(() => {
    if (activityLog.length === 0) return;
    const timer = setInterval(() => setActivityIndex(prev => (prev + 1) % activityLog.length), 2500);
    return () => clearInterval(timer);
  }, [activityLog.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/customer');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-navy-950 bg-slate-50 overflow-hidden">

      {/* ===== LEFT PANEL ===== */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col p-6 xl:p-10 overflow-hidden">

        {/* Background gradient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-10 -left-10 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px]" />
          <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-20 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/3 left-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Content — all relative z-10 */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-4 xl:mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <ParkingCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text leading-none">SmartPark</h1>
                <p className="text-[11px] text-slate-500">Intelligent Parking System</p>
              </div>
            </div>
          </motion.div>

          {/* Hero text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-4 xl:mb-6">
            <h2 className="text-3xl xl:text-5xl font-extrabold leading-[1.1] mb-2 xl:mb-4">
              <span className="text-white">Parking made</span><br />
              <span className="gradient-text">effortless.</span>
            </h2>
            <p className="text-slate-400 text-base max-w-sm">
              {stats.total} smart slots across {stats.floors} floors. Book, park, pay — all from your browser.
            </p>
          </motion.div>

          {/* === Animated Parking Grid === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-3 xl:p-5 mb-4 xl:mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-300">Live Floor {activeFloor} — {gridFloors[activeFloor]?.length || 20} Slots</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Floor tabs */}
                <div className="flex gap-1 mr-2">
                  {Object.keys(gridFloors).length > 0 ? Object.keys(gridFloors).sort().map(floor => (
                    <button key={floor} onClick={() => setActiveFloor(floor)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        activeFloor === floor ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
                      }`}>{floor}</button>
                  )) : ['A','B','C'].map(floor => (
                    <button key={floor} onClick={() => setActiveFloor(floor)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        activeFloor === floor ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
                      }`}>{floor}</button>
                  ))}
                </div>
                <div className="flex gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/60" />Free</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/60" />Taken</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/60" />Held</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/60" />EV</span>
                </div>
              </div>
            </div>

            {/* The grid — real data */}
            <div className="space-y-2">
              {(gridFloors[activeFloor] ? buildGridFromSlots(gridFloors[activeFloor]) : [[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]]).map((row, ri) => (
                <div key={`${activeFloor}-${ri}`} className="flex gap-2">
                  <span className="text-[10px] text-slate-600 w-6 flex items-center justify-end pr-1">{`${activeFloor}${ri * 10 + 1}`}</span>
                  {row.map((cell, ci) => {
                    const c = cellColors[cell];
                    const slotData = gridFloors[activeFloor]?.[ri * 10 + ci];
                    return (
                      <motion.div
                        key={`${activeFloor}-${ri}-${ci}`}
                        layout
                        className={`flex-1 h-7 rounded-lg border ${c.bg} ${c.border} shadow-sm ${c.shadow} transition-colors duration-700 relative overflow-hidden`}
                      >
                        {cell === 1 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center">
                            <Car className="w-3.5 h-3.5 text-red-300/70" />
                          </motion.div>
                        )}
                        {cell === 2 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Clock className="w-3 h-3 text-amber-300/70" />
                          </div>
                        )}
                        {cell === 3 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-3 h-3 text-blue-300/70" />
                          </div>
                        )}
                        {/* Slot number tooltip */}
                        {slotData && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40 rounded-lg text-[9px] text-white font-bold">
                            {slotData.number}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Animated scanner line */}
            <motion.div
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="h-0.5 w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-3 rounded-full"
            />
          </motion.div>

          {/* === Live Stats Row === */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-2 xl:gap-3 mb-3 xl:mb-5"
          >
            {[
              { icon: Car, label: 'Available', value: stats.available, suffix: `/${stats.total}`, color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
              { icon: TrendingUp, label: 'Occupancy', value: stats.occupancy, suffix: '%', color: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
              { icon: Users, label: 'Active Users', value: stats.activeUsers, suffix: '', color: 'text-violet-400', glow: 'shadow-violet-500/20' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 + i * 0.08 }}
                className={`glass rounded-xl p-3 text-center shadow-md ${stat.glow}`}
              >
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1.5`} />
                <p className="text-lg font-bold text-white leading-none">
                  <motion.span key={stat.value} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    {stat.value.toLocaleString()}
                  </motion.span>
                  <span className="text-[10px] text-slate-500 font-normal">{stat.suffix}</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* === Live Activity Feed === */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="glass rounded-xl p-3 xl:p-4 mb-3 xl:mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-medium text-slate-300">Live Activity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-500">streaming</span>
              </div>
            </div>
            <div className="space-y-2">
              {activityLog.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-3">No recent activity</p>
              ) : activityLog.slice(0, 6).map((item, i) => {
                const style = actionStyles[item.action] || actionStyles.parked;
                const isActive = i === activityIndex;
                return (
                  <motion.div
                    key={i}
                    animate={{ opacity: isActive ? 1 : 0.4, x: isActive ? 0 : -4 }}
                    transition={{ duration: 0.4 }}
                    className={`flex items-center gap-3 text-xs py-1.5 px-2.5 rounded-lg transition-colors duration-300 ${isActive ? style.bg : ''}`}
                  >
                    <span className={`w-5 text-center font-mono text-sm ${style.color}`}>{style.icon}</span>
                    <span className={`font-semibold ${isActive ? 'text-white' : 'text-slate-500'}`}>{item.vehicle}</span>
                    <span className={`${style.color} font-medium`}>{item.action}</span>
                    <span className="text-slate-500">slot</span>
                    <span className={`font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.slot}</span>
                    <span className="ml-auto text-slate-600">{item.timeAgo}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Feature carousel — compact */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
            <div className="grid grid-cols-2 gap-2">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.08 }}
                  onClick={() => setActiveFeature(i)}
                  className={`relative p-3.5 rounded-xl cursor-pointer transition-all duration-500 overflow-hidden ${
                    activeFeature === i ? 'glass-strong ring-1 ring-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {activeFeature === i && (
                    <motion.div
                      layoutId="featureGlow"
                      className={`absolute inset-0 ${feat.bg} rounded-xl`}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feat.color} flex items-center justify-center shrink-0 ${
                      activeFeature === i ? 'shadow-md' : 'opacity-50'
                    }`}>
                      <feat.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-xs leading-tight ${activeFeature === i ? 'text-white' : 'text-slate-400'}`}>{feat.title}</p>
                      <AnimatePresence mode="wait">
                        {activeFeature === i && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[11px] text-slate-400 mt-0.5 leading-snug"
                          >
                            {feat.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Login form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-12 relative">
        {/* Mobile-only background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="text-center mb-6 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-3">
              <ParkingCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">SmartPark</h1>
          </div>

          {/* Welcome header */}
          <div className="mb-5">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-12" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="input-field pl-12 pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</motion.p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Quick login buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => { setEmail('admin@parking.com'); setPassword('admin123'); }}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300 text-center"
            >
              <Shield className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-white">Admin Demo</p>
              <p className="text-[10px] text-slate-500">admin@parking.com</p>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('customer@parking.com'); setPassword('customer123'); }}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300 text-center"
            >
              <Car className="w-5 h-5 text-violet-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-white">Customer Demo</p>
              <p className="text-[10px] text-slate-500">customer@parking.com</p>
            </button>
          </div>

          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors inline-flex items-center gap-1">
                Create one <ChevronRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
