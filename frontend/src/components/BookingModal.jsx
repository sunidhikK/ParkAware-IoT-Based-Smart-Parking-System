import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Car, Clock, Zap } from 'lucide-react';
import api from '../api/axios';

export default function BookingModal({ slot, onClose, onSuccess }) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [mode, setMode] = useState('park'); // 'park' or 'reserve'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      setError('Vehicle number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'park'
        ? `/slots/${slot.id}/park`
        : `/slots/${slot.id}/reserve`;

      await api.post(endpoint, { vehicleNumber: vehicleNumber.trim().toUpperCase() });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold gradient-text">Book Slot</h2>
              <p className="text-sm text-slate-400 mt-1">
                Slot {slot.slot_number} · Floor {slot.floor} · {slot.type}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle number input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Number</label>
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value)}
                  placeholder="e.g., KA01AB1234"
                  className="input-field pl-12 uppercase"
                  maxLength={15}
                />
              </div>
            </div>

            {/* Mode toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Booking Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('park')}
                  className={`p-4 rounded-xl border transition-all duration-300 text-center ${
                    mode === 'park'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <Zap className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Park Now</p>
                  <p className="text-xs opacity-60 mt-1">Start immediately</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('reserve')}
                  className={`p-4 rounded-xl border transition-all duration-300 text-center ${
                    mode === 'reserve'
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <Clock className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium text-sm">Reserve</p>
                  <p className="text-xs opacity-60 mt-1">15 min hold</p>
                </button>
              </div>
            </div>

            {/* Pricing info */}
            <div className="bg-white/5 rounded-xl p-4 text-sm">
              <p className="text-slate-300 font-medium mb-2">Pricing</p>
              <div className="space-y-1 text-slate-400">
                <p>Normal hours: ₹30/hr (first hour flat, then ₹0.50/min)</p>
                <p>Peak hours (9-11 AM, 5-8 PM): ₹50/hr</p>
                <p>Minimum charge: ₹20</p>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : mode === 'park' ? 'Park Now' : 'Reserve Slot'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
