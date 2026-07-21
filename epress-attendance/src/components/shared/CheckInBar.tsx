import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, Key, CheckCircle2, Loader2, Banknote, X, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { EmployeeStatus, DeptAssignment } from '@/lib/types';

export default function CheckInBar() {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const [status, setStatus] = useState<EmployeeStatus | null>(null);
  const [deptName, setDeptName] = useState('');
  const [loading, setLoading] = useState(true);

  const [otpOpen, setOtpOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [revCashUp, setRevCashUp] = useState('');

  const fetchStatus = useCallback(async () => {
    if (!user?.name) return;
    try {
      const d = await api.worker.dashboard();
      const myStatus = d.employees.find(
        (e: EmployeeStatus) => e.employee.name.toLowerCase() === user.name.toLowerCase()
      );
      setStatus(myStatus || null);
      const myDept = d.departmentAssignments.find(
        (a: DeptAssignment) => a.employee_name.toLowerCase() === user.name.toLowerCase()
      );
      setDeptName(myDept?.department || '');
    } catch {} finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isEmployee || !user) return;
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => clearInterval(t);
  }, [isEmployee, user, fetchStatus]);

  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpMsg, setOtpMsg] = useState('');
  const [otpExpires, setOtpExpires] = useState(300);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!otpOpen) {
      setOtpStep('request');
      setOtpCode(['', '', '', '', '', '']);
      setOtpMsg('');
      setOtpError('');
    }
  }, [otpOpen]);

  useEffect(() => {
    if (otpStep !== 'verify' || otpExpires <= 0) return;
    const t = setInterval(() => setOtpExpires(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [otpStep, otpExpires]);

  if (!isEmployee || !user) return null;
  if (loading || !status) return null;

  const onDuty = !!status.schedule;
  const checkedIn = !!status.attendance?.check_in;
  const checkedOut = !!status.attendance?.check_out;
  const canCheckIn = status.checkInAvailable;
  const canCheckOut = status.checkOutAvailable;

  const showCheckIn = (onDuty || canCheckIn) && !checkedIn;
  const showCheckOut = checkedIn && !checkedOut;

  if (!showCheckIn && !showCheckOut) return null;

  const handleRequestOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const r = await api.worker.requestOtp(user.name);
      setOtpMsg(r.message);
      setOtpExpires(r.expiresIn);
      setOtpStep('verify');
    } catch (e: any) {
      setOtpError(e.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    setOtpError('');
    setOtpCode(['', '', '', '', '', '']);
    try {
      const r = await api.worker.requestOtp(user.name);
      setOtpMsg(r.message);
      setOtpExpires(r.expiresIn);
    } catch (e: any) {
      setOtpError(e.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) { setOtpError('Enter all 6 digits'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      await api.worker.verifyOtp(user.name, code);
      setOtpOpen(false);
      fetchStatus();
    } catch (e: any) {
      setOtpError(e.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const r = await api.worker.checkout(user.name, {
        cashUpAmount: parseFloat(revCashUp) || 0,
      });
      setCheckoutOpen(false);
      setRevCashUp('');
      fetchStatus();
    } catch {} finally {
      setCheckingOut(false);
    }
  };

  const otpRefs: (HTMLInputElement | null)[] = [];

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:pl-64"
        >
          <div className="mx-auto max-w-7xl px-4 pb-3">
            <div className="bg-white dark:bg-[#0F1629] border border-border/80 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${checkedIn ? 'bg-success animate-pulse-soft' : 'bg-warning animate-pulse-soft'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text truncate">
                      {checkedIn ? 'Checked In' : 'On Duty'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {status?.schedule?.department || deptName} · {status?.schedule?.start_time} - {status?.schedule?.end_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {checkedIn && (
                    <span className="text-xs text-text-secondary hidden sm:block">
                      {status?.attendance?.check_in}
                    </span>
                  )}
                  {showCheckIn && (
                    <Button
                      onClick={() => setOtpOpen(true)}
                      disabled={!canCheckIn}
                      size="sm"
                      className="gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" /> Check In
                    </Button>
                  )}
                  {showCheckOut && (
                    <Button
                      onClick={() => setCheckoutOpen(true)}
                      disabled={!canCheckOut}
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Check Out
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <Modal open={otpOpen} onClose={() => setOtpOpen(false)} title="Check-In Verification">
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-lighter">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm font-medium text-text">OTP verification required</p>
              <p className="text-xs text-text-secondary">A 6-digit code has been sent to your email</p>
            </div>
          </div>

          {otpStep === 'request' ? (
            <Button onClick={handleRequestOTP} disabled={otpLoading} className="w-full">
              {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              {otpLoading ? 'Sending...' : 'Send OTP Code'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {otpCode.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '');
                      const next = [...otpCode];
                      next[i] = v;
                      setOtpCode(next);
                      if (v && i < 5) otpRefs[i + 1]?.focus();
                    }}
                    onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) otpRefs[i - 1]?.focus(); }}
                    className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                ))}
              </div>

              <div className="text-center text-sm text-text-secondary">
                {otpExpires > 0 ? (
                  <span>Expires in <span className="font-semibold text-primary">{otpExpires}s</span></span>
                ) : (
                  <span className="text-danger">Code expired</span>
                )}
              </div>

              {otpMsg && <p className="text-xs text-text-secondary text-center">{otpMsg}</p>}
              {otpError && <div className="text-sm text-danger bg-danger/5 rounded-xl px-4 py-2.5">{otpError}</div>}

              <div className="flex gap-3">
                <Button onClick={handleVerifyOTP} disabled={otpLoading || otpCode.join('').length !== 6} className="flex-1">
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {otpLoading ? 'Verifying...' : 'Verify & Check In'}
                </Button>
                <Button variant="outline" onClick={handleResendOTP} disabled={otpLoading}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={checkoutOpen} onClose={() => { if (!checkingOut) setCheckoutOpen(false); }} title="Check-Out Revenue">
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Banknote className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm font-medium text-text">Record cash collected</p>
              <p className="text-xs text-text-secondary">Enter total revenue collected during your shift</p>
            </div>
          </div>
          <Input label="Cash Up Amount ($)" type="number" min="0" step="0.01"
            value={revCashUp} onChange={(e) => setRevCashUp(e.target.value)} placeholder="0.00" />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCheckout} disabled={checkingOut} className="flex-1">
              {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              {checkingOut ? 'Checking out...' : 'Confirm Check Out'}
            </Button>
            <Button variant="outline" onClick={() => { if (!checkingOut) setCheckoutOpen(false); }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
