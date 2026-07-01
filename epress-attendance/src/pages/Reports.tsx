import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CustomLineChart, CustomBarChart, CustomAreaChart } from '@/components/charts';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';

const monthlyTrend = [
  { name: 'Jan', attendance: 95, late: 5 },
  { name: 'Feb', attendance: 92, late: 8 },
  { name: 'Mar', attendance: 88, late: 12 },
  { name: 'Apr', attendance: 96, late: 4 },
  { name: 'May', attendance: 91, late: 9 },
  { name: 'Jun', attendance: 94, late: 6 },
];

const deptPerformance = [
  { name: 'Engineering', present: 95, late: 3, absent: 2 },
  { name: 'Design', present: 88, late: 7, absent: 5 },
  { name: 'Marketing', present: 92, late: 5, absent: 3 },
  { name: 'Operations', present: 85, late: 8, absent: 7 },
  { name: 'HR', present: 98, late: 1, absent: 1 },
  { name: 'Finance', present: 90, late: 6, absent: 4 },
];

const recentReports = [
  { id: 1, name: 'Monthly Report - June 2026', date: '2026-06-30', type: 'Monthly', status: 'Generated' },
  { id: 2, name: 'Q2 2026 Analytics', date: '2026-06-30', type: 'Quarterly', status: 'Generated' },
  { id: 3, name: 'Department Performance', date: '2026-06-28', type: 'Custom', status: 'Pending' },
];

export default function Reports() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Reports & Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Comprehensive attendance analytics and reports</p>
        </div>
        <Button variant="default">
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomAreaChart
              data={monthlyTrend}
              areas={[
                { key: 'attendance', color: '#10367D' },
                { key: 'late', color: '#f59e0b' },
              ]}
              height={280}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomBarChart
              data={deptPerformance}
              bars={[
                { key: 'present', color: '#22C55E' },
                { key: 'late', color: '#f59e0b' },
                { key: 'absent', color: '#ef4444' },
              ]}
              height={280}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'name', header: 'Report Name', sortable: true },
              { key: 'date', header: 'Date', sortable: true },
              { key: 'type', header: 'Type', render: (r) => <Badge variant="primary">{r.type}</Badge> },
              { key: 'status', header: 'Status', render: (r) => (
                <Badge variant={r.status === 'Generated' ? 'success' : 'warning'}>{r.status}</Badge>
              )},
              { key: 'actions', header: '', render: () => (
                <Button size="sm" variant="ghost"><Download className="w-3 h-3" /> Download</Button>
              )},
            ]}
            data={recentReports}
            keyExtractor={(r) => r.id}
            emptyMessage="No reports generated yet"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
