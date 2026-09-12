import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';

export default function CheckoutModal({ session, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isReserved = session.status === 'reserved';
  const entryTime = session.entry_time ? new Date(session.entry_time) : null;
  const now = new Date();
  const durationMs = entryTime ? now - entryTime : 0;
  const durationMinutes = Math.round(durationMs / (1000 * 60));
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  const handleCheckIn = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/slots/${session.slot_id}/checkin`);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/parking/${session.id}/exit`);
      onSuccess(res.data.receipt);
    } catch (err) {
      setError(err.response?.data?.error || 'Exit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="glass-strong rounded-3xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold gradient-text">
                {isReserved ? 'Check In' : 'Checkout'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Slot {session.slot_number} · Floor {session.floor}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle</span>
                <span className="font-medium">{session.vehicle_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slot Type</span>
                <span className="font-medium">{session.slot_type}</span>
              </div>
              {entryTime && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Entry Time</span>
                    <span className="font-medium">{format(entryTime, 'dd MMM yyyy, hh:mm a')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      {hours}h {mins}m
                    </span>
                  </div>
                </>
              )}
            </div>

            {durationMinutes > 720 && (
              <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Vehicle parked for over 12 hours</span>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
            )}

            {isReserved ? (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Check In Now'}
              </button>
            ) : (
              <button
                onClick={handleExit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                {loading ? 'Processing...' : 'Exit & Pay'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
