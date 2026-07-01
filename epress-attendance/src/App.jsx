import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Users,
  CheckCircle,
  AlertCircle,
  Shield,
  Plus,
  Trash2,
  UserPlus,
  BarChart3,
  Calendar,
  X,
  Search,
  Loader2,
  Fingerprint,
} from 'lucide-react';
import { api } from './api.js';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    error: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
    info: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  };

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-lg shadow-2xl animate-slide-up ${colors[type] || colors.info}`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-panel p-5 rounded-xl flex items-center gap-4 hover:bg-white/[0.05] transition-all">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-100">{value}</p>
      </div>
    </div>
  );
}

function AttendanceTab({ toast }) {
  const [records, setRecords] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [recordsData, statsData] = await Promise.all([
          api.attendance.all({ date: selectedDate }),
          api.attendance.stats(selectedDate),
        ]);
        if (!cancelled) {
          setRecords(recordsData);
          setStats(statsData);
        }
      } catch (err) {
        if (!cancelled) toast(err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDate, toast]);

  const handleToggle = async (e) => {
    e.preventDefault();
    if (!employeeName.trim()) return toast('Please enter an employee name.', 'error');
    setSubmitting(true);
    try {
      const result = await api.attendance.toggle(employeeName);
      toast(result.message, 'success');
      setEmployeeName('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="space-y-6 lg:col-span-1">
        <div className="glass-panel p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-400 to-transparent" />
          <h2 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            Gate Pass Portal
          </h2>

          <form onSubmit={handleToggle} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                Employee Identity
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Enter full name..."
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all text-gray-200"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-semibold py-3 px-4 rounded-xl shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 stroke-[2.5]" />
              )}
              {submitting ? 'Processing...' : 'Log Attendance Shift'}
            </button>
          </form>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              icon={Users}
              label="Total Today"
              value={stats.total}
              color="bg-amber-500/20 text-amber-400"
            />
            <StatsCard
              icon={CheckCircle}
              label="On Time"
              value={stats.present}
              color="bg-emerald-500/20 text-emerald-400"
            />
            <StatsCard
              icon={AlertCircle}
              label="Late"
              value={stats.late}
              color="bg-rose-500/20 text-rose-400"
            />
            <StatsCard
              icon={LogOut}
              label="Checked Out"
              value={stats.checkedOut}
              color="bg-blue-500/20 text-blue-400"
            />
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-200 tracking-wide">Live Roll Log</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-900/50 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Personnel</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Check In</th>
                    <th className="py-4 px-6">Check Out</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-sm">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="w-8 h-8 text-gray-600" />
                          <p>No shifts logged{selectedDate !== new Date().toISOString().split('T')[0] ? ' for this date' : ' today'}.</p>
                      </div>
                      </td>
                    </tr>
                  ) : (
                    records.map((record, idx) => (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors animate-slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xs font-bold text-black">
                              {record.employee_name?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium text-gray-300">{record.employee_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-400">{record.department || 'General'}</td>
                        <td className="py-4 px-6 text-gray-400 font-mono text-xs">{record.date}</td>
                        <td className="py-4 px-6 text-emerald-400 font-mono">{record.check_in || '---'}</td>
                        <td className="py-4 px-6 text-amber-400 font-mono">{record.check_out || '---'}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                            record.status === 'Present'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {record.status === 'Late' && <AlertCircle className="w-3 h-3" />}
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeesTab({ toast }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: 'General' });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await api.employees.list();
        if (!cancelled) setEmployees(data);
      } catch (err) {
        if (!cancelled) toast(err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [toast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast('Employee name is required.', 'error');
    setSubmitting(true);
    try {
      await api.employees.create(form);
      toast('Employee registered successfully.', 'success');
      setForm({ name: '', email: '', department: 'General' });
      setShowForm(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await api.employees.delete(id);
      toast(`Removed ${name}.`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-all text-gray-200"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-orange-600/10 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Register Employee
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="glass-panel p-6 rounded-2xl animate-slide-up"
        >
          <h3 className="text-md font-semibold text-amber-400 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Employee Registration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-all text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. john@company.com"
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-all text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-all text-gray-200"
              >
                <option>General</option>
                <option>Engineering</option>
                <option>Design</option>
                <option>Marketing</option>
                <option>Operations</option>
                <option>HR</option>
                <option>Finance</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg transition-all disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Saving...' : 'Save Employee'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 px-5 rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>{search ? 'No matching employees.' : 'No employees registered yet.'}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Registered</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-sm">
              {filtered.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors animate-slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-xs font-bold text-black">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-300">{emp.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-400">{emp.department}</td>
                  <td className="py-4 px-6 text-gray-400">{emp.email || '---'}</td>
                  <td className="py-4 px-6 text-gray-500 text-xs">
                    {new Date(emp.created_at + 'Z').toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ReportsTab({ toast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = {};
        if (selectedDate) params.date = selectedDate;
        const data = await api.attendance.all(params);
        if (!cancelled) setRecords(data);
      } catch (err) {
        if (!cancelled) toast(err.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDate, toast]);

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const checkedOutCount = records.filter((r) => r.check_out).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          icon={CheckCircle}
          label="Present"
          value={presentCount}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatsCard
          icon={AlertCircle}
          label="Late"
          value={lateCount}
          color="bg-rose-500/20 text-rose-400"
        />
        <StatsCard
          icon={LogOut}
          label="Checked Out"
          value={checkedOutCount}
          color="bg-blue-500/20 text-blue-400"
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-semibold text-gray-200 tracking-wide">All Attendance History</h3>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-900/50 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>No attendance records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01] border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Personnel</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Check In</th>
                  <th className="py-4 px-6">Check Out</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-sm">
                {records.map((record, idx) => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors animate-slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="py-4 px-6 font-medium text-gray-300">{record.employee_name}</td>
                    <td className="py-4 px-6 text-gray-400">{record.department || 'General'}</td>
                    <td className="py-4 px-6 text-gray-400 font-mono text-xs">{record.date}</td>
                    <td className="py-4 px-6 text-emerald-400 font-mono">{record.check_in || '---'}</td>
                    <td className="py-4 px-6 text-amber-400 font-mono">{record.check_out || '---'}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                        record.status === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {record.status === 'Late' && <AlertCircle className="w-3 h-3" />}
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [toasts, setToasts] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const TABS = [
    { id: 'attendance', label: 'Attendance', icon: Fingerprint },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <header className="flex flex-wrap items-center justify-between mb-8 py-4 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl shadow-lg shadow-orange-600/20">
              <Shield className="w-6 h-6 text-black font-bold" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide uppercase bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Epress Computech
              </h1>
              <p className="text-xs text-gray-500 tracking-wider">Internal Management Console</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium tracking-wide text-gray-300">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {' | '}
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </header>

        <div className="flex gap-1 mb-8 p-1 bg-white/[0.03] rounded-xl border border-gray-800/40 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 text-amber-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <main>
          {activeTab === 'attendance' && <AttendanceTab toast={addToast} />}
          {activeTab === 'employees' && <EmployeesTab toast={addToast} />}
          {activeTab === 'reports' && <ReportsTab toast={addToast} />}
        </main>
      </div>
    </div>
  );
}

export default App;
