import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SlotCard from '../components/SlotCard';
import FloorSwitcher from '../components/FloorSwitcher';
import BookingModal from '../components/BookingModal';
import CheckoutModal from '../components/CheckoutModal';
import ReceiptModal from '../components/ReceiptModal';
import { Car, Zap, Accessibility, Crown, RefreshCw } from 'lucide-react';

export default function ParkingView() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [floor, setFloor] = useState('A');
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const fetchSlots = async () => {
    try {
      const [slotsRes, sessionRes] = await Promise.all([
        api.get(`/slots?floor=${floor}`),
        api.get('/parking/active-session')
      ]);
      setSlots(slotsRes.data.slots);
      setActiveSession(sessionRes.data.session);
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

  useEffect(() => {
    const interval = setInterval(fetchSlots, 15000);
    return () => clearInterval(interval);
  }, [floor]);

  const handleSlotClick = (slot) => {
    if (slot.status === 'available' && !activeSession) {
      setSelectedSlot(slot);
    } else if (activeSession && activeSession.slot_id === slot.id) {
      setShowCheckout(true);
    }
  };

  const handleBookingSuccess = () => {
    setSelectedSlot(null);
    fetchSlots();
  };

  const handleCheckoutSuccess = (receiptData) => {
    setShowCheckout(false);
    if (receiptData) {
      setReceipt(receiptData);
    }
    fetchSlots();
  };

  const floorSlots = slots;
  const available = floorSlots.filter(s => s.status === 'available').length;
  const occupied = floorSlots.filter(s => s.status === 'occupied').length;
  const reserved = floorSlots.filter(s => s.status === 'reserved').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Parking View</h1>
          <p className="text-slate-400 mt-1">Select an available slot to park</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchSlots(); }}
          className="btn-secondary flex items-center gap-2 w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Floor Switcher */}
      <div className="mb-6">
        <FloorSwitcher selected={floor} onChange={setFloor} />
      </div>

      {/* Floor Stats */}
      <div className="flex gap-4 mb-6 flex-wrap">
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
        <div className="ml-auto flex gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-slate-500"><Car className="w-3.5 h-3.5" /> Regular</span>
          <span className="flex items-center gap-1 text-xs text-emerald-400"><Zap className="w-3.5 h-3.5" /> EV</span>
          <span className="flex items-center gap-1 text-xs text-blue-400"><Accessibility className="w-3.5 h-3.5" /> Handicap</span>
          <span className="flex items-center gap-1 text-xs text-amber-400"><Crown className="w-3.5 h-3.5" /> VIP</span>
        </div>
      </div>

      {/* Slot Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500" />
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {floorSlots.map(slot => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onClick={() => handleSlotClick(slot)}
              isUserSlot={activeSession?.slot_id === slot.id}
            />
          ))}
        </motion.div>
      )}

      {/* Active session banner */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 glass-strong rounded-2xl p-4 shadow-2xl z-40 max-w-sm"
        >
          <p className="text-sm font-medium mb-1">
            Active: {activeSession.vehicle_number} at {activeSession.slot_number}
          </p>
          <p className="text-xs text-slate-400 mb-2">
            {activeSession.status === 'reserved' ? 'Reserved - check in soon!' : 'Click your slot to exit'}
          </p>
          <button
            onClick={() => setShowCheckout(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            {activeSession.status === 'reserved' ? 'Check In →' : 'Exit & Pay →'}
          </button>
        </motion.div>
      )}

      {/* Modals */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleBookingSuccess}
        />
      )}
      {showCheckout && activeSession && (
        <CheckoutModal
          session={activeSession}
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
