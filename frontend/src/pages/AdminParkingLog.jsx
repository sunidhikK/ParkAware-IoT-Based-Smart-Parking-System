import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ClipboardList, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';

export default function AdminParkingLog() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', vehicle: '', slot: '' });
  const limit = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (filters.date) params.append('date', filters.date);
      if (filters.vehicle) params.append('vehicle', filters.vehicle);
      if (filters.slot) params.append('slot', filters.slot);

      const res = await api.get(`/admin/logs?${params}`);
      setRecords(res.data.records);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.vehicle) params.append('vehicle', filters.vehicle);
      if (filters.slot) params.append('slot', filters.slot);

      const res = await api.get(`/admin/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'parking-records.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const statusColors = {
    completed: 'bg-emerald-500/20 text-emerald-400',
    active: 'bg-cyan-500/20 text-cyan-400',
    reserved: 'bg-amber-500/20 text-amber-400',
    expired: 'bg-slate-500/20 text-slate-400',
    cancelled: 'bg-red-500/20 text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-cyan-400" />
            <span className="gradient-text">Parking Logs</span>
          </h1>
          <p className="text-slate-400 mt-1">Complete parking activity records</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 w-fit">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="glass rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="date"
              value={filters.date}
              onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              className="input-field"
              placeholder="Filter by date"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={filters.vehicle}
              onChange={e => setFilters(f => ({ ...f, vehicle: e.target.value }))}
              className="input-field"
              placeholder="Search vehicle number..."
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={filters.slot}
              onChange={e => setFilters(f => ({ ...f, slot: e.target.value }))}
              className="input-field"
              placeholder="Search slot number..."
            />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-white/10">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Vehicle</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Slot</th>
                <th className="p-4 font-medium">Floor</th>
                <th className="p-4 font-medium">Entry</th>
                <th className="p-4 font-medium">Exit</th>
                <th className="p-4 font-medium">Duration</th>
                <th className="p-4 font-medium">Charge</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No records found
                  </td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record.id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-400">#{record.id}</td>
                    <td className="p-4 font-medium">{record.vehicle_number}</td>
                    <td className="p-4 text-slate-400">{record.customer_name}</td>
                    <td className="p-4">{record.slot_number}</td>
                    <td className="p-4">{record.floor}</td>
                    <td className="p-4 text-slate-400">
                      {record.entry_time ? format(new Date(record.entry_time), 'dd MMM, hh:mm a') : '—'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {record.exit_time ? format(new Date(record.exit_time), 'dd MMM, hh:mm a') : '—'}
                    </td>
                    <td className="p-4">
                      {record.duration_minutes != null
                        ? `${Math.floor(record.duration_minutes / 60)}h ${Math.round(record.duration_minutes % 60)}m`
                        : '—'
                      }
                    </td>
                    <td className="p-4 font-medium text-cyan-400">
                      {record.charge ? `₹${record.charge.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[record.status] || ''}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 py-2 text-sm text-slate-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
