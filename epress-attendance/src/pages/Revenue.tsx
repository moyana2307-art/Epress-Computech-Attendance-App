import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, CalendarDays, ChevronDown, ArrowLeft, Loader2, User } from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { MonthlyRevenue, EmployeeRevenueDetail, Employee } from '@/lib/types';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Revenue() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<MonthlyRevenue | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRevenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(false);
  const [myEmployeeId, setMyEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin && user?.name) {
      api.employees.list().then(emps => {
        const match = emps.find(e => e.name.toLowerCase() === user.name.toLowerCase());
        if (match) setMyEmployeeId(match.id);
      }).catch(() => {});
    }
  }, [isAdmin, user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: { month: string; year: string; employee_id?: string } = {
        month: String(month), year: String(year),
      };
      if (!isAdmin && myEmployeeId) {
        params.employee_id = String(myEmployeeId);
      }
      const d = await api.revenue.monthly(params);
      setData(d);
    } catch {} finally {
      setLoading(false);
    }
  }, [month, year, isAdmin, myEmployeeId]);

  useEffect(() => { if (isAdmin || myEmployeeId) load(); }, [load, isAdmin, myEmployeeId]);

  const viewEmployee = async (empId: number) => {
    setEmpLoading(true);
    try {
      const d = await api.revenue.employee(empId, { month: String(month), year: String(year) });
      setSelectedEmp(d);
    } catch {} finally {
      setEmpLoading(false);
    }
  };

  const monthLabel = months[month - 1];
  const yearOptions = [now.getFullYear(), now.getFullYear() - 1];

  const renderMobileTable = (headers: string[], rows: { cells: (string | React.ReactNode)[]; onClick?: () => void; highlight?: boolean }[]) => (
    <div className="sm:hidden space-y-2">
      {rows.length === 0 ? (
        <p className="text-center py-8 text-sm text-text-secondary">No revenue records for this month</p>
      ) : rows.map((row, i) => (
        <div
          key={i}
          onClick={row.onClick}
          className={`p-3 rounded-xl border border-border-light/60 bg-card ${row.highlight ? 'bg-primary/5 dark:bg-primary/10 border-primary/20' : ''} ${row.onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
        >
          {headers.map((h, j) => (
            <div key={h} className="flex items-center justify-between py-0.5">
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">{h}</span>
              <span className="text-sm text-text">{row.cells[j] || '--'}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderDesktopTable = (headers: { key: string; label: string }[], rows: { cells: Record<string, React.ReactNode>; onClick?: () => void; highlight?: boolean }[]) => (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-light text-left">
            {headers.map(h => (
              <th key={h.key} className="px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light/60">
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-3 py-8 text-center text-sm text-text-secondary">No revenue records for this month</td></tr>
          ) : rows.map((row, i) => (
            <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`${row.highlight ? 'bg-primary/5 dark:bg-primary/10 font-semibold' : 'hover:bg-primary-lighter/40 dark:hover:bg-card-hover/50'} ${row.onClick ? 'cursor-pointer' : ''} transition-colors`}
              onClick={row.onClick}>
              {headers.map(h => (
                <td key={h.key} className="px-3 py-3 text-sm text-text">{row.cells[h.key]}</td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!isAdmin && !myEmployeeId && user) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h1 className="text-2xl font-bold text-text">My Revenue</h1>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">{isAdmin ? 'Revenue Records' : 'My Revenue'}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {isAdmin ? 'Track and manage employee revenue contributions' : 'View your monthly revenue contributions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-card text-text px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-card text-text px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {selectedEmp ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => setSelectedEmp(null)} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to overview
          </Button>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedEmp.employee.name} size="lg" />
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-text truncate">{selectedEmp.employee.name}</h2>
                <p className="text-sm text-text-secondary truncate">{selectedEmp.employee.department} · {selectedEmp.employee.position}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatsCard
                icon={<DollarSign className="w-5 h-5 text-white" />}
                label="Total Revenue"
                value={`$${selectedEmp.total.toFixed(2)}`}
                color="bg-linear-to-br from-success to-emerald-700"
              />
              <StatsCard
                icon={<CalendarDays className="w-5 h-5 text-white" />}
                label="Work Days"
                value={selectedEmp.records.length}
                color="bg-linear-to-br from-primary to-primary-dark"
              />
              <StatsCard
                icon={<TrendingUp className="w-5 h-5 text-white" />}
                label="Daily Average"
                value={`$${(selectedEmp.total / Math.max(selectedEmp.records.length, 1)).toFixed(2)}`}
                color="bg-linear-to-br from-secondary to-primary"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown - {monthLabel} {year}</CardTitle>
              </CardHeader>
              <CardContent>
                {empLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <>
                    {renderMobileTable(
                      ['Date', 'In', 'Out', 'Cash Up', 'Status'],
                      (selectedEmp.records.map(r => ({
                        cells: [
                          r.date,
                          r.check_in || '--',
                          r.check_out || '--',
                          <span key="amt" className="text-success font-bold">{`$${(r.cash_up_amount || 0).toFixed(2)}`}</span>,
                          <Badge key="status" variant={r.status === 'Late' ? 'warning' : 'success'} className="text-[10px]">{r.status}</Badge>,
                        ],
                        highlight: false,
                      })) as { cells: (string | React.ReactNode)[]; highlight?: boolean }[]).concat([{
                        cells: [
                          <span key="total" className="font-semibold">Total</span>,
                          '', '',
                          <span key="total-amt" className="text-success font-bold">${selectedEmp.total.toFixed(2)}</span>,
                          '',
                        ],
                        highlight: true,
                      }])
                    )}
                    {renderDesktopTable(
                      [{ key: 'date', label: 'Date' }, { key: 'in', label: 'Check In' }, { key: 'out', label: 'Check Out' }, { key: 'cash', label: 'Cash Up' }, { key: 'status', label: 'Status' }],
                      (selectedEmp.records.map(r => ({
                        cells: {
                          date: r.date,
                          in: r.check_in || '--',
                          out: r.check_out || '--',
                          cash: <span className="text-success font-bold">{`$${(r.cash_up_amount || 0).toFixed(2)}`}</span>,
                          status: <Badge variant={r.status === 'Late' ? 'warning' : 'success'}>{r.status}</Badge>,
                        } as Record<string, React.ReactNode>,
                        highlight: false,
                      })) as { cells: Record<string, React.ReactNode>; highlight?: boolean }[]).concat([{
                        cells: { date: <span className="font-semibold">Total</span>, in: '', out: '', cash: <span className="text-success font-bold">${selectedEmp.total.toFixed(2)}</span>, status: '' } as Record<string, React.ReactNode>,
                        highlight: true,
                      }])
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              icon={<DollarSign className="w-5 h-5 text-white" />}
              label={isAdmin ? 'Total Revenue' : 'Your Revenue'}
              value={data ? `$${data.total_revenue.toFixed(2)}` : '--'}
              color="bg-linear-to-br from-success to-emerald-700"
            />
            <StatsCard
              icon={<User className="w-5 h-5 text-white" />}
              label={isAdmin ? 'Active Employees' : 'Work Days'}
              value={isAdmin ? (data?.employees.length || 0) : (data?.employees[0]?.work_days || 0)}
              color="bg-linear-to-br from-primary to-primary-dark"
            />
            <StatsCard
              icon={<CalendarDays className="w-5 h-5 text-white" />}
              label="Period"
              value={`${monthLabel} ${year}`}
              color="bg-linear-to-br from-secondary to-primary"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isAdmin ? 'Employee Revenue Summary' : 'Your Revenue Summary'}</CardTitle>
              {isAdmin && <Badge variant="primary">{data?.employees.length || 0} employees</Badge>}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : isAdmin ? (
                <>
                  {renderMobileTable(
                    ['Employee', 'Dept', 'Days', 'Revenue', 'Avg'],
                    ((data?.employees || []).map(emp => ({
                      cells: [
                        <div key="name" className="flex items-center gap-2">
                          <Avatar name={emp.employee_name} size="sm" />
                          <span className="text-sm font-medium text-text">{emp.employee_name}</span>
                        </div>,
                        emp.department,
                        String(emp.work_days),
                        <span key="rev" className="text-success font-bold">${emp.total_revenue.toFixed(2)}</span>,
                        <span key="avg">${emp.avg_daily_revenue.toFixed(2)}</span>,
                      ],
                      onClick: () => viewEmployee(emp.employee_id),
                      highlight: false,
                    })) as { cells: (string | React.ReactNode)[]; onClick?: () => void; highlight?: boolean }[]).concat(data && data.employees.length > 0 ? [{
                      cells: [
                        <span key="total" className="font-semibold">Total</span>,
                        '', '',
                        <span key="rev-total" className="text-success font-bold">${data.total_revenue.toFixed(2)}</span>,
                        '',
                      ],
                      highlight: true,
                    }] : [])
                  )}
                  {renderDesktopTable(
                    [{ key: 'emp', label: 'Employee' }, { key: 'dept', label: 'Department' }, { key: 'days', label: 'Work Days' }, { key: 'rev', label: 'Total Revenue' }, { key: 'avg', label: 'Daily Avg' }, { key: 'action', label: '' }],
                    ((data?.employees || []).map(emp => ({
                      cells: {
                        emp: <div className="flex items-center gap-2">
                          <Avatar name={emp.employee_name} size="sm" />
                          <span className="text-sm font-medium text-text">{emp.employee_name}</span>
                        </div>,
                        dept: <span className="text-text-secondary">{emp.department}</span>,
                        days: String(emp.work_days),
                        rev: <span className="text-success font-bold">${emp.total_revenue.toFixed(2)}</span>,
                        avg: `$${emp.avg_daily_revenue.toFixed(2)}`,
                        action: <Button variant="ghost" size="sm" className="text-primary">View <ChevronDown className="w-3 h-3 ml-1" /></Button>,
                      } as Record<string, React.ReactNode>,
                      onClick: () => viewEmployee(emp.employee_id),
                      highlight: false,
                    })) as { cells: Record<string, React.ReactNode>; onClick?: () => void; highlight?: boolean }[]).concat(data && data.employees.length > 0 ? [{
                      cells: {
                        emp: <span className="font-semibold">Total</span>,
                        dept: '', days: '',
                        rev: <span className="text-success font-bold">${data.total_revenue.toFixed(2)}</span>,
                        avg: '', action: '',
                      } as Record<string, React.ReactNode>,
                      highlight: true,
                    }] : [])
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  {data?.employees?.[0] ? (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-success mb-2">${data.employees[0].total_revenue.toFixed(2)}</div>
                      <p className="text-sm text-text-secondary">Total revenue for {monthLabel} {year}</p>
                      <p className="text-xs text-text-secondary mt-1">{data.employees[0].work_days} work days · ${data.employees[0].avg_daily_revenue.toFixed(2)} daily average</p>
                    </div>
                  ) : (
                    <div className="text-text-secondary">
                      <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No revenue records for this month</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
