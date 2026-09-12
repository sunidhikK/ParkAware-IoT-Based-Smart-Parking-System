import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { History, Receipt, Clock, Car } from 'lucide-react';
import api from '../api/axios';
import ReceiptModal from '../components/ReceiptModal';

export default function MyHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/parking/my-history');
        setRecords(res.data.records);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const viewReceipt = async (recordId) => {
    try {
      const res = await api.get(`/parking/receipt/${recordId}`);
      setReceipt(res.data.receipt);
    } catch (err) {
      console.error('Failed to fetch receipt:', err);
    }
  };

  const statusColors = {
    completed: 'bg-emerald-500/20 text-emerald-400',
    active: 'bg-cyan-500/20 text-cyan-400',
    reserved: 'bg-amber-500/20 text-amber-400',
    expired: 'bg-slate-500/20 text-slate-400',
    cancelled: 'bg-red-500/20 text-red-400'
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <History className="w-8 h-8" />
          Parking History
        </h1>
        <p className="text-slate-400 mt-1">Your past parking sessions</p>
      </div>

      {records.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Car className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No parking history yet</p>
          <p className="text-sm text-slate-500 mt-1">Your parking sessions will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Car className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{record.vehicle_number}</p>
                    <p className="text-sm text-slate-400">
                      {record.slot_number} · Floor {record.floor} · {record.slot_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-wrap">
                  {record.entry_time && (
                    <div className="text-sm">
                      <p className="text-slate-500">Entry</p>
                      <p className="font-medium">{format(new Date(record.entry_time), 'dd MMM, hh:mm a')}</p>
                    </div>
                  )}
                  {record.exit_time && (
                    <div className="text-sm">
                      <p className="text-slate-500">Exit</p>
                      <p className="font-medium">{format(new Date(record.exit_time), 'dd MMM, hh:mm a')}</p>
                    </div>
                  )}
                  {record.duration_minutes != null && (
                    <div className="text-sm">
                      <p className="text-slate-500">Duration</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(record.duration_minutes / 60)}h {Math.round(record.duration_minutes % 60)}m
                      </p>
                    </div>
                  )}
                  {record.charge != null && (
                    <div className="text-sm">
                      <p className="text-slate-500">Charge</p>
                      <p className="font-bold text-cyan-400">₹{record.charge.toFixed(2)}</p>
                    </div>
                  )}

                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[record.status] || ''}`}>
                    {record.status}
                  </span>

                  {record.status === 'completed' && (
                    <button
                      onClick={() => viewReceipt(record.id)}
                      className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                      Receipt
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </motion.div>
  );
}
