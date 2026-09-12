import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Car, History, Settings, LogOut, Sun, Moon,
  ParkingCircle, ClipboardList, Grid3X3
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const customerLinks = [
    { to: '/customer', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customer/parking', icon: Car, label: 'Parking View' },
    { to: '/customer/history', icon: History, label: 'My History' }
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/logs', icon: ClipboardList, label: 'Parking Logs' },
    { to: '/admin/slots', icon: Grid3X3, label: 'Slot Management' }
  ];

  const links = user?.role === 'admin' ? adminLinks : customerLinks;

  return (
    <motion.aside
      initial={{ x: -64 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-full w-64 glass-strong z-50 flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 xl:p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
            <ParkingCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg gradient-text">SmartPark</h1>
            <p className="text-xs text-slate-400 capitalize">{user?.role} Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/customer' || to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* User info */}
        <div className="px-4 py-3 rounded-xl bg-white/5 mb-2">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300"
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}
