import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import type { Department } from '@/lib/types';

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', head: '' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.departments.list();
        if (!cancelled) setDepartments(data);
      } catch { /* empty */ } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dept = await api.departments.create(form);
      setDepartments((prev) => [...prev, dept]);
      setModalOpen(false);
      setForm({ name: '', head: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Departments</h1>
          <p className="text-sm text-text-secondary mt-1">{departments.length} departments</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, i) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-card border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all group"
          >
            <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-text">{dept.name}</h3>
            <p className="text-sm text-text-secondary mt-1">Head: {dept.head || 'Not assigned'}</p>
            <div className="flex items-center gap-2 mt-4 text-sm text-text-secondary">
              <Users className="w-4 h-4" />
              <span>{dept.employee_count || 0} employees</span>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Department">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input id="dept-name" label="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="dept-head" label="Department Head" value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save Department</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
