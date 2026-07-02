const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      res.status === 502
        ? 'Backend server is not running. Start it with: npm run dev:server'
        : `Server returned ${res.status} with no JSON body`
    );
  }
  if (!res.ok) throw new Error((data as { message: string }).message || 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: { id: number; name: string; email: string; role: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    register: (data: { name: string; email: string; password: string; department: string }) =>
      request<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    uploadAvatar: (userId: number, avatar: string) =>
      request<{ message: string; avatar: string }>('/auth/upload-avatar', {
        method: 'POST',
        body: JSON.stringify({ userId, avatar }),
      }),
  },
  attendance: {
    today: (date?: string) =>
      request<import('./types').Attendance[]>(`/attendance/today${date ? `?date=${date}` : ''}`),
    all: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<import('./types').Attendance[]>(`/attendance${q}`);
    },
    stats: (date?: string) =>
      request<import('./types').DashboardStats>(`/attendance/stats${date ? `?date=${date}` : ''}`),
    toggle: (employeeName: string, extra?: { ecocashAmount?: number; printingAmount?: number }) =>
      request<import('./types').ToggleResult>('/attendance/toggle', {
        method: 'POST',
        body: JSON.stringify({ employeeName, ...extra }),
      }),
    adminCheckin: (employeeId: number) =>
      request<{ message: string }>('/attendance/admin-checkin', {
        method: 'POST',
        body: JSON.stringify({ employeeId }),
      }),
  },
  employees: {
    list: () => request<import('./types').Employee[]>('/employees'),
    get: (id: number) => request<import('./types').Employee>(`/employees/${id}`),
    create: (data: Partial<import('./types').Employee>) =>
      request<import('./types').Employee>('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<import('./types').Employee>) =>
      request<import('./types').Employee>(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/employees/${id}`, { method: 'DELETE' }),
    remove: (id: number) =>
      request<{ message: string }>(`/employees/${id}`, { method: 'DELETE' }),
  },
  departments: {
    list: () => request<import('./types').Department[]>('/departments'),
    create: (data: { name: string; head: string }) =>
      request<import('./types').Department>('/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  leaves: {
    list: () => request<import('./types').LeaveRequest[]>('/leaves'),
    create: (data: Partial<import('./types').LeaveRequest>) =>
      request<import('./types').LeaveRequest>('/leaves', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, status: string) =>
      request<import('./types').LeaveRequest>(`/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },
  notifications: {
    list: () => request<import('./types').Notification[]>('/notifications'),
    markRead: (id: number) =>
      request<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () =>
      request<{ message: string }>('/notifications/read-all', { method: 'PUT' }),
  },
  shifts: {
    list: () => request<import('./types').Shift[]>('/shifts'),
    current: () => request<{ shift: import('./types').Shift | null; employee: import('./types').Employee | null }>('/shifts/current'),
    create: (data: Partial<import('./types').Shift>) =>
      request<import('./types').Shift>('/shifts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<import('./types').Shift>) =>
      request<import('./types').Shift>(`/shifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/shifts/${id}`, { method: 'DELETE' }),
  },
  dashboard: {
    stats: () => request<import('./types').DashboardStats>('/dashboard/stats'),
  },
  business: {
    get: () => request<import('./types').BusinessSettings>('/business'),
    update: (data: Partial<import('./types').BusinessSettings>) =>
      request<import('./types').BusinessSettings>('/business', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  worker: {
    dashboard: () => request<import('./types').WorkerDashboardData>('/worker/dashboard'),
    requestOtp: (employeeName: string) =>
      request<{ message: string; expiresIn: number }>('/worker/request-otp', {
        method: 'POST',
        body: JSON.stringify({ employeeName }),
      }),
    verifyOtp: (employeeName: string, code: string) =>
      request<{ message: string; late: boolean; department: string }>('/worker/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ employeeName, code }),
      }),
    checkout: (employeeName: string) =>
      request<{ message: string }>('/worker/checkout', {
        method: 'POST',
        body: JSON.stringify({ employeeName }),
      }),
  },
};
