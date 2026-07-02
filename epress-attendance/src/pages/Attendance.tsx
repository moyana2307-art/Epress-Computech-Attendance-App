import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Fingerprint } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CustomBarChart } from '@/components/charts';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { DataTable } from '@/components/shared/DataTable';
import { api } from '@/lib/api';
import type { Attendance as AttendanceType } from '@/lib/types';

const weeklyChartData = [
  { name: 'Mon', Present: 42, Late: 2, Absent: 3 },
  { name: 'Tue', Present: 40, Late: 3, Absent: 5 },
  { name: 'Wed', Present: 44, Late: 1, Absent: 2 },
  { name: 'Thu', Present: 38, Late: 4, Absent: 6 },
  { name: 'Fri', Present: 43, Late: 2, Absent: 4 },
];

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.attendance.all({ date: selectedDate });
        if (!cancelled) setRecords(data);
      } catch { /* empty */ } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedDate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Attendance Records</h1>
          <p className="text-sm text-text-secondary mt-1">Track and manage employee attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-secondary" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 px-4 rounded-xl bg-card border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomBarChart
              data={weeklyChartData}
              bars={[
                { key: 'Present', color: '#22C55E' },
                { key: 'Late', color: '#f59e0b' },
                { key: 'Absent', color: '#ef4444' },
              ]}
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Present', value: records.filter((r) => r.status === 'Present').length, color: 'text-success' },
              { label: 'Late', value: records.filter((r) => r.status === 'Late').length, color: 'text-warning' },
              { label: 'Absent', value: records.filter((r) => r.status === 'Absent').length, color: 'text-danger' },
              { label: 'Checked Out', value: records.filter((r) => r.check_out).length, color: 'text-primary' },
              { label: 'Cash Up', value: `$${records.reduce((s, r) => s + (r.cash_up_amount || 0), 0).toFixed(2)}`, color: 'text-success' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {loading ? <TableSkeleton /> : (
        <DataTable
          columns={[
            { key: 'employee_name', header: 'Employee', sortable: true },
            { key: 'department', header: 'Department', sortable: true },
            { key: 'date', header: 'Date', sortable: true },
            { key: 'check_in', header: 'Check In', render: (r) => <span className="font-mono text-success">{r.check_in || '---'}</span> },
            { key: 'check_out', header: 'Check Out', render: (r) => <span className="font-mono text-warning">{r.check_out || '---'}</span> },
            { key: 'status', header: 'Status', render: (r) => (
              <Badge variant={r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'danger'}>
                {r.status}
              </Badge>
            )},
            { key: 'cash_up_amount', header: 'Cash Up', render: (r) => <span className="text-success font-medium">$${(r.cash_up_amount || 0).toFixed(2)}</span> },
          ]}
          data={records}
          keyExtractor={(r) => r.id}
          emptyMessage="No attendance records for this date"
        />
      )}
    </motion.div>
  );
}
