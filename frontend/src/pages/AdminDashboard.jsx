import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Car, MapPin, DollarSign, Clock, AlertTriangle,
  TrendingUp, Ticket
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, revenueRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/revenue?period=${revenuePeriod}`),
        api.get('/admin/logs?limit=5')
      ]);
      setStats(statsRes.data.stats);
      setRevenue(revenueRes.data.revenue);
      setRecentLogs(logsRes.data.records);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [revenuePeriod]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto"
    >
      <div className="mb-4 xl:mb-8">
        <h1 className="text-2xl xl:text-3xl font-bold flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-cyan-400" />
          <span className="gradient-text">Admin Dashboard</span>
        </h1>
        <p className="text-slate-400 mt-1">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4 mb-4 xl:mb-6">
        <StatsCard icon={Ticket} label="Total Slots" value={stats.totalSlots} color="blue" delay={0} />
        <StatsCard icon={Car} label="Occupied" value={stats.occupied} color="red" delay={1} />
        <StatsCard icon={MapPin} label="Available" value={stats.available} color="emerald" delay={2} />
        <StatsCard icon={DollarSign} label="Revenue Today" value={stats.revenueToday} prefix="₹" color="cyan" delay={3} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4 mb-4 xl:mb-6">
        <StatsCard icon={TrendingUp} label="Total Revenue" value={stats.totalRevenue} prefix="₹" color="violet" delay={4} />
        <StatsCard icon={Car} label="Active Vehicles" value={stats.activeVehicles} color="amber" delay={5} />
        <StatsCard icon={Clock} label="Reserved" value={stats.reserved} color="blue" delay={6} />
        <StatsCard icon={AlertTriangle} label="Long Parked (12h+)" value={stats.longParked} color="red" delay={7} />
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4 xl:p-6 mb-4 xl:mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Revenue Analytics</h2>
          <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
            {['daily', 'weekly'].map(period => (
              <button
                key={period}
                onClick={() => setRevenuePeriod(period)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  revenuePeriod === period
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="h-52 xl:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="period"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                tickFormatter={v => `₹${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 15, 45, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
                formatter={(value) => [`₹${value}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-white/10">
                <th className="pb-3 font-medium">Vehicle</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Slot</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Charge</th>
                <th className="pb-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map(log => (
                <tr key={log.id} className="border-b border-white/5 text-sm">
                  <td className="py-3 font-medium">{log.vehicle_number}</td>
                  <td className="py-3 text-slate-400">{log.customer_name}</td>
                  <td className="py-3">{log.slot_number}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      log.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400'
                        : log.status === 'active' ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-cyan-400 font-medium">
                    {log.charge ? `₹${log.charge.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 text-slate-400">
                    {format(new Date(log.created_at), 'dd MMM, hh:mm a')}
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No activity yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
