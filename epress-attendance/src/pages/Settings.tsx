import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Shield, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

const settingsSections = [
  {
    title: 'Appearance',
    items: [
      { icon: Moon, label: 'Dark Mode', description: 'Toggle dark mode for the entire application', type: 'toggle' },
    ],
  },
  {
    title: 'Notifications',
    items: [
      { icon: Bell, label: 'Email Notifications', description: 'Receive email notifications for attendance updates', type: 'toggle' },
      { icon: Bell, label: 'Push Notifications', description: 'Receive push notifications for leave requests', type: 'toggle' },
    ],
  },
  {
    title: 'Attendance',
    items: [
      { icon: Clock, label: 'Auto Check-Out', description: 'Automatically check out employees at end of shift', type: 'toggle' },
      { icon: Shield, label: 'Require Photo', description: 'Require photo for check-in verification', type: 'toggle' },
    ],
  },
  {
    title: 'Regional',
    items: [
      { icon: Globe, label: 'Timezone', description: 'Set your preferred timezone', type: 'select', value: 'UTC' },
    ],
  },
];

export default function SettingsPage() {
  const { dark, toggle } = useTheme();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Dark Mode': dark,
    'Email Notifications': true,
    'Push Notifications': false,
    'Auto Check-Out': true,
    'Require Photo': false,
  });

  const handleToggle = (label: string) => {
    if (label === 'Dark Mode') {
      toggle();
      setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
    } else {
      setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your application preferences</p>
      </div>

      {settingsSections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{item.label}</p>
                    <p className="text-xs text-text-secondary">{item.description}</p>
                  </div>
                </div>
                {item.type === 'toggle' ? (
                  <button
                    onClick={() => handleToggle(item.label)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      toggles[item.label] ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      toggles[item.label] ? 'translate-x-5' : ''
                    }`} />
                  </button>
                ) : (
                  <select className="h-9 px-3 rounded-xl bg-background border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>UTC</option>
                    <option>EST</option>
                    <option>PST</option>
                    <option>GMT</option>
                  </select>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to Default</Button>
        <Button>Save Changes</Button>
      </div>
    </motion.div>
  );
}
