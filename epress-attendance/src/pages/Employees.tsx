import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, Phone, Building2, MoreHorizontal, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Employee } from '@/lib/types';

const departments = ['Engineering', 'Design', 'Marketing', 'Operations', 'HR', 'Finance'];

export default function Employees() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: 'Engineering', position: '', phone: '' });
  const [checkingIn, setCheckingIn] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.employees.list();
        if (!cancelled) setEmployees(data);
      } catch { /* use empty */ } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emp = await api.employees.create(form);
      setEmployees((prev) => [...prev, emp]);
      setModalOpen(false);
      setForm({ name: '', email: '', department: 'Engineering', position: '', phone: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdminCheckin = async (empId: number) => {
    setCheckingIn(empId);
    try {
      const result = await api.attendance.adminCheckin(empId);
      alert(result.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Employees</h1>
          <p className="text-sm text-text-secondary mt-1">{employees.length} total employees</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full h-10 pl-4 pr-4 rounded-xl bg-card border border-border text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-10 px-4 rounded-xl bg-card border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No employees found"
          description={search || deptFilter ? 'Try adjusting your filters' : 'Add your first employee to get started'}
          action={!search && !deptFilter ? <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Employee</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="group rounded-2xl bg-card border border-border p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={emp.name} size="lg" />
                  <div>
                    <h3 className="font-semibold text-text">{emp.name}</h3>
                    <p className="text-xs text-text-secondary">{emp.position || emp.department}</p>
                  </div>
                </div>
                <Badge variant={emp.status === 'active' ? 'success' : 'danger'}>
                  {emp.status}
                </Badge>
              </div>
              {isAdmin && emp.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAdminCheckin(emp.id)}
                  disabled={checkingIn === emp.id}
                  className="mt-2 w-full"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  {checkingIn === emp.id ? 'Checking in...' : 'Check In'}
                </Button>
              )}
              <div className="mt-4 space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{emp.department}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Employee">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="name" label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input id="position" label="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Select id="department" label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={departments.map((d) => ({ value: d, label: d }))} />
          <Input id="phone" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save Employee</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

function Users(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
