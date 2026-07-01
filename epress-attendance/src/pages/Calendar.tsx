import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const today = new Date();

const events: Record<string, { type: 'present' | 'late' | 'absent' | 'leave'; label: string }[]> = {
  '2026-07-01': [
    { type: 'present', label: 'Sarah J. - Present' },
    { type: 'late', label: 'Michael C. - Late' },
    { type: 'leave', label: 'Emma W. - Sick Leave' },
  ],
  '2026-07-02': [
    { type: 'present', label: 'Team Meeting - 10 AM' },
  ],
  '2026-07-05': [
    { type: 'absent', label: 'James B. - Absent' },
  ],
};

const typeColors: Record<string, string> = {
  present: 'bg-success',
  late: 'bg-warning',
  absent: 'bg-danger',
  leave: 'bg-accent',
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    const dateStr = date.toISOString().split('T')[0];
    return { day: i + 1, dateStr, isToday: dateStr === today.toISOString().split('T')[0], events: events[dateStr] || [] };
  });

  const handlePrev = () => setCurrentDate(new Date(year, month - 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1));

  const selectedEvents = events[selectedDate] || [];
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Attendance Calendar</h1>
        <p className="text-sm text-text-secondary mt-1">View attendance and events by date</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{monthName}</CardTitle>
              <div className="flex gap-1">
                <button onClick={handlePrev} className="p-2 rounded-lg hover:bg-primary/5 dark:hover:bg-gray-800 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={handleNext} className="p-2 rounded-lg hover:bg-primary/5 dark:hover:bg-gray-800 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-text-secondary py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map((d) => (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={cn(
                    'relative p-2 rounded-xl text-sm font-medium transition-all hover:bg-primary/5 dark:hover:bg-gray-800',
                    d.isToday && 'ring-2 ring-primary',
                    selectedDate === d.dateStr && 'bg-primary text-white hover:bg-primary-dark'
                  )}
                >
                  <span>{d.day}</span>
                  {d.events.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-1">
                      {d.events.slice(0, 3).map((e, i) => (
                        <span key={i} className={cn('w-1.5 h-1.5 rounded-full', typeColors[e.type])} />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate === today.toISOString().split('T')[0] ? "Today's Events" : selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', typeColors[event.type])} />
                    <span className="text-sm text-text">{event.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
