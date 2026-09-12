import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Clock, MapPin, ArrowRight, Ticket, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import CheckoutModal from '../components/CheckoutModal';
import ReceiptModal from '../components/ReceiptModal';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState({ available: 0, occupied: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const fetchData = async () => {
    try {
      const [sessionRes, slotsRes] = await Promise.all([
        api.get('/parking/active-session'),
        api.get('/slots')
      ]);

      setSession(sessionRes.data.session);

      const slots = slotsRes.data.slots;
      setStats({
        total: slots.length,
        available: slots.filter(s => s.status === 'available').length,
        occupied: slots.filter(s => s.status === 'occupied').length
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckoutSuccess = (receiptData) => {
    setShowCheckout(false);
    if (receiptData) {
      setReceipt(receiptData);
    }
    fetchData();
  };

  if (loading) {
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
      className="max-w-6xl mx-auto"
    >
      {/* Welcome */}
      <div className="mb-4 xl:mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className="text-slate-400 mt-1">Here's your parking overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xl:gap-4 mb-4 xl:mb-8">
        <StatsCard icon={MapPin} label="Available Slots" value={stats.available} color="emerald" delay={0} />
        <StatsCard icon={Car} label="Occupied Slots" value={stats.occupied} color="red" delay={1} />
        <StatsCard icon={Ticket} label="Total Slots" value={stats.total} color="violet" delay={2} />
      </div>

      {/* Active Session */}
      {session && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 xl:p-6 mb-4 xl:mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Car className="w-5 h-5 text-cyan-400" />
              Active Parking Session
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              session.status === 'active'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {session.status === 'active' ? 'Parked' : 'Reserved'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-slate-400">Vehicle</p>
              <p className="font-semibold">{session.vehicle_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Slot</p>
              <p className="font-semibold">{session.slot_number} · Floor {session.floor}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Type</p>
              <p className="font-semibold">{session.slot_type}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">{session.status === 'active' ? 'Entry Time' : 'Reserved At'}</p>
              <p className="font-semibold text-sm">
                {session.entry_time
                  ? format(new Date(session.entry_time), 'dd MMM, hh:mm a')
                  : format(new Date(session.created_at), 'dd MMM, hh:mm a')
                }
              </p>
            </div>
          </div>

          {session.status === 'active' && (
            <LiveDuration entryTime={session.entry_time} />
          )}

          <button
            onClick={() => setShowCheckout(true)}
            className={session.status === 'active'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 mt-4'
              : 'btn-primary mt-4'
            }
          >
            {session.status === 'active' ? 'Exit & Pay' : 'Check In Now'}
          </button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/customer/parking">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass rounded-2xl p-6 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Find Parking</h3>
                <p className="text-sm text-slate-400 mt-1">View available slots and book</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        </Link>

        <Link to="/customer/history">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glass rounded-2xl p-6 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Parking History</h3>
                <p className="text-sm text-slate-400 mt-1">View past sessions and receipts</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Modals */}
      {showCheckout && session && (
        <CheckoutModal
          session={session}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </motion.div>
  );
}

function LiveDuration({ entryTime }) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(entryTime).getTime();
      const totalMinutes = Math.floor(ms / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setDuration(`${hours}h ${minutes}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [entryTime]);

  return (
    <div className="flex items-center gap-2 text-sm text-cyan-400">
      <Clock className="w-4 h-4" />
      <span>Parked for {duration}</span>
    </div>
  );
}
