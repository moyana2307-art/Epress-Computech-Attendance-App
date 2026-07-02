export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive';
  shift_id: number | null;
  shift_name: string | null;
  responsibilities: string;
  created_at: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  shift_id: number | null;
  shift_name: string | null;
  date: string;
  check_in: string;
  check_out: string | null;
  status: 'Present' | 'Late' | 'Absent';
  late_minutes: number;
  note: string;
  cash_up_amount: number;
  created_at: string;
}

export interface ToggleResult {
  message: string;
  data?: Attendance;
  requiresRevenue?: boolean;
  employee_id?: number;
  date?: string;
}

export interface Department {
  id: number;
  name: string;
  head: string;
  employee_count: number;
  created_at: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  type: 'sick' | 'vacation' | 'personal' | 'other';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  description: string;
  responsibilities: string;
  department: string;
  assigned_employee: string | null;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  avatar?: string;
}

export interface DashboardStats {
  total_employees: number;
  present_today: number;
  absent_today: number;
  on_leave: number;
  late_arrivals: number;
  checked_in: number;
  checked_out: number;
  attendance_percentage: string;
  weekly_trend: { day: string; present: number; absent: number }[];
  monthly_summary: { month: string; present: number; absent: number }[];
  department_attendance: { department: string; present: number; total: number }[];
}

export interface BusinessSettings {
  id: number;
  opening_time: string;
  closing_time: string;
  grace_period_minutes: number;
  early_checkin_minutes: number;
}

export interface EmployeeSchedule {
  id: number;
  employee_id: number;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  department: string;
  employee_name?: string;
}

export interface EmployeeStatus {
  employee: { id: number; name: string; email: string };
  schedule: { start_time: string; end_time: string; department: string } | null;
  attendance: { id: number; check_in: string | null; check_out: string | null; status: string; late_minutes: number } | null;
  todayMinutes: number;
  checkInAvailable: boolean;
  checkInStatus: string;
  checkOutAvailable: boolean;
  checkOutStatus: string;
}

export interface DeptAssignment {
  department: string;
  employee_id: number;
  employee_name: string;
  start_time: string;
  end_time: string;
}

export interface WorkerDashboardData {
  businessOpen: boolean;
  businessHours: { opening_time: string; closing_time: string } | null;
  currentTime: string;
  employees: EmployeeStatus[];
  departmentAssignments: DeptAssignment[];
  todayRecords: Attendance[];
  recentActivity: { title: string; message: string; type: string; created_at: string }[];
  weeklyAttendance: { employee_id: number; date: string; check_in: string; check_out: string; status: string }[];
  settings: { gracePeriodMinutes: number; earlyCheckinMinutes: number };
}
