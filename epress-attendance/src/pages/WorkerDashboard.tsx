import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  UserCheck, UserX, Clock, AlertTriangle, CalendarCheck,
  TrendingUp, LogIn, LogOut, Calendar, UserCircle,
  Briefcase, Bell, ArrowRight, Timer,
  Building2, CheckCircle2, XCircle, Users, Hourglass,
  Printer, DollarSign, Banknote, Smartphone, ShieldCheck, Key,
  Loader2, ChevronRight, RefreshCw, Settings,
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
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-lighter">
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
                  className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
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
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white backdrop-blur-sm border border-white/10">
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
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [revCashUp, setRevCashUp] = useState('');
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const myStatus: EmployeeStatus | undefined = data?.employees.find(
    e => e.employee.name.toLowerCase() === user?.name?.toLowerCase()
  );
  const isOnDuty = !!myStatus?.schedule || !!myStatus?.attendance?.check_in;
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
      const r = await api.worker.checkout(user.name, {
        cashUpAmount: parseFloat(revCashUp) || 0,
      });
      setActionMsg({ text: r.message, type: 'success' });
      setRevenueOpen(false);
      setRevCashUp('');
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
      color: data?.businessOpen ? 'bg-linear-to-br from-success to-emerald-700' : 'bg-linear-to-br from-danger to-red-700',
      subtitle: data?.businessHours ? `${data.businessHours.opening_time} - ${data.businessHours.closing_time}` : undefined,
    },
    {
      icon: <Users className="w-5 h-5 text-white" />,
      label: 'On Duty',
      value: data?.employees.map(e => e.employee.name).join(', ') || 'Nobody',
      color: 'bg-linear-to-br from-primary to-secondary',
    },
    {
      icon: <Clock className="w-5 h-5 text-white" />,
      label: 'My Status',
      value: myStatus?.schedule ? (myStatus?.attendance?.check_in ? 'Checked In' : 'Not Checked In') : 'Off Duty',
      color: isOnDuty ? 'bg-linear-to-br from-secondary to-primary' : 'bg-linear-to-br from-gray-400 to-gray-500',
    },
    {
      icon: <Hourglass className="w-5 h-5 text-white" />,
      label: 'My Hours Today',
      value: myStatus?.todayMinutes ? `${Math.floor(myStatus.todayMinutes / 60)}h ${myStatus.todayMinutes % 60}m` : '0h 0m',
      color: 'bg-linear-to-br from-primary to-primary-dark',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      label: 'Check-In',
      value: myStatus?.attendance?.check_in || '--',
      color: myStatus?.attendance?.check_in ? 'bg-linear-to-br from-success to-emerald-700' : 'bg-linear-to-br from-gray-400 to-gray-500',
      subtitle: myStatus?.attendance?.check_in ? myStatus.attendance.status : undefined,
    },
    {
      icon: <LogOut className="w-5 h-5 text-white" />,
      label: 'Check-Out',
      value: myStatus?.attendance?.check_out || '--',
      color: myStatus?.attendance?.check_out ? 'bg-linear-to-br from-warning to-amber-700' : 'bg-linear-to-br from-gray-400 to-gray-500',
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
      label: 'Late',
      value: myStatus?.attendance?.late_minutes ? `${myStatus.attendance.late_minutes}m` : '0m',
      color: myStatus?.attendance?.late_minutes ? 'bg-linear-to-br from-warning to-amber-700' : 'bg-linear-to-br from-success to-emerald-700',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-br from-primary via-[#0F2E6E] to-primary-dark rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden dark:shadow-[0_0_40px_rgba(16,54,125,0.15)]"
      >
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <pattern id="wg" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#wg)"/>
          </svg>
        </div>
        <div className="dark:absolute dark:inset-0 dark:opacity-[0.02] dark:bg-noise" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float-slow" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 animate-float-slower" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
              <p className="text-white/70 text-sm">{getGreeting()}, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl lg:text-3xl font-bold font-heading tracking-tight">Epress Attendance</h1>
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
          <div className="flex items-center gap-2">
            {isOnDuty && myStatus?.schedule && (
              <div className="flex flex-col items-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <span className="text-[10px] text-white/60 uppercase tracking-wider">Shift Ends</span>
                <CountdownTimer targetTime={myStatus.schedule.end_time} />
              </div>
            )}
            {!myStatus?.attendance?.check_in && (
              <Button
                onClick={handleCheckin}
                disabled={!myStatus?.checkInAvailable}
                variant="default"
                size="lg"
                className="min-w-[120px] sm:min-w-[140px] bg-white text-primary hover:bg-white/90 shadow-lg shadow-white/10"
              >
                <Key className="w-4 h-4" /> <span className="hidden xs:inline">Check In</span>
              </Button>
            )}
            {myStatus?.attendance?.check_in && !myStatus?.attendance?.check_out && (
              <Button
                onClick={() => setRevenueOpen(true)}
                disabled={!myStatus?.checkOutAvailable}
                variant="secondary"
                size="lg"
                className="min-w-[120px] sm:min-w-[140px] bg-white/15 text-white hover:bg-white/25 border-0"
              >
                <LogOut className="w-4 h-4" /> <span className="hidden xs:inline">Check Out</span>
              </Button>
            )}
            <Link to="/leaves">
              <Button variant="ghost" size="sm" className="bg-white/10 text-white hover:bg-white/20 border-0">
                <CalendarCheck className="w-4 h-4" /> <span className="hidden sm:inline">Leave</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {actionMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'px-4 py-3 rounded-xl text-sm flex items-center gap-2',
            actionMsg.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
          )}
        >
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {actionMsg.text}
          <button onClick={() => setActionMsg(null)} className="ml-auto underline opacity-60 hover:opacity-100">Dismiss</button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCards.map((card, i) => (
          <StatsCard key={card.label} {...card} delay={i * 0.04} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Assignments</CardTitle>
            <Badge variant="primary">{data?.departmentAssignments?.length || 0} depts</Badge>
          </CardHeader>
          <CardContent>
            {data?.departmentAssignments?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.departmentAssignments.map((d, i: number) => (
                  <motion.div
                    key={d.department}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl border border-border-light/60 dark:border-border/50 bg-card card-shadow card-shadow-hover transition-all duration-200 dark:hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/15">
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

        <div className="space-y-4">
          {isOnDuty && myStatus && (
            <Card>
              <CardHeader>
                <CardTitle>My Shift</CardTitle>
                <Badge variant={myStatus.attendance?.check_in ? 'success' : 'warning'}>
                  {myStatus.attendance?.check_in ? 'Active' : 'Pending'}
                </Badge>
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
            <CardContent className="space-y-2">
              {[
                {
                  icon: Key,
                  label: 'Check In',
                  desc: 'OTP verification',
                  gradient: 'from-primary to-primary-dark',
                  onClick: !myStatus?.attendance?.check_in ? handleCheckin : undefined,
                  disabled: !myStatus?.checkInAvailable || !!myStatus?.attendance?.check_in,
                  condition: !myStatus?.attendance?.check_in,
                },
                {
                  icon: LogOut,
                  label: 'Check Out',
                  desc: 'End your shift',
                  gradient: 'from-secondary to-primary',
                  onClick: myStatus?.attendance?.check_in && !myStatus?.attendance?.check_out ? () => setRevenueOpen(true) : undefined,
                  disabled: !myStatus?.checkOutAvailable || !myStatus?.attendance?.check_in || !!myStatus?.attendance?.check_out,
                  condition: myStatus?.attendance?.check_in && !myStatus?.attendance?.check_out,
                },
                {
                  icon: CalendarCheck,
                  label: 'Leave',
                  desc: 'Request time off',
                  gradient: 'from-warning to-amber-700',
                  href: '/leaves',
                },
                {
                  icon: UserCircle,
                  label: 'Profile',
                  desc: 'Manage your account',
                  gradient: 'from-success to-emerald-700',
                  href: '/profile',
                },
                {
                  icon: Settings,
                  label: 'Settings',
                  desc: 'App preferences',
                  gradient: 'from-gray-500 to-primary',
                  href: '/settings',
                },
              ].filter(a => a.condition !== false).map((action, i) => {
                const Comp = action.href ? Link : 'button';
                return (
                  <Comp
                    key={i}
                    to={action.href || '#'}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      'group flex items-center gap-3 p-3 rounded-xl border border-border-light/60 dark:border-border/50 bg-card card-shadow card-shadow-hover transition-all duration-200 hover:-translate-y-0.5 dark:hover:border-primary/30',
                      action.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <div className={cn(
                      'p-2.5 rounded-lg shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
                      'bg-linear-to-br ' + action.gradient + ' text-white shadow-sm'
                    )}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{action.label}</p>
                      <p className="text-xs text-text-secondary">{action.desc}</p>
                    </div>
                    {action.href && (
                      <ChevronRight className="w-4 h-4 text-text-secondary/30 group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5" />
                    )}
                  </Comp>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <Link to="/attendance" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data?.todayRecords?.length ? (
              <>
                <div className="sm:hidden divide-y divide-border-light/60">
                  {data.todayRecords.map((row) => (
                    <div key={row.id} className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text">{row.employee_name}</span>
                        <Badge variant={row.status === 'Late' ? 'warning' : 'success'}>{row.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span>In: {row.check_in || '--'}</span>
                        <span>Out: {row.check_out || '--'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-xs text-success font-medium">{`$${(row.cash_up_amount || 0).toFixed(2)}`}</span>
                          <span className="text-[10px] text-text-secondary truncate ml-2">{row.note || row.shift_name || ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-light text-left">
                          <th className="px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Employee</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Check In</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Check Out</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Cash Up</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light/60">
                        {data.todayRecords.map((row, i) => (
                          <motion.tr key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="hover:bg-primary-lighter/40 dark:hover:bg-card-hover/50 transition-colors active:bg-primary-lighter/60">
                            <td className="px-3 py-3 text-sm font-medium text-text">{row.employee_name}</td>
                            <td className="px-3 py-3 text-sm text-text">{row.check_in || '--'}</td>
                            <td className="px-3 py-3 text-sm text-text">{row.check_out || '--'}</td>
                            <td className="px-3 py-3 text-sm text-success font-medium">{`$${(row.cash_up_amount || 0).toFixed(2)}`}</td>
                          <td className="px-3 py-3">
                            <Badge variant={row.status === 'Late' ? 'warning' : 'success'}>{row.status}</Badge>
                          </td>
                          <td className="px-3 py-3 text-xs text-text-secondary">{row.note || (row.shift_name || '')}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No attendance records yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <Link to="/notifications" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {data?.recentActivity?.length ? (
                data.recentActivity.map((act, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-lighter/60 dark:hover:bg-card-hover transition-colors">
                    <div className={cn(
                      'p-1.5 rounded-lg',
                      act.type === 'warning' ? 'bg-warning/10' : act.type === 'error' ? 'bg-danger/10' : 'bg-primary/10'
                    )}>
                      <Bell className={cn(
                        'w-3.5 h-3.5',
                        act.type === 'warning' ? 'text-warning' : act.type === 'error' ? 'text-danger' : 'text-primary'
                      )} />
                    </div>
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
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <OTPModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        employeeName={user?.name || ''}
        onSuccess={handleOtpSuccess}
      />

      <Modal open={revenueOpen} onClose={() => { if (!checkingOut) setRevenueOpen(false); }} title="Check-Out Revenue">
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Banknote className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm font-medium text-text">Enter cash-up amount</p>
              <p className="text-xs text-text-secondary">Record total cash collected during your shift</p>
            </div>
          </div>
          <Input id="rev-cashup" label="Cash Up Amount ($)" type="number" min="0" step="0.01"
            value={revCashUp} onChange={(e) => setRevCashUp(e.target.value)} placeholder="0.00" />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCheckout} disabled={checkingOut} className="flex-1">
              {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              {checkingOut ? 'Checking out...' : 'Confirm Check Out'}
            </Button>
            <Button variant="outline" onClick={() => { if (!checkingOut) setRevenueOpen(false); }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
