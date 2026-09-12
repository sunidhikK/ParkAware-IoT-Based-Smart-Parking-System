import { motion } from 'framer-motion';

const floors = ['A', 'B', 'C'];

export default function FloorSwitcher({ selected, onChange }) {
  return (
    <div className="flex gap-2 p-1 glass rounded-xl w-fit">
      {floors.map(floor => (
        <button
          key={floor}
          onClick={() => onChange(floor)}
          className="relative px-6 py-2.5 rounded-lg font-medium text-sm transition-colors duration-300"
        >
          {selected === floor && (
            <motion.div
              layoutId="floorIndicator"
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-lg"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className={`relative z-10 ${selected === floor ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
            Floor {floor}
          </span>
        </button>
      ))}
    </div>
  );
}
