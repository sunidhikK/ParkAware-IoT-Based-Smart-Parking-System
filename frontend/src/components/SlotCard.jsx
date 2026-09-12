import { motion } from 'framer-motion';
import { Car, Zap, Accessibility, Crown, AlertTriangle, Clock } from 'lucide-react';

const typeIcons = {
  Regular: Car,
  EV: Zap,
  Handicap: Accessibility,
  VIP: Crown
};

const typeColors = {
  Regular: 'text-slate-400',
  EV: 'text-emerald-400',
  Handicap: 'text-blue-400',
  VIP: 'text-amber-400'
};

export default function SlotCard({ slot, onClick, isUserSlot }) {
  const Icon = typeIcons[slot.type] || Car;
  const isAvailable = slot.status === 'available';
  const isOccupied = slot.status === 'occupied';
  const isReserved = slot.status === 'reserved';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isAvailable ? { scale: 1.05 } : {}}
      whileTap={isAvailable || isUserSlot ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={!isAvailable && !isUserSlot}
      className={`
        relative p-4 rounded-2xl border transition-all duration-500 text-left
        ${isAvailable
          ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 cursor-pointer dark:animate-glow'
          : isReserved
          ? 'bg-amber-500/10 border-amber-500/30 cursor-default'
          : 'bg-red-500/10 border-red-500/30 cursor-default'
        }
        ${isUserSlot ? 'ring-2 ring-cyan-400 cursor-pointer' : ''}
        ${isOccupied ? 'animate-pulse-slow' : ''}
      `}
    >
      {/* Slot number */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">{slot.slot_number}</span>
        <Icon className={`w-5 h-5 ${typeColors[slot.type]}`} />
      </div>

      {/* Type */}
      <p className={`text-xs font-medium ${typeColors[slot.type]} mb-2`}>{slot.type}</p>

      {/* Status badge */}
      <div className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${isAvailable
          ? 'bg-emerald-500/20 text-emerald-400'
          : isReserved
          ? 'bg-amber-500/20 text-amber-400'
          : 'bg-red-500/20 text-red-400'
        }
      `}>
        <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : isReserved ? 'bg-amber-400' : 'bg-red-400'}`} />
        {isAvailable ? 'Available' : isReserved ? 'Reserved' : 'Occupied'}
      </div>

      {/* Long parked warning */}
      {slot.longParked && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          <span>12h+ parked</span>
        </div>
      )}

      {/* User indicator */}
      {isUserSlot && (
        <div className="mt-2 flex items-center gap-1 text-xs text-cyan-400">
          <Clock className="w-3 h-3" />
          <span>Your vehicle</span>
        </div>
      )}
    </motion.button>
  );
}
