import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, CalendarCheck,
  TrendingUp, Building2, Briefcase, ArrowRight,
  Settings, Save, ShieldCheck, RefreshCw, Edit3,
  Printer, DollarSign, Trash2,
} from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { DashboardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getGreeting, cn } from '@/lib/utils';
import type { BusinessSettings, Employee, Shift, WorkerDashboardData, DeptAssignment, EmployeeSchedule } from '@/lib/types';

function useAdminData() {
  const [dashboard, setDashboard] = useState<WorkerDashboardData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [d, e, s, bs] = await Promise.all([
        api.worker.dashboard(),
        api.employees.list(),
        api.shifts.list(),
        api.business.get(),
      ]);
      setDashboard(d);
      setEmployees(e);
      setShifts(s);
      setSettings(bs);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  return { dashboard, employees, shifts, settings, loading, refresh: load };
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { dashboard, employees, shifts, settings, loading, refresh } = useAdminData();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [empOpen, setEmpOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', department: '', position: '', shift_id: '', responsibilities: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    opening_time: '08:00', closing_time: '20:15', grace_period_minutes: 10, early_checkin_minutes: 15,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        grace_period_minutes: settings.grace_period_minutes,
        early_checkin_minutes: settings.early_checkin_minutes,
      });
    }
  }, [settings]);

  const onDuty = dashboard?.employees || [];
  const checkedIn = dashboard?.todayRecords?.filter(r => r.check_in).length || 0;
  const lateCount = dashboard?.todayRecords?.filter(r => r.status === 'Late').length || 0;

  const statCards = useMemo(() => [
    { icon: <Users className="w-5 h-5 text-white" />, label: 'Employees', value: employees.length, color: 'bg-gradient-to-br from-primary to-primary-dark' },
    { icon: <UserCheck className="w-5 h-5 text-white" />, label: 'On Duty Now', value: onDuty.length, color: 'bg-gradient-to-br from-success to-emerald-600' },
    { icon: <Clock className="w-5 h-5 text-white" />, label: 'Checked In', value: checkedIn, color: 'bg-gradient-to-br from-secondary to-blue-600' },
    { icon: <Building2 className="w-5 h-5 text-white" />, label: 'Business', value: dashboard?.businessOpen ? 'Open' : 'Closed', color: dashboard?.businessOpen ? 'bg-gradient-to-br from-success to-emerald-600' : 'bg-gradient-to-br from-danger to-red-600', subtitle: dashboard?.businessHours ? `${dashboard.businessHours.opening_time} - ${dashboard.businessHours.closing_time}` : undefined },
    { icon: <AlertTriangle className="w-5 h-5 text-white" />, label: 'Late Today', value: lateCount, color: lateCount ? 'bg-gradient-to-br from-warning to-amber-600' : 'bg-gradient-to-br from-muted to-gray-500' },
    { icon: <ShieldCheck className="w-5 h-5 text-white" />, label: 'Departments', value: dashboard?.departmentAssignments?.length || 0, color: 'bg-gradient-to-br from-purple-500 to-purple-700' },
    { icon: <TrendingUp className="w-5 h-5 text-white" />, label: 'Checked Out', value: dashboard?.todayRecords?.filter(r => r.check_out).length || 0, color: 'bg-gradient-to-br from-muted to-gray-600' },
    { icon: <CalendarCheck className="w-5 h-5 text-white" />, label: dayNames[new Date().getDay()], value: dashboard?.businessHours ? `${dashboard.businessHours.opening_time} - ${dashboard.businessHours.closing_time}` : '--', color: 'bg-gradient-to-br from-primary to-primary-dark' },
  ], [employees.length, onDuty.length, checkedIn, lateCount, dashboard]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.business.update(settingsForm);
      await refresh();
      setSettingsOpen(false);
    } catch {}
    finally { setSaving(false); }
  };

  const handleSaveEmployee = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        department: formData.department || 'General',
        position: formData.position,
        shift_id: formData.shift_id ? Number(formData.shift_id) : undefined,
        responsibilities: formData.responsibilities,
      };
      if (editEmp) {
        await api.employees.update(editEmp.id, payload);
      } else {
        await api.employees.create(payload);
      }
      await refresh();
      setEmpOpen(false);
      setEditEmp(null);
      setFormData({ name: '', email: '', department: '', position: '', shift_id: '', responsibilities: '' });
    } catch {}
    finally { setSaving(false); }
  };

  const openNewEmployee = () => {
    setEditEmp(null);
    setFormData({ name: '', email: '', department: 'Printing', position: '', shift_id: '', responsibilities: '' });
    setEmpOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditEmp(emp);
    setFormData({
      name: emp.name,
      email: emp.email || '',
      department: emp.department,
      position: emp.position,
      shift_id: emp.shift_id ? String(emp.shift_id) : '',
      responsibilities: emp.responsibilities || '',
    });
    setEmpOpen(true);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary via-primary-dark to-primary rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <pattern id="ag" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#ag)"/>
          </svg>
        </div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">{getGreeting()}, {user?.name}</p>
            <h1 className="text-2xl lg:text-3xl font-bold font-heading">Epress Admin</h1>
            <p className="text-white/60 text-sm mt-1">
              {dashboard?.businessOpen ? '● OPEN' : '● CLOSED'} · {dayNames[new Date().getDay()]} · {employees.length} employees
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4" /> Settings
            </Button>
            <Button variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={openNewEmployee}>
              <Users className="w-4 h-4" /> Add Employee
            </Button>
            <Button variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={refresh}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {statCards.map((card, i) => (
          <StatsCard key={card.label} {...card} delay={i * 0.04} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.departmentAssignments?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dashboard.departmentAssignments.map((d: DeptAssignment) => (
                  <div key={d.department} className="p-4 rounded-xl border border-border bg-background/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {d.department === 'Printing' ? <Printer className="w-5 h-5 text-primary" /> :
                         <DollarSign className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{d.department}</p>
                        <p className="text-xs text-text-secondary">{d.start_time} - {d.end_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar name={d.employee_name} size="sm" />
                      <span className="text-sm font-medium text-text">{d.employee_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No assignments for current time</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employees on Duty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {onDuty.length ? onDuty.map((es) => (
                <div key={es.employee.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                  <Avatar name={es.employee.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{es.employee.name}</p>
                    <p className="text-xs text-text-secondary">{es.schedule?.department} · {es.schedule?.start_time}-{es.schedule?.end_time}</p>
                  </div>
                  <Badge variant={es.attendance?.check_in ? 'success' : 'warning'}>
                    {es.attendance?.check_in ? 'IN' : '--'}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-6 text-text-secondary">
                  <UserX className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No one on duty</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Late Arrivals</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.todayRecords?.filter(r => r.status === 'Late').length ? (
                <div className="space-y-3">
                  {dashboard.todayRecords.filter(r => r.status === 'Late').map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-warning/5">
                      <Avatar name={r.employee_name} size="sm" />
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-text">{r.employee_name}</p><p className="text-xs text-text-secondary">{r.check_in}</p></div>
                      <Badge variant="warning">{r.late_minutes}m</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-text-secondary">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No late arrivals</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <Link to="/attendance" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard?.todayRecords?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Employee</th>
                      <th className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Check In</th>
                      <th className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Check Out</th>
                      <th className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Status</th>
                      <th className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {dashboard.todayRecords.map((row, i) => (
                      <motion.tr key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }} className="hover:bg-background/50 transition-colors">
                        <td className="px-3 py-3 text-sm font-medium text-text">{row.employee_name}</td>
                        <td className="px-3 py-3 text-sm text-text">{row.check_in || '--'}</td>
                        <td className="px-3 py-3 text-sm text-text">{row.check_out || '--'}</td>
                        <td className="px-3 py-3"><Badge variant={row.status === 'Late' ? 'warning' : 'success'}>{row.status}</Badge></td>
                        <td className="px-3 py-3 text-xs text-text-secondary">{row.note || row.shift_name || ''}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No records today</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <Button variant="ghost" size="sm" onClick={openNewEmployee} className="text-primary">+ Add</Button>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto space-y-2">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/50 group">
                <Avatar name={emp.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{emp.name}</p>
                  <p className="text-[10px] text-text-secondary">{emp.position || emp.department}</p>
                </div>
                <button onClick={() => openEditEmployee(emp)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-background">
                  <Edit3 className="w-3.5 h-3.5 text-text-secondary" />
                </button>
                <Badge variant={emp.status === 'active' ? 'success' : 'danger'}>{emp.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Business Settings">
        <div className="space-y-4">
          <Input label="Opening Time" type="time" value={settingsForm.opening_time}
            onChange={(e) => setSettingsForm(p => ({ ...p, opening_time: e.target.value }))} />
          <Input label="Closing Time" type="time" value={settingsForm.closing_time}
            onChange={(e) => setSettingsForm(p => ({ ...p, closing_time: e.target.value }))} />
          <Input label="Grace Period (min)" type="number" min={0} max={60} value={String(settingsForm.grace_period_minutes)}
            onChange={(e) => setSettingsForm(p => ({ ...p, grace_period_minutes: Number(e.target.value) }))} />
          <Input label="Early Check-In (min)" type="number" min={0} max={60} value={String(settingsForm.early_checkin_minutes)}
            onChange={(e) => setSettingsForm(p => ({ ...p, early_checkin_minutes: Number(e.target.value) }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveSettings} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={empOpen} onClose={() => { setEmpOpen(false); setEditEmp(null); }} title={editEmp ? 'Edit Employee' : 'Add Employee'}>
        <div className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
          <Input label="Department" value={formData.department} onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))} />
          <Input label="Position" value={formData.position} onChange={(e) => setFormData(p => ({ ...p, position: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-text mb-1">Shift</label>
            <select value={formData.shift_id} onChange={(e) => setFormData(p => ({ ...p, shift_id: e.target.value }))}
              className="w-full h-10 rounded-xl border border-border bg-card text-text px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">No Shift</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time}-{s.end_time})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Responsibilities</label>
            <textarea value={formData.responsibilities} onChange={(e) => setFormData(p => ({ ...p, responsibilities: e.target.value }))}
              rows={3} className="w-full rounded-xl border border-border bg-card text-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveEmployee} disabled={saving || !formData.name.trim()}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : editEmp ? 'Update' : 'Add'}
            </Button>
            <Button variant="outline" onClick={() => { setEmpOpen(false); setEditEmp(null); }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
