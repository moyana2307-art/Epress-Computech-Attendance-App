import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import InstallApp from '@/components/shared/InstallApp';
import DeviceNotifications from '@/components/shared/DeviceNotifications';
import CheckInBar from '@/components/shared/CheckInBar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] relative">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300 relative z-10">
        <Topbar />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <CheckInBar />
      <InstallApp />
      <DeviceNotifications />
    </div>
  );
}
