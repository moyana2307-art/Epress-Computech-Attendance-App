import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  UserCheck, UserX, Clock, AlertTriangle, CalendarCheck,
  TrendingUp, LogIn, LogOut, Calendar, UserCircle,
  Briefcase, Bell, ArrowRight, Timer,
  Building2, CheckCircle2, XCircle, Users, Hourglass,
  Printer, DollarSign, Smartphone, ShieldCheck, Key,
  Loader2, ChevronRight, RefreshCw,
} from 'lucide-react';
import { StatsCard } from '@/components/shared/StatsCard';
import { DashboardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomLineChart } from '@/components/charts';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getGreeting, cn } from '@/lib/utils';
import type { WorkerDashboardData, EmployeeStatus, DeptAssignment } from '@/lib/types';

function useWorkerDashboard() {
  const [data, setData] = useState<WorkerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api.worker.dashboard();
      setData(d);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  return { data, loading, refresh: load };
}

function CountdownTimer({ targetTime }: { targetTime: string | null }) {
  const [display, setDisplay] = useState('--:--:--');
  useEffect(() => {
    if (!targetTime) { setDisplay('--:--:--'); return; }
    const [h, m] = targetTime.split(':').map(Number);
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(h, m, 0, 0);
      const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const hh = Math.floor(diff / 3600);
      const mm = Math.floor((diff % 3600) / 60);
      const ss = diff % 60;
      setDisplay(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [targetTime]);
  return <span className="font-mono font-bold text-2xl tracking-wider">{display}</span>;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <span className="text-xl font-bold text-white tabular-nums drop-shadow-md">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </span>
  );
}

function OTPModal({ open, onClose, employeeName, onSuccess }: {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [expiresIn, setExpiresIn] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!open) { setStep('request'); setOtp(['', '', '', '', '', '']); setMessage(''); setError(''); } }, [open]);

  useEffect(() => {
    if (step !== 'verify' || expiresIn <= 0) return;
    const t = setInterval(() => setExpiresIn(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [step, expiresIn]);

  const handleRequest = async () => {
    setLoading(true); setError('');
    try {
      const r = await api.worker.requestOtp(employeeName);
      setMessage(r.message);
      setExpiresIn(r.expiresIn);
      setStep('verify');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true); setError(''); setOtp(['', '', '', '', '', '']);
    try {
      const r = await api.worker.requestOtp(employeeName);
      setMessage(r.message);
      setExpiresIn(r.expiresIn);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setLoading(true); setError('');
    try {
      await api.worker.verifyOtp(employeeName, code);
      onSuccess();
      onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const otpRefs: (HTMLInputElement | null)[] = [];

  return (
    <Modal open={open} onClose={onClose} title="Secure Check-In Verification">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <div>
            <p className="text-sm font-medium text-text">6-digit OTP verification required</p>
            <p className="text-xs text-text-secondary">A code has been sent to your registered email</p>
          </div>
        </div>

        {step === 'request' ? (
          <Button onClick={handleRequest} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            {loading ? 'Sending...' : 'Send OTP Code'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '');
                    const next = [...otp];
                    next[i] = v;
                    setOtp(next);
                    if (v && i < 5) otpRefs[i + 1]?.focus();
                  }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) otpRefs[i - 1]?.focus(); }}
                  className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              ))}
            </div>

            <div className="text-center text-sm text-text-secondary">
              {expiresIn > 0 ? (
                <span>Code expires in <span className="font-semibold text-primary">{expiresIn}s</span></span>
              ) : (
                <span className="text-danger">Code expired</span>
              )}
            </div>

            {message && <p className="text-xs text-text-secondary text-center">{message}</p>}

            {error && <div className="text-sm text-danger bg-danger/5 rounded-xl px-4 py-2.5">{error}</div>}

            <div className="flex gap-3">
              <Button onClick={handleVerify} disabled={loading || otp.join('').length !== 6} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify & Check In'}
              </Button>
              <Button variant="outline" onClick={handleResend} disabled={loading}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DeptBadge({ dept }: { dept: string }) {
  const icons: Record<string, React.ReactNode> = {
    Printing: <Printer className="w-3.5 h-3.5" />,
    EcoCash: <DollarSign className="w-3.5 h-3.5" />,
  };
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 text-white backdrop-blur-sm">
      {icons[dept] || <Briefcase className="w-3.5 h-3.5" />}
      {dept}
    </div>
  );
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { data, loading, refresh } = useWorkerDashboard();
  const [otpOpen, setOtpOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const myStatus: EmployeeStatus | undefined = data?.employees.find(
    e => e.employee.name.toLowerCase() === user?.name?.toLowerCase()
  );
  const isOnDuty = !!myStatus;
  const myDeptAssignment = data?.departmentAssignments.find(
    d => d.employee_name.toLowerCase() === user?.name?.toLowerCase()
  );

  const handleCheckin = () => {
    if (!myStatus?.checkInAvailable) return;
    setOtpOpen(true);
  };

  const handleCheckout = async () => {
    if (!myStatus?.checkOutAvailable || !user) return;
    setCheckingOut(true);
    setActionMsg(null);
    try {
      const r = await api.worker.checkout(user.name);
      setActionMsg({ text: r.message, type: 'success' });
      await refresh();
    } catch (e: any) {
      setActionMsg({ text: e.message, type: 'error' });
    }
    finally { setCheckingOut(false); }
  };

  const handleOtpSuccess = async () => {
    setActionMsg({ text: 'Checked in successfully!', type: 'success' });
    await refresh();
  };

  if (loading) return <DashboardSkeleton />;

  const statCards = [
    {
      icon: <Building2 className="w-5 h-5 text-white" />,
      label: 'Status',
      value: data?.businessOpen ? 'Open' : 'Closed',
      color: data?.businessOpen ? 'bg-gradient-to-br from-success to-emerald-600' : 'bg-gradient-to-br from-danger to-red-600',
      subtitle: data?.businessHours ? `${data.businessHours.opening_time} - ${data.businessHours.closing_time}` : undefined,
    },
    {
      icon: <Users className="w-5 h-5 text-white" />,
      label: 'On Duty',
      value: data?.employees.map(e => e.employee.name).join(', ') || 'Nobody',
      color: 'bg-gradient-to-br from-primary to-primary-dark',
    },
    {
      icon: <Clock className="w-5 h-5 text-white" />,
      label: 'My Status',
      value: isOnDuty ? (myStatus?.attendance?.check_in ? 'Checked In' : 'Not Checked In') : 'Off Duty',
      color: isOnDuty ? 'bg-gradient-to-br from-secondary to-blue-600' : 'bg-gradient-to-br from-muted to-gray-500',
    },
    {
      icon: <Hourglass className="w-5 h-5 text-white" />,
      label: 'My Hours Today',
      value: myStatus?.todayMinutes ? `${Math.floor(myStatus.todayMinutes / 60)}h ${myStatus.todayMinutes % 60}m` : '0h 0m',
      color: 'bg-gradient-to-br from-purple-500 to-purple-700',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      label: 'Check-In',
      value: myStatus?.attendance?.check_in || '--',
      color: myStatus?.attendance?.check_in ? 'bg-gradient-to-br from-success to-emerald-600' : 'bg-gradient-to-br from-muted to-gray-500',
      subtitle: myStatus?.attendance?.check_in ? myStatus.attendance.status : undefined,
    },
    {
      icon: <LogOut className="w-5 h-5 text-white" />,
      label: 'Check-Out',
      value: myStatus?.attendance?.check_out || '--',
      color: myStatus?.attendance?.check_out ? 'bg-gradient-to-br from-warning to-orange-600' : 'bg-gradient-to-br from-muted to-gray-500',
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
      label: 'Late',
      value: myStatus?.attendance?.late_minutes ? `${myStatus.attendance.late_minutes}m` : '0m',
      color: myStatus?.attendance?.late_minutes ? 'bg-gradient-to-br from-warning to-amber-600' : 'bg-gradient-to-br from-success to-emerald-600',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary via-primary-dark to-primary rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <pattern id="wg" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#wg)"/>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float-slow" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 animate-float-slower" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm mb-1">{getGreeting()}, {user?.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl lg:text-3xl font-bold font-heading">Epress Attendance</h1>
              <Badge variant={data?.businessOpen ? 'success' : 'danger'}>
                {data?.businessOpen ? '● Open' : '● Closed'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <LiveClock />
              <span className="text-white/40">·</span>
              {data?.departmentAssignments.map(d => (
                <DeptBadge key={d.department} dept={d.department} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isOnDuty && myStatus?.schedule && (
              <div className="flex flex-col items-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <span className="text-[10px] text-white/60 uppercase tracking-wider">Shift Ends</span>
                <CountdownTimer targetTime={myStatus.schedule.end_time} />
              </div>
            )}
            {isOnDuty && !myStatus?.attendance?.check_in && (
              <Button
                onClick={handleCheckin}
                disabled={!myStatus?.checkInAvailable}
                variant="default"
                size="lg"
                className="min-w-[140px] bg-white text-primary hover:bg-white/90"
              >
                <Key className="w-4 h-4" /> Check In
              </Button>
            )}
            {isOnDuty && myStatus?.attendance?.check_in && !myStatus?.attendance?.check_out && (
              <Button
                onClick={handleCheckout}
                disabled={!myStatus?.checkOutAvailable || checkingOut}
                variant="secondary"
                size="lg"
                className="min-w-[140px] bg-white/20 text-white hover:bg-white/30 border-0"
              >
                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {checkingOut ? '...' : 'Check Out'}
              </Button>
            )}
            <Link to="/leaves">
              <Button variant="secondary" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-0">
                <CalendarCheck className="w-4 h-4" /> Leave
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {actionMsg && (
        <div className={cn(
          'px-4 py-3 rounded-xl text-sm',
          actionMsg.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        )}>
          {actionMsg.text}
          <button onClick={() => setActionMsg(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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
            {data?.departmentAssignments?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.departmentAssignments.map(d => (
                  <motion.div
                    key={d.department}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-border bg-background/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {d.department === 'Printing' ? <Printer className="w-5 h-5 text-primary" /> :
                         d.department === 'EcoCash' ? <DollarSign className="w-5 h-5 text-primary" /> :
                         <Smartphone className="w-5 h-5 text-primary" />}
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
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No departments currently assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {isOnDuty && myStatus && (
            <Card>
              <CardHeader>
                <CardTitle>My Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar name={user?.name || ''} size="lg" />
                  <div>
                    <p className="text-lg font-bold text-text font-heading">{user?.name}</p>
                    <p className="text-xs text-text-secondary">
                      {myStatus.schedule?.department} · {myStatus.schedule?.start_time} - {myStatus.schedule?.end_time}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</p>
                  <div className="flex gap-2">
                    <Badge variant="success">{myStatus.attendance?.check_in ? 'Checked In' : 'Pending'}</Badge>
                    {myStatus.attendance?.check_in && !myStatus.attendance?.check_out && (
                      <Badge variant="warning">On Duty</Badge>
                    )}
                    {myStatus.attendance?.check_out && <Badge variant="default">Done</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: Key,
                    label: 'Check In (OTP)',
                    color: 'bg-primary/10 text-primary',
                    onClick: isOnDuty && !myStatus?.attendance?.check_in ? handleCheckin : undefined,
                    disabled: !isOnDuty || !myStatus?.checkInAvailable || !!myStatus?.attendance?.check_in,
                    condition: !myStatus?.attendance?.check_in,
                  },
                  {
                    icon: LogOut,
                    label: 'Check Out',
                    color: 'bg-warning/10 text-warning',
                    onClick: isOnDuty && myStatus?.attendance?.check_in && !myStatus?.attendance?.check_out ? handleCheckout : undefined,
                    disabled: !isOnDuty || !myStatus?.checkOutAvailable || !myStatus?.attendance?.check_in || !!myStatus?.attendance?.check_out,
                    condition: myStatus?.attendance?.check_in && !myStatus?.attendance?.check_out,
                  },
                  { icon: CalendarCheck, label: 'Leave', color: 'bg-warning/10 text-warning', href: '/leaves' },
                  { icon: UserCircle, label: 'Profile', color: 'bg-success/10 text-success', href: '/profile' },
                ].filter(a => a.condition !== false).map((action, i) => {
                  const Comp = action.href ? Link : 'button';
                  return (
                    <Comp
                      key={i}
                      to={action.href || '#'}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border border-border-light hover:bg-background transition-all duration-200 hover:shadow-sm',
                        action.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className={`p-2.5 rounded-xl ${action.color}`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-text-secondary">{action.label}</span>
                    </Comp>
                  );
                })}
              </div>
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
            {data?.todayRecords?.length ? (
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
                    {data.todayRecords.map((row, i) => (
                      <motion.tr key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }} className="hover:bg-background/50 transition-colors">
                        <td className="px-3 py-3 text-sm font-medium text-text">{row.employee_name}</td>
                        <td className="px-3 py-3 text-sm text-text">{row.check_in || '--'}</td>
                        <td className="px-3 py-3 text-sm text-text">{row.check_out || '--'}</td>
                        <td className="px-3 py-3">
                          <Badge variant={row.status === 'Late' ? 'warning' : 'success'}>{row.status}</Badge>
                        </td>
                        <td className="px-3 py-3 text-xs text-text-secondary">{row.note || (row.shift_name || '')}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No attendance records yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <Link to="/notifications" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
            {data?.recentActivity?.length ? (
              data.recentActivity.map((act, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/50">
                  <Bell className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">{act.title}</p>
                    <p className="text-[10px] text-text-secondary truncate">{act.message}</p>
                  </div>
                  <Badge variant={act.type === 'warning' ? 'warning' : act.type === 'error' ? 'danger' : 'default'}>
                    {act.type}
                  </Badge>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 text-text-secondary">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OTPModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        employeeName={user?.name || ''}
        onSuccess={handleOtpSuccess}
      />
    </motion.div>
  );
}
