import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, Car, Zap, Accessibility, Crown, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import FloorSwitcher from '../components/FloorSwitcher';

export default function AdminSlotManagement() {
  const [slots, setSlots] = useState([]);
  const [floor, setFloor] = useState('A');
  const [loading, setLoading] = useState(true);
  const [overriding, setOverriding] = useState(null);

  const fetchSlots = async () => {
    try {
      const res = await api.get(`/slots?floor=${floor}`);
      setSlots(res.data.slots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSlots();
  }, [floor]);

  const handleOverride = async (slotId, newStatus) => {
    setOverriding(slotId);
    try {
      await api.patch(`/admin/slots/${slotId}`, { status: newStatus });
      fetchSlots();
    } catch (err) {
      console.error('Override failed:', err);
    } finally {
      setOverriding(null);
    }
  };

  const typeIcons = { Regular: Car, EV: Zap, Handicap: Accessibility, VIP: Crown };
  const typeColors = {
    Regular: 'text-slate-400',
    EV: 'text-emerald-400',
    Handicap: 'text-blue-400',
    VIP: 'text-amber-400'
  };

  const available = slots.filter(s => s.status === 'available').length;
  const occupied = slots.filter(s => s.status === 'occupied').length;
  const reserved = slots.filter(s => s.status === 'reserved').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Grid3X3 className="w-8 h-8 text-cyan-400" />
            <span className="gradient-text">Slot Management</span>
          </h1>
          <p className="text-slate-400 mt-1">Manage and override parking slots</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchSlots(); }}
          className="btn-secondary flex items-center gap-2 w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <FloorSwitcher selected={floor} onChange={setFloor} />
      </div>

      {/* Floor Stats */}
      <div className="flex gap-6 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Available: {available}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-slate-400">Occupied: {occupied}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-400">Reserved: {reserved}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {slots.map(slot => {
            const Icon = typeIcons[slot.type] || Car;
            return (
              <motion.div
                key={slot.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  glass rounded-2xl p-5 transition-all duration-300
                  ${slot.status === 'available' ? 'border-emerald-500/30'
                    : slot.status === 'reserved' ? 'border-amber-500/30'
                    : 'border-red-500/30'}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold">{slot.slot_number}</span>
                  <Icon className={`w-5 h-5 ${typeColors[slot.type]}`} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium ${typeColors[slot.type]}`}>{slot.type}</span>
                  <span className={`
                    ml-auto px-2 py-0.5 rounded-full text-xs font-medium capitalize
                    ${slot.status === 'available' ? 'bg-emerald-500/20 text-emerald-400'
                      : slot.status === 'reserved' ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'}
                  `}>
                    {slot.status}
                  </span>
                </div>

                {slot.longParked && (
                  <p className="text-xs text-amber-400 mb-3">⚠ Parked 12h+</p>
                )}

                {/* Override buttons */}
                <div className="flex gap-2 mt-2">
                  {slot.status !== 'available' && (
                    <button
                      onClick={() => handleOverride(slot.id, 'available')}
                      disabled={overriding === slot.id}
                      className="flex-1 text-xs py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      {overriding === slot.id ? '...' : 'Mark Free'}
                    </button>
                  )}
                  {slot.status !== 'occupied' && (
                    <button
                      onClick={() => handleOverride(slot.id, 'occupied')}
                      disabled={overriding === slot.id}
                      className="flex-1 text-xs py-2 px-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {overriding === slot.id ? '...' : 'Mark Occupied'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
