import { motion } from 'framer-motion';
import { UserCircle, Mail, Building2, Calendar, Shield } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  const details = [
    { icon: Mail, label: 'Email', value: user?.email || 'admin@epress.com' },
    { icon: Building2, label: 'Department', value: 'Administration' },
    { icon: Calendar, label: 'Member Since', value: 'January 2026' },
    { icon: Shield, label: 'Role', value: user?.role || 'Administrator' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Profile</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your personal information</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar name={user?.name || 'Admin'} size="xl" />
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-text">{user?.name || 'Admin User'}</h2>
              <p className="text-sm text-text-secondary">System Administrator</p>
              <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                <Badge variant="primary">Active</Badge>
                <Badge variant="primary">Admin</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {details.map((item) => (
            <div key={item.label} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">{item.label}</p>
                <p className="text-sm font-medium text-text">{item.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
