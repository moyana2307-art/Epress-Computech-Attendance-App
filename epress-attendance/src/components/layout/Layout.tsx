import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import InstallApp from '@/components/shared/InstallApp';
import DeviceNotifications from '@/components/shared/DeviceNotifications';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] relative">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300 relative z-10">
        <Topbar />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <InstallApp />
      <DeviceNotifications />
    </div>
  );
}
