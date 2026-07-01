import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="ambient-glow top-0 left-0 w-[500px] h-[500px] rounded-full bg-secondary/5 dark:bg-secondary/8 blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-float-slow" />
      <div className="ambient-glow bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/3 dark:bg-primary/10 blur-[150px] translate-x-1/3 translate-y-1/3 animate-float-slower" />
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
