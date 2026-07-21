import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Mail, Building2, Calendar, Shield, Camera, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function Profile() {
  const { user, login } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const details = [
    { icon: Mail, label: 'Email', value: user?.email || 'admin@epress.com' },
    { icon: Building2, label: 'Department', value: 'Administration' },
    { icon: Calendar, label: 'Member Since', value: 'January 2026' },
    { icon: Shield, label: 'Role', value: user?.role || 'Administrator' },
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await api.auth.uploadAvatar(base64);
        // Update stored user with new avatar
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          u.avatar = base64;
          localStorage.setItem('user', JSON.stringify(u));
        }
        // Force re-render by toggling via login won't work, so just reload
        window.location.reload();
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Profile</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your personal information</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <Avatar src={user?.avatar} name={user?.name || 'Admin'} size="xl" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
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
