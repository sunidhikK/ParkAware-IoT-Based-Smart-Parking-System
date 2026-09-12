import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

export default function StatsCard({ icon: Icon, label, value, prefix = '', suffix = '', color = 'cyan', delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current && displayValue === value) return;
    hasAnimated.current = true;

    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const duration = 1000;
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (numValue - startValue) * eased;

      setDisplayValue(Math.round(current * 100) / 100);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const colorMap = {
    cyan: 'from-cyan-400 to-cyan-600',
    emerald: 'from-emerald-400 to-emerald-600',
    violet: 'from-violet-400 to-violet-600',
    amber: 'from-amber-400 to-amber-600',
    red: 'from-red-400 to-red-600',
    blue: 'from-blue-400 to-blue-600'
  };

  const bgColorMap = {
    cyan: 'bg-cyan-500/10',
    emerald: 'bg-emerald-500/10',
    violet: 'bg-violet-500/10',
    amber: 'bg-amber-500/10',
    red: 'bg-red-500/10',
    blue: 'bg-blue-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      className="glass rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className={`text-3xl font-bold bg-gradient-to-r ${colorMap[color]} bg-clip-text text-transparent`}>
            {prefix}{typeof value === 'number' ? displayValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : value}{suffix}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${bgColorMap[color]} flex items-center justify-center`}>
          <Icon className={`w-7 h-7 bg-gradient-to-r ${colorMap[color]} bg-clip-text`} style={{ color: color === 'cyan' ? '#22d3ee' : color === 'emerald' ? '#34d399' : color === 'violet' ? '#a78bfa' : color === 'amber' ? '#fbbf24' : color === 'red' ? '#f87171' : '#60a5fa' }} />
        </div>
      </div>
    </motion.div>
  );
}
