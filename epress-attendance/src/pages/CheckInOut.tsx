import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, LogOut, Clock, Loader2, DollarSign, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function CheckInOut() {
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRevenue, setShowRevenue] = useState(false);
  const [cashUpAmount, setCashUpAmount] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      setMessage({ text: 'Please enter your name.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const extra = showRevenue
        ? { cashUpAmount: parseFloat(cashUpAmount) || 0 }
        : undefined;
      const result = await api.attendance.toggle(employeeName, extra);

      if (result.requiresRevenue) {
        setShowRevenue(true);
        setMessage({ text: 'Enter the amounts collected today:', type: 'info' });
        setLoading(false);
        return;
      }

      setMessage({ text: result.message, type: 'success' });
      setEmployeeName('');
      setShowRevenue(false);
      setCashUpAmount('');
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">Check In / Check Out</h1>
        <p className="text-sm text-text-secondary mt-1">Record your attendance for today</p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-card border border-border">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold text-text">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleToggle} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <input
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Enter your full name..."
                disabled={showRevenue}
                className="w-full max-w-sm h-12 text-center text-lg rounded-xl border border-border bg-card text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-50"
              />

              {showRevenue && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full max-w-sm space-y-4 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Banknote className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-text">Cash Up Amount</span>
                    </div>
                    <Input
                      id="cashup"
                      label="Total Amount ($)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={cashUpAmount}
                      onChange={(e) => setCashUpAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {message && (
              <div className={cn(
                'text-center text-sm px-4 py-3 rounded-xl',
                message.type === 'success' && 'bg-success/10 text-success',
                message.type === 'error' && 'bg-danger/10 text-danger',
                message.type === 'info' && 'bg-primary/10 text-primary',
              )}>
                {message.text}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button type="submit" size="xl" disabled={loading} className="min-w-[200px]">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {loading ? 'Processing...' : showRevenue ? 'Confirm Check Out' : 'Check In / Out'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: LogIn, label: 'Check In', desc: 'Record your arrival time', color: 'from-success to-primary-dark' },
          { icon: LogOut, label: 'Check Out', desc: 'Record your departure time', color: 'from-warning to-primary-dark' },
        ].map((item) => (
          <div key={item.label} className="p-5 rounded-2xl bg-card border border-border hover:shadow-md transition-all">
            <div className={cn('p-3 rounded-xl bg-linear-to-br w-fit mb-3', item.color)}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-text">{item.label}</h3>
            <p className="text-sm text-text-secondary">{item.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
