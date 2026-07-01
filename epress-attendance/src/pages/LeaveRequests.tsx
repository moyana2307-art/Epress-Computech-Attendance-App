import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import type { LeaveRequest } from '@/lib/types';

const leaveTypes = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'other', label: 'Other' },
];

export default function LeaveRequests() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ employee_name: '', type: 'sick', start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.leaves.list();
        if (!cancelled) setLeaves(data);
      } catch { /* empty */ } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const leave = await api.leaves.create(form as any);
      setLeaves((prev) => [...prev, leave]);
      setModalOpen(false);
      setForm({ employee_name: '', type: 'sick', start_date: '', end_date: '', reason: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatus = async (id: number, status: string) => {
    try {
      await api.leaves.update(id, status);
      setLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: status as any } : l));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Leave Requests</h1>
          <p className="text-sm text-text-secondary mt-1">{leaves.filter((l) => l.status === 'pending').length} pending requests</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: leaves.filter((l) => l.status === 'pending').length, color: 'bg-warning/10 text-warning', icon: Clock },
          { label: 'Approved', value: leaves.filter((l) => l.status === 'approved').length, color: 'bg-success/10 text-success', icon: CheckCircle2 },
          { label: 'Rejected', value: leaves.filter((l) => l.status === 'rejected').length, color: 'bg-danger/10 text-danger', icon: XCircle },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-card border border-border p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{item.label}</p>
              <p className="text-2xl font-bold text-text">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={[
          { key: 'employee_name', header: 'Employee', sortable: true },
          { key: 'type', header: 'Type', render: (r) => <Badge variant="secondary">{r.type}</Badge> },
          { key: 'start_date', header: 'Start Date', sortable: true },
          { key: 'end_date', header: 'End Date', sortable: true },
          { key: 'reason', header: 'Reason' },
          {
            key: 'status', header: 'Status', render: (r) => (
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
                  {r.status}
                </Badge>
                {r.status === 'pending' && (
                  <div className="flex gap-1">
                    <button onClick={() => handleStatus(r.id, 'approved')} className="p-1 rounded hover:bg-success/10 text-success transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                    <button onClick={() => handleStatus(r.id, 'rejected')} className="p-1 rounded hover:bg-danger/10 text-danger transition-colors"><XCircle className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ),
          },
        ]}
        data={leaves}
        keyExtractor={(r) => r.id}
        emptyMessage="No leave requests found"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Leave Request">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="leave-name" label="Employee Name" value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} required />
          <Select id="leave-type" label="Leave Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={leaveTypes} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="leave-start" label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            <Input id="leave-end" label="End Date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          </div>
          <Input id="leave-reason" label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Submit Request</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
