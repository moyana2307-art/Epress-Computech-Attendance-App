import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, LogOut, Clock, Fingerprint, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function CheckInOut() {
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useState(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  });

  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      setMessage({ text: 'Please enter your name.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await api.attendance.toggle(employeeName);
      setMessage({ text: result.message, type: 'success' });
      setEmployeeName('');
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
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <Fingerprint className="w-16 h-16 text-primary" />
              </div>
              <input
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Enter your full name..."
                className="w-full max-w-sm h-12 text-center text-lg rounded-xl border border-border bg-card text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
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
                {loading ? 'Processing...' : 'Check In / Out'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: LogIn, label: 'Check In', desc: 'Record your arrival time', color: 'from-success to-emerald-600' },
          { icon: LogOut, label: 'Check Out', desc: 'Record your departure time', color: 'from-warning to-orange-600' },
        ].map((item) => (
          <div key={item.label} className="p-5 rounded-2xl bg-card border border-border hover:shadow-md transition-all">
            <div className={cn('p-3 rounded-xl bg-gradient-to-br w-fit mb-3', item.color)}>
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
