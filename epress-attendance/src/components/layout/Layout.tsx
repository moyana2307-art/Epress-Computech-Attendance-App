import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0B1120] relative">
      <div className="hidden dark:block ambient-glow top-0 left-0 w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
      <div className="hidden dark:block ambient-glow bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] translate-x-1/3 translate-y-1/3 animate-float-slower" />
      <div className="fixed inset-0 pointer-events-none z-0 dark:opacity-100 opacity-0 bg-noise" />
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300 relative z-10">
        <Topbar />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
