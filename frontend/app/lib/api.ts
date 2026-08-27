import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  },
};

export const studentApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  bulkImport: (data: any[]) => api.post('/students/bulk-import', data),
  getById: (id: number) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: number, data: any) => api.put(`/students/${id}`, data),
  delete: (id: number) => api.delete(`/students/${id}`),
};

export const clearanceApi = {
  // Clearance endpoints
  requestClearance: (studentId: number) => api.post('/clearance/request', { student_id: studentId }),
  getMyStatus: () => api.get('/clearance/my-status'),
  getTrend: () => api.get('/clearance/stats/trend'),
  getPrograms: () => api.get('/clearance/stats/programs'),
  getBottlenecks: () => api.get('/clearance/stats/bottlenecks'),
  getFinancePending: (params?: any) => api.get('/clearance/finance/pending', { params }),
  uploadPayments: (data: any[]) => api.post('/clearance/finance/bulk-payments', data),
  updateFinanceClearance: (clearanceId: number, data: any) => api.put(`/clearance/finance/${clearanceId}`, data),
  getExaminationPending: (params?: any) => api.get('/clearance/examination/pending', { params }),
  updateExaminationClearance: (clearanceId: number, data: any) => api.put(`/clearance/examination/${clearanceId}`, data),
  getDeanPending: (params?: any) => api.get('/clearance/dean/pending', { params }),
  updateDeanClearance: (clearanceId: number, data: any) => api.put(`/clearance/dean/${clearanceId}`, data),
  getClearedStudents: () => api.get('/clearance/registry/cleared-students'),
  getStats: () => api.get('/clearance/stats/dashboard'),
  getOverview: (params?: any) => api.get('/clearance/overview', { params }),

  // Monitoring endpoints
  getSecurityEvents: (params?: { limit?: number; offset?: number }) =>
    api.get('/admin/monitoring/security', { params }),

  getRecentActivity: (params?: { limit?: number; offset?: number }) =>
    api.get('/admin/monitoring/activity', { params }),

  getActiveUsers: () =>
    api.get('/admin/monitoring/users/active'),

  getSystemHealth: () =>
    api.get('/admin/monitoring/health'),

  getAuthSurveillance: (params?: { limit?: number; offset?: number }) =>
    api.get('/admin/monitoring/auth-surveillance', { params }),

  getDatabaseTopography: () =>
    api.get('/admin/monitoring/database/topography'),

  initiateLockdown: () =>
    api.post('/admin/monitoring/lockdown'),

  // Phase 3: Granular Task Management
  getMyTasks: () => api.get('/clearance/tasks/my'),
  updateTaskStatus: (taskId: number, data: { status: string; notes?: string }) =>
    api.put(`/clearance/tasks/${taskId}/status`, data),
};

export const registryApi = {
  // Certificate management
  getCertificates: (params?: any) => api.get('/certificates', { params }),  // Updated to match backend route
  getCertificateStats: () => api.get('/certificates/stats'),  // Updated to match backend route
  getCertificate: (id: number) => api.get(`/certificates/${id}`),
  createCertificate: (data: any) => api.post('/certificates', data),
  updateCertificate: (id: number, data: any) => api.put(`/certificates/${id}`, data),
  verifyCertificate: (id: number) => api.post(`/certificates/${id}/verify`),
  verifyCertificatePublic: (certificateNumber: string) => api.get(`/certificates/verify/${certificateNumber}`),
  
  // Legacy/alternative endpoints (keep for backwards compatibility)
  addCertificate: (data: any) => api.post('/clearance/registry/inventory', data),
  getRegistryStats: () => api.get('/storage/registry/stats'),
  transitionCertificate: (id: number, data: any) => api.put(`/storage/certificates/${id}/transition`, data),
  getCollectionsReport: () => api.get('/clearance/registry/collections-report'),
  markReady: (studentId: number) => api.put(`/clearance/registry/mark-ready/${studentId}`),
  uploadCertificatePreview: (formData: FormData) => api.post('/storage/bulk-import-certificates/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  importCertificates: (formData: FormData) => api.post('/storage/bulk-import-certificates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const notificationApi = {
  getNotifications: () => api.get('/clearance/notifications'),
  markRead: (id: number) => api.put(`/clearance/notifications/${id}`),
};

export const storageApi = {
  getLocations: () => api.get('/storage/locations'),
  bulkImportCertificates: (data: any[]) => api.post('/storage/bulk-import-certificates', data),
  getLocation: (id: number) => api.get(`/storage/locations/${id}`),
  createLocation: (data: any) => api.post('/storage/locations', data),
  updateLocation: (id: number, data: any) => api.put(`/storage/locations/${id}`, data),
  deleteLocation: (id: number) => api.delete(`/storage/locations/${id}`),
  assignCertificate: (data: any) => api.post('/storage/assign', data),
  getHistory: (certificateId: number) => api.get(`/storage/history/${certificateId}`),
  getLocationCertificates: (id: number) => api.get(`/storage/locations/${id}/certificates`),
};

export const appointmentApi = {
  create: (data: any) => api.post('/clearance/appointment', data),
  getMyAppointments: () => api.get('/clearance/appointments/my'),
  getAllAppointments: () => api.get('/clearance/appointments'),
  updateStatus: (id: number, data: any) => api.put(`/clearance/appointments/${id}`, data),
};

export const collectionApi = {
  collect: (data: any) => api.post('/clearance/collect', data),
};

export const auditApi = {
  getLogs: (params?: any) => api.get('/audit/logs', { params }),
};

export const reportApi = {
  getAnalytics: (params?: any) => api.get('/reports/analytics', { params }),
  exportCSV: (params?: any) => api.get('/reports/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params?: any) => api.get('/reports/export/pdf', { params, responseType: 'blob' })
};

export const userApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  create: (data: any) => api.post('/users/', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  toggleStatus: (id: number) => api.put(`/users/${id}/toggle-status`, {}),
  resetPassword: (id: number, data: any) => api.put(`/users/${id}/reset-password`, data),
  getRoles: () => api.get('/users/roles'),
  getRolesList: () => api.get('/users/roles/list'),
  updateRoles: (userId: number, data: any) => api.put(`/users/${userId}/roles`, data),
  getTasks: () => api.get('/users/tasks/list'),
  getUserTasks: (userId: number) => api.get(`/users/${userId}/tasks`),
  updateTasks: (userId: number, data: any[]) => api.put(`/users/${userId}/tasks`, data),
};

export const feeApi = {
  getBalances: (params?: any) => api.get('/clearance/finance/balances', { params }),
  getSummary: () => api.get('/clearance/finance/balance-summary'),
};

export const monitoringApi = {
  getHealth: () => api.get('/admin/monitoring/health'),
  getActivity: (limit?: number) => api.get('/admin/monitoring/activity', { params: { limit: limit || 50 } }),
  getSecurity: () => api.get('/admin/monitoring/security'),
  getActiveUsers: () => api.get('/admin/monitoring/users/active'),
  getAuthSurveillance: () => api.get('/admin/monitoring/auth-surveillance'),
  getDatabaseTopography: () => api.get('/admin/monitoring/database/topography'),
  initiateLockdown: () => api.post('/admin/monitoring/lockdown'),
};

export default api;
