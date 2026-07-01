import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const [email, setEmail] = useState('admin@epress.com');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@epress.com', password: 'admin123', role: 'admin' },
    { label: 'Acquiline', email: 'acquiline@epress.com', password: 'acquiline123', role: 'Morning' },
    { label: 'Pride', email: 'pride@epress.com', password: 'pride123', role: 'Evening' },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary-dark to-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-white/8 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-secondary/15 blur-3xl animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/3 blur-[120px]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-white text-center px-12"
        >
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/10">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3 font-heading tracking-tight">Epress Attendance</h1>
          <p className="text-lg text-white/60 max-w-md mx-auto">
            Printing &amp; EcoCash Service Attendance System
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {['07:00', '20:15', '10min'].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="px-4 py-3 rounded-xl bg-white/5 backdrop-blur border border-white/10"
              >
                <p className="text-2xl font-bold font-heading">{label}</p>
                <p className="text-xs text-white/50">{['Open', 'Close', 'Grace'][i]}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-border-light">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text font-heading">Welcome back</h2>
              <p className="text-text-secondary text-sm mt-1">Sign in to your account to continue</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {demoAccounts.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => { setEmail(acct.email); setPassword(acct.password); }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-text-secondary hover:text-primary font-medium"
                >
                  {acct.label} ({acct.role})
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-[38px] text-text-secondary hover:text-text transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="text-sm text-danger bg-danger/5 rounded-xl px-4 py-2.5 border border-danger/10">{error}</div>
              )}

              <Button type="submit" className="w-full h-11" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-text-secondary/60 mt-6">
            Epress Attendance — Printing &amp; EcoCash HR Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
