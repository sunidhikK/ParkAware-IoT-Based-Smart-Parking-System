import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Download, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ReceiptModal({ receipt, onClose }) {
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    const win = window.open('', '', 'width=400,height=600');
    win.document.write(`
      <html><head><title>Parking Receipt</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 24px; margin: 0; color: #0891b2; }
        .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
        .row { display: flex; justify-content: space-between; margin: 8px 0; }
        .label { color: #666; }
        .value { font-weight: 600; }
        .total { font-size: 24px; text-align: center; margin: 20px 0; color: #0891b2; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
      </style></head><body>
      <div class="header"><h1>🅿️ SmartPark</h1><p>Digital Parking Receipt</p></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Receipt #</span><span class="value">${receipt.id}</span></div>
      <div class="row"><span class="label">Vehicle</span><span class="value">${receipt.vehicleNumber}</span></div>
      <div class="row"><span class="label">Slot</span><span class="value">${receipt.slotNumber} (Floor ${receipt.floor})</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${receipt.slotType}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Entry</span><span class="value">${format(new Date(receipt.entryTime), 'dd MMM yyyy, hh:mm a')}</span></div>
      <div class="row"><span class="label">Exit</span><span class="value">${format(new Date(receipt.exitTime), 'dd MMM yyyy, hh:mm a')}</span></div>
      <div class="row"><span class="label">Duration</span><span class="value">${Math.floor(receipt.durationMinutes / 60)}h ${Math.round(receipt.durationMinutes % 60)}m</span></div>
      <div class="row"><span class="label">Rate</span><span class="value">${receipt.rateApplied}</span></div>
      <div class="divider"></div>
      <div class="total">Total: ₹${receipt.charge.toFixed(2)}</div>
      <div class="footer"><p>Thank you for using SmartPark!</p><p>${new Date().toLocaleDateString()}</p></div>
      </body></html>
    `);
    win.document.close();
    win.print();
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
          id="receipt-content"
        >
          {/* Success icon */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-bold gradient-text">Payment Complete!</h2>
            <p className="text-sm text-slate-400 mt-1">Receipt #{receipt.id}</p>
          </div>

          {/* Receipt details */}
          <div className="bg-white/5 rounded-xl p-5 space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Vehicle</span>
              <span className="font-medium">{receipt.vehicleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Slot</span>
              <span className="font-medium">{receipt.slotNumber} · Floor {receipt.floor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Type</span>
              <span className="font-medium">{receipt.slotType}</span>
            </div>
            <div className="border-t border-white/10 my-2" />
            <div className="flex justify-between">
              <span className="text-slate-400">Entry</span>
              <span className="font-medium text-sm">{format(new Date(receipt.entryTime), 'dd MMM, hh:mm a')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Exit</span>
              <span className="font-medium text-sm">{format(new Date(receipt.exitTime), 'dd MMM, hh:mm a')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duration</span>
              <span className="font-medium">{Math.floor(receipt.durationMinutes / 60)}h {Math.round(receipt.durationMinutes % 60)}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rate</span>
              <span className={`font-medium ${receipt.isPeakRate ? 'text-amber-400' : 'text-emerald-400'}`}>
                {receipt.rateApplied}
              </span>
            </div>
            <div className="border-t border-white/10 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total</span>
              <span className="text-2xl font-bold text-cyan-400">₹{receipt.charge.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="btn-primary flex-1"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
