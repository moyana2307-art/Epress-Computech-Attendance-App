import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/shared/DataTable';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import type { Shift } from '@/lib/types';

const departments = ['Printing', 'EcoCash', 'Customer Service', 'General'];

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', start_time: '08:00', end_time: '17:00', description: '', responsibilities: '', department: 'Printing' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.shifts.list();
        if (!cancelled) setShifts(data);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const shift = await api.shifts.create(form);
      setShifts((prev) => [...prev, shift]);
      setModalOpen(false);
      setForm({ name: '', start_time: '08:00', end_time: '17:00', description: '', responsibilities: '', department: 'Printing' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Shift Management</h1>
          <p className="text-sm text-text-secondary mt-1">{shifts.length} active shifts</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add Shift
        </Button>
      </div>

      <DataTable
        columns={[
          { key: 'name', header: 'Shift Name', sortable: true },
          { key: 'start_time', header: 'Start', render: (r) => <span className="font-mono text-success">{r.start_time}</span> },
          { key: 'end_time', header: 'End', render: (r) => <span className="font-mono text-danger">{r.end_time}</span> },
          { key: 'assigned_employee', header: 'Assigned To', render: (r) => r.assigned_employee ? <Badge variant="success">{r.assigned_employee}</Badge> : <span className="text-text-secondary text-sm">Unassigned</span> },
          { key: 'department', header: 'Department' },
        ]}
        data={shifts}
        keyExtractor={(r) => r.id}
        emptyMessage="No shifts created yet"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Shift">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="shift-name" label="Shift Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Morning Shift" />
          <div className="grid grid-cols-2 gap-4">
            <Input id="shift-start" label="Start Time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            <Input id="shift-end" label="End Time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-xl border border-border bg-card text-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              placeholder="Shift description..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Responsibilities</label>
            <textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} rows={2}
              className="w-full rounded-xl border border-border bg-card text-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              placeholder="e.g. Printing Services, EcoCash..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Department</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full h-10 rounded-xl border border-border bg-card text-text px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save Shift</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
