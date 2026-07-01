import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { StatsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { CustomLineChart, CustomBarChart, CustomPieChart } from '@/components/charts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { api } from '@/lib/api';

const weeklyData = [
  { name: 'Mon', present: 42, absent: 3, late: 2 },
  { name: 'Tue', present: 40, absent: 5, late: 3 },
  { name: 'Wed', present: 44, absent: 2, late: 1 },
  { name: 'Thu', present: 38, absent: 6, late: 4 },
  { name: 'Fri', present: 43, absent: 4, late: 2 },
];

const monthlyData = [
  { name: 'Jan', present: 180, absent: 20 },
  { name: 'Feb', present: 190, absent: 15 },
  { name: 'Mar', present: 175, absent: 25 },
  { name: 'Apr', present: 200, absent: 10 },
  { name: 'May', present: 185, absent: 18 },
  { name: 'Jun', present: 195, absent: 12 },
];

const deptData = [
  { name: 'Engineering', value: 35 },
  { name: 'Design', value: 15 },
  { name: 'Marketing', value: 20 },
  { name: 'Operations', value: 18 },
  { name: 'HR', value: 12 },
];

const recentActivity = [
  { name: 'Sarah Jenkins', action: 'Checked in', time: '8:45 AM', status: 'On time' },
  { name: 'Michael Chang', action: 'Checked in', time: '9:02 AM', status: 'Late' },
  { name: 'Emma Wilson', action: 'Checked out', time: '5:15 PM', status: 'On time' },
  { name: 'James Brown', action: 'Checked in', time: '8:30 AM', status: 'On time' },
  { name: 'Lisa Anderson', action: 'On leave', time: 'Sick leave', status: 'Absent' },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.dashboard.stats();
        if (!cancelled) setStats(data);
      } catch {
        // use fallback data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const statCards = useMemo(() => [
    { icon: <Users className="w-5 h-5 text-white" />, label: 'Total Employees', value: stats?.total_employees ?? 156, color: 'bg-primary', trend: { value: 12, positive: true } },
    { icon: <UserCheck className="w-5 h-5 text-white" />, label: 'Present Today', value: stats?.present_today ?? 134, color: 'bg-success', trend: { value: 8, positive: true } },
    { icon: <UserX className="w-5 h-5 text-white" />, label: 'Absent Today', value: stats?.absent_today ?? 12, color: 'bg-danger', trend: { value: 5, positive: false } },
    { icon: <CalendarCheck className="w-5 h-5 text-white" />, label: 'On Leave', value: stats?.on_leave ?? 10, color: 'bg-warning', trend: { value: 2, positive: false } },
    { icon: <AlertTriangle className="w-5 h-5 text-white" />, label: 'Late Arrivals', value: stats?.late_arrivals ?? 8, color: 'bg-warning', trend: { value: 15, positive: false } },
    { icon: <TrendingUp className="w-5 h-5 text-white" />, label: 'Attendance %', value: stats?.attendance_percentage ?? '94.2%', color: 'bg-success', trend: { value: 3, positive: true } },
  ], [stats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Overview of your attendance management system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <StatsCard key={card.label} {...card} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
              <CustomLineChart
              data={weeklyData}
              lines={[
                { key: 'present', color: '#22C55E' },
                { key: 'absent', color: '#EF4444' },
                { key: 'late', color: '#F59E0B' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomPieChart data={deptData} height={280} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomBarChart
              data={monthlyData}
              bars={[
                { key: 'present', color: '#10367D' },
                { key: 'absent', color: '#EF4444' },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((act, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <Avatar name={act.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{act.name}</p>
                  <p className="text-xs text-text-secondary">{act.action} · {act.time}</p>
                </div>
                <Badge variant={act.status === 'On time' ? 'success' : act.status === 'Late' ? 'warning' : 'danger'}>
                  {act.status}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
