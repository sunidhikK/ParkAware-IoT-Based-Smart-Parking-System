import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, User, ParkingCircle, Eye, EyeOff, ArrowRight,
  ChevronLeft, Car, MapPin, Zap, Shield, CheckCircle2
} from 'lucide-react';

const benefits = [
  { icon: MapPin, text: 'Real-time slot availability across 3 floors' },
  { icon: Car, text: 'Book or park instantly from your browser' },
  { icon: Zap, text: 'Smart pricing with peak-hour rates' },
  { icon: Shield, text: 'Secure JWT authentication & history tracking' },
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
      navigate('/customer');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-navy-950 bg-slate-50 overflow-hidden">
      {/* ===== LEFT PANEL — Benefits showcase ===== */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-center p-6 xl:p-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 9, repeat: Infinity }} className="absolute top-32 left-16 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl" />
          <motion.div animate={{ x: [0, -25, 0], y: [0, 20, 0] }} transition={{ duration: 11, repeat: Infinity }} className="absolute bottom-32 right-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-4 xl:mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <ParkingCircle className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">SmartPark</h1>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3">
              Start parking<br />
              <span className="gradient-text">smarter today.</span>
            </h2>
            <p className="text-slate-400 text-base xl:text-lg mb-6 xl:mb-10">
              Create your free account and experience the future of parking management.
            </p>
          </motion.div>

          {/* Benefits list */}
          <div className="space-y-2 xl:space-y-4">
            {benefits.map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 p-3 xl:p-4 rounded-2xl glass"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-sm text-slate-300">{item.text}</p>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-auto" />
              </motion.div>
            ))}
          </div>

          {/* Testimonial-style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 xl:mt-10 glass rounded-2xl p-4 xl:p-5"
          >
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map(n => (
                <span key={n} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-sm text-slate-300 italic">"SmartPark completely transformed our parking experience. The real-time grid view is incredible!"</p>
            <p className="text-xs text-slate-500 mt-2">— Demo User</p>
          </motion.div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Register form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-12 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="text-center mb-5 lg:hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-500 flex items-center justify-center mx-auto mb-4">
              <ParkingCircle className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">SmartPark</h1>
          </div>

          <div className="mb-5">
            <h2 className="text-2xl xl:text-3xl font-bold text-white mb-2">Create account</h2>
            <p className="text-slate-400">Get started with your free SmartPark account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="input-field pl-12" required />
              </div>
            </div>

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
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-field pl-12 pr-12" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      password.length >= i * 3 ? (password.length >= 9 ? 'bg-emerald-400' : password.length >= 6 ? 'bg-amber-400' : 'bg-red-400') : 'bg-white/10'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</motion.p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors inline-flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
