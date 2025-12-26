import axios from 'axios';
import { getApiBaseUrl } from '../config/environment';

// Create axios instance with base configuration
const apiBaseUrl = getApiBaseUrl();
const isDev = process.env.NODE_ENV === 'development';

// Lightweight dev-only logger wrappers to satisfy ESLint no-console
let debugLog = () => {};
let debugError = () => {};
if (isDev) {
  // eslint-disable-next-line no-console
  debugLog = (...args) => console.log(...args);
  // eslint-disable-next-line no-console
  debugError = (...args) => console.error(...args);
}

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000, // Increased to 60 seconds for slow backend responses
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if your backend requires credentials
});

// Request interceptor to add auth token and debug
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging (dev-only via wrapper)
    debugLog('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: { ...config.headers, Authorization: token ? 'Bearer ***' : undefined },
      data: config.data
    });
    
    return config;
  },
  (error) => {
    debugError('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and debug
api.interceptors.response.use(
  (response) => {
    // Debug logging (dev-only via wrapper)
    debugLog('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Debug logging (dev-only via wrapper)
    debugError('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // Only handle unauthorized when a token exists and it's not login/auth-check
    const isLoginOrAuthCheck = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/me');
    const hasToken = !!localStorage.getItem('adminToken');
    if (error.response?.status === 401 && hasToken && !isLoginOrAuthCheck) {
      // Token expired or invalid (but not during login or auth check)
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Properties API calls
export const propertiesAPI = {
  // Basic CRUD operations
  getAll: (params = {}) => api.get('/properties', { params }),
  getAllForDropdown: () => api.get('/properties/all'),
  getById: (id) => api.get(`/properties/${id}`),
  create: (propertyData) => api.post('/properties', propertyData),
  update: (id, propertyData) => api.put(`/properties/${id}`, propertyData),
  delete: (id) => api.delete(`/properties/${id}`),
  
  // Image management - FIXED ENDPOINTS
  uploadImages: (propertyId, formData) => api.post(`/uploads/property-images/${propertyId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getImages: (propertyId) => api.get(`/properties/${propertyId}/images`),
  deleteImage: (propertyId, imageId) => api.delete(`/uploads/property-images/${imageId}`),
  setPrimaryImage: (propertyId, imageId) => api.put(`/uploads/property-images/${imageId}/primary`),
  
  // Advanced features
  getFeatured: () => api.get('/properties/featured'),
  toggleFeatured: (id) => api.put(`/properties/${id}/featured`),
  getByStatus: (status) => api.get(`/properties/status/${status}`),
  getByType: (type) => api.get(`/properties/type/${type}`),
  getByCity: (city) => api.get(`/properties/city/${city}`),
  
  // Search and filters
  search: (query) => api.get(`/properties/search?q=${encodeURIComponent(query)}`),
  filter: (filters) => api.post('/properties/filter', filters),
  
  // Statistics
  getStatistics: () => api.get('/properties/statistics'),
  getPriceRange: () => api.get('/properties/price-range'),
  
  // Bulk operations
  bulkUpdate: (ids, data) => api.put('/properties/bulk', { ids, data }),
  bulkDelete: (ids) => api.delete('/properties/bulk', { data: { ids } }),
  bulkExport: (filters = {}) => api.get('/properties/export', {
    params: filters,
    responseType: 'blob'
  }),
  bulkImport: (formData) => api.post('/properties/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Property history and analytics
  getHistory: (id) => api.get(`/properties/${id}/history`),
  getViews: (id) => api.get(`/properties/${id}/views`),
  incrementViews: (id) => api.post(`/properties/${id}/views`),
};

// Users API calls
export const usersAPI = {
  // Basic CRUD operations
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  
  // Role and status management
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  updateStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
  
  // Search and filters
  search: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  getByRole: (role) => api.get(`/users/role/${role}`),
  getByStatus: (status) => api.get(`/users/status/${status}`),
  
  // Statistics
  getStatistics: () => api.get('/users/statistics'),
  getActivityLog: (id) => api.get(`/users/${id}/activity`),
  
  // Bulk operations
  bulkUpdate: (ids, data) => api.put('/users/bulk', { ids, data }),
  bulkDelete: (ids) => api.delete('/users/bulk', { data: { ids } }),
  bulkExport: (filters = {}) => api.post('/users/export', filters, {
    responseType: 'blob'
  }),
  
  // Profile management
  uploadAvatar: (id, formData) => api.post(`/users/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAvatar: (id) => api.delete(`/users/${id}/avatar`),
  
  // Password management
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
  changePassword: (id, passwordData) => api.put(`/users/${id}/change-password`, passwordData),
};

// Enquiries API calls
export const enquiriesAPI = {
  // Basic CRUD operations
  getAll: (params = {}) => api.get('/enquiries', { params }),
  getById: (id) => api.get(`/enquiries/${id}`),
  create: (enquiryData) => api.post('/enquiries', enquiryData),
  update: (id, enquiryData) => api.put(`/enquiries/${id}`, enquiryData),
  delete: (id) => api.delete(`/enquiries/${id}`),
  
  // Response and replies management
  getReplies: (id) => api.get(`/enquiries/${id}/replies`),
  respond: (id, response) => api.post(`/enquiries/${id}/reply`, { message: response }),
  markAsRead: (id) => api.put(`/enquiries/${id}/mark-read`),
  markAsUnread: (id) => api.put(`/enquiries/${id}/mark-unread`),
  
  // Status management
  updateStatus: (id, status) => api.put(`/enquiries/${id}/status`, { status }),
  assignTo: (id, userId) => api.put(`/enquiries/${id}/assign`, { userId }),
  
  // Search and filters
  search: (query) => api.get(`/enquiries/search?q=${encodeURIComponent(query)}`),
  getByStatus: (status) => api.get(`/enquiries/status/${status}`),
  getByProperty: (propertyId) => api.get(`/enquiries/property/${propertyId}`),
  getByUser: (userId) => api.get(`/enquiries/user/${userId}`),
  
  // Statistics
  getStatistics: () => api.get('/enquiries/statistics'),
  getResponseTime: () => api.get('/enquiries/response-time'),
  
  // Bulk operations
  bulkUpdate: (ids, data) => api.put('/enquiries/bulk', { ids, data }),
  bulkDelete: (ids) => api.delete('/enquiries/bulk', { data: { ids } }),
  bulkExport: (filters = {}) => api.post('/enquiries/export', filters, {
    responseType: 'blob'
  }),
  
  // Follow-up management
  addFollowUp: (id, followUpData) => api.post(`/enquiries/${id}/follow-up`, followUpData),
  getFollowUps: (id) => api.get(`/enquiries/${id}/follow-ups`),
  updateFollowUp: (enquiryId, followUpId, data) => api.put(`/enquiries/${enquiryId}/follow-ups/${followUpId}`, data),
};

// Admin API calls (merged with enhanced features)
export const adminAPI = {
  // Original admin endpoints
  getDashboardStats: (dateRange) => 
    api.get('/admin/dashboard-stats', { params: dateRange }),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getSystemHealth: () => api.get('/admin/system-health'),
  exportData: (type, params) => api.get(`/admin/export/${type}`, { 
    params,
    responseType: 'blob'
  }),
  
  // Dashboard specific endpoints
  getDashboard: () => api.get('/admin/dashboard'),
  getMonthlyTrends: () => api.get('/admin/dashboard/monthly-trends'),
  getPropertyTypes: () => api.get('/admin/dashboard/property-types'),
  getStatsWithChanges: () => api.get('/admin/dashboard/stats-with-changes'),
  
  // Enhanced analytics endpoints
  getRevenueAnalytics: () => api.get('/admin/dashboard/revenue-analytics'),
  getLocationAnalytics: () => api.get('/admin/dashboard/location-analytics'),
  getUserRoles: () => api.get('/admin/dashboard/user-roles'),
  getEnquiryStatus: () => api.get('/admin/dashboard/enquiry-status'),
  getTopProperties: () => api.get('/admin/dashboard/top-properties'),
  getUserActivity: () => api.get('/admin/dashboard/user-activity'),
  
  // Enhanced admin features
  getRecentActivity: (limit = 10) => 
    api.get('/admin/activity', { params: { limit } }),
  getSystemNotifications: () => api.get('/admin/notifications'),
  markNotificationRead: (notificationId) => 
    api.put(`/admin/notifications/${notificationId}/read`),
  getAuditLogs: (filters) => 
    api.get('/admin/audit-logs', { params: filters }),
  exportAuditLogs: (filters, format = 'csv') => 
    api.get('/admin/audit-logs/export', { 
      params: { ...filters, format },
      responseType: 'blob'
    }),
};

// Loans API calls
export const loansAPI = {
  // Dashboard endpoints
  getDashboardOverview: () => api.get('/loans/dashboard'),
  getDashboardSummary: () => api.get('/loans/dashboard/summary'),
  getDashboardStats: () => api.get('/loans/dashboard/stats'),
  getMetric: (name) => api.get('/loans/dashboard/metric', { params: { name } }),
  // Dedicated per-card endpoints
  getTotalDisbursed: () => api.get('/loans/dashboard/total-disbursed'),
  getTotalCollected: () => api.get('/loans/dashboard/total-collected'),
  getTotalProfit: () => api.get('/loans/dashboard/total-profit'),
  getTotalCustomers: () => api.get('/loans/dashboard/total-customers'),
  getRepeatCustomers: () => api.get('/loans/dashboard/repeat-customers'),
  getTotalLoans: () => api.get('/loans/dashboard/total-loans'),
  getActiveLoans: () => api.get('/loans/dashboard/active-loans'),
  getUptodateLoans: () => api.get('/loans/dashboard/uptodate-loans'),
  getTodayDueLoans: () => api.get('/loans/dashboard/today-due-loans'),
  getPendingLoans: () => api.get('/loans/dashboard/pending-loans'),
  getClosedLoans: () => api.get('/loans/dashboard/closed-loans'),
  getOverdue13Loans: () => api.get('/loans/dashboard/overdue-1-3-loans'),
  getOverdue36Loans: () => api.get('/loans/dashboard/overdue-3-6-loans'),
  getOverdue612Loans: () => api.get('/loans/dashboard/overdue-6-12-loans'),
  getOverdueAbove12Loans: () => api.get('/loans/dashboard/overdue-above-12-loans'),
  getTodaysPayments: () => api.get('/loans/dashboard/todays-payments'),
  getPendingRepayments: () => api.get('/loans/dashboard/pending-repayments'),
  // Payments
  getPayments: (params = {}) => api.get('/loans/payments', { params }),
  // Loans list and details
  getLoans: (params = {}) => api.get('/loans/loans', { params }),
  getLoanById: (id) => api.get(`/loans/loans/${id}`),
};

// Cities API calls
export const citiesAPI = {
  getAll: () => api.get('/cities'),
  create: (cityData) => api.post('/cities', cityData),
  update: (id, cityData) => api.put(`/cities/${id}`, cityData),
  delete: (id) => api.delete(`/cities/${id}`),
};

// Notifications API calls
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Leads API calls
export const leadsAPI = {
  getAll: (params = {}) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  getStatistics: () => api.get('/leads/statistics'),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  // Conversation management
  getConversations: (leadId) => api.get(`/leads/${leadId}/conversations`),
  saveConversation: (leadId, data) => api.post(`/leads/${leadId}/conversations`, data),
  deleteConversation: (leadId, conversationId) => api.delete(`/leads/${leadId}/conversations/${conversationId}`),
};

// Banners API calls
export const bannersAPI = {
  getAll: () => api.get('/banners'),
  create: (bannerData) => api.post('/banners', bannerData),
  update: (id, bannerData) => api.put(`/banners/${id}`, bannerData),
  delete: (id) => api.delete(`/banners/${id}`),
};

// Amenities API calls
export const amenitiesAPI = {
  getByProperty: (propertyId) => api.get(`/amenities/property/${propertyId}`),
  create: (amenityData) => api.post('/amenities', amenityData),
  update: (id, amenityData) => api.put(`/amenities/${id}`, amenityData),
  delete: (id) => api.delete(`/amenities/${id}`),
};

// Settings API calls (for per-user preferences)
export const settingsAPI = {
  getMenuVisibility: () => api.get('/settings/menu-visibility'),
  updateMenuVisibility: (menuVisibility) => api.put('/settings/menu-visibility', { menuVisibility }),
  // System settings
  getSystemSettings: () => api.get('/settings/system'),
  updateSystemSettings: (settings) => api.put('/settings/system', settings),
  // Current balance management
  getCurrentBalance: () => api.get('/settings/current-balance'),
  updateCurrentBalance: (amount) => api.put('/settings/current-balance', { amount }),
  addToBalance: (amount, description) => api.post('/settings/add-to-balance', { amount, description }),
  subtractFromBalance: (amount, description) => api.post('/settings/subtract-from-balance', { amount, description }),
  // Balance history and transactions
  getBalanceHistory: (params = {}) => api.get('/settings/balance-history', { params }),
  createBalanceTransaction: (data) => api.post('/settings/balance-transaction', data),
};

// Specifications API calls
export const specificationsAPI = {
  getByProperty: (propertyId) => api.get(`/specifications/property/${propertyId}`),
  create: (specData) => api.post('/specifications', specData),
  update: (id, specData) => api.put(`/specifications/${id}`, specData),
  delete: (id) => api.delete(`/specifications/${id}`),
};

// Plans API calls
export const plansAPI = {
  getByProperty: (propertyId) => api.get(`/plans/property/${propertyId}`),
  create: (planData) => {
    // Handle FormData for file uploads vs basic JSON data
    if (planData instanceof FormData) {
      // For file uploads (EnhancedPlansEditor)
      return api.post('/plans', planData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // For basic plans without files (PlansEditor)
      return api.post('/plans/basic', planData);
    }
  },
  update: (id, planData) => {
    // Handle FormData for file uploads vs basic JSON data
    if (planData instanceof FormData) {
      // For file uploads (EnhancedPlansEditor)
      return api.put(`/plans/${id}`, planData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // For basic plans without files (PlansEditor)
      return api.put(`/plans/${id}/basic`, planData);
    }
  },
  delete: (id) => api.delete(`/plans/${id}`),
};

// Plots API calls
export const plotsAPI = {
  getByProperty: (propertyId) => api.get(`/plots/property/${propertyId}`),
  create: (plotData) => api.post('/plots', plotData),
  update: (id, plotData) => api.put(`/plots/${id}`, plotData),
  delete: (id) => api.delete(`/plots/${id}`),
};

// Property Blocks API calls (for all property types)
export const propertyBlocksAPI = {
  // Property blocks management for all property types
  getPropertyBlocks: (propertyId) => api.get(`/property-blocks/property/${propertyId}`),
  addBlock: (propertyId, name, floors, description) => api.post('/property-blocks', {
    property_id: propertyId,
    name,
    floors: floors || 1,
    description
  }),
  updateBlock: (blockId, name, floors, description) => api.put(`/property-blocks/${blockId}`, {
    name,
    floors: floors || 1,
    description
  }),
  deleteBlock: (blockId) => api.delete(`/property-blocks/${blockId}`),
  bulkUpdatePropertyBlocks: (propertyId, blocksConfig) => api.put(`/property-blocks/property/${propertyId}/bulk`, {
    blocks: blocksConfig
  }),
};

// Land Plots API calls
export const landPlotsAPI = {
  // Property blocks management (legacy - now uses propertyBlocksAPI for consistency)
  getPropertyBlocks: (propertyId) => api.get(`/land-plots/property/${propertyId}/blocks`),
  addBlock: (propertyId, name, description) => api.post('/land-plots/blocks', {
    property_id: propertyId,
    name,
    description
  }),
  updateBlock: (blockId, name, description) => api.put(`/land-plots/blocks/${blockId}`, {
    name,
    description
  }),
  deleteBlock: (blockId) => api.delete(`/land-plots/blocks/${blockId}`),
  
  // Plot management
  getByProperty: (propertyId) => api.get(`/land-plots/property/${propertyId}`),
  getBlockPlots: (blockId) => api.get(`/land-plots/blocks/${blockId}/plots`),
  create: (plotData) => api.post('/land-plots/plots', plotData),
  update: (id, plotData) => api.put(`/land-plots/${id}`, plotData),
  delete: (id) => api.delete(`/land-plots/${id}`),
  
  // Bulk operations
  bulkUpdatePropertyBlocks: (propertyId, blocksConfig) => api.put(`/land-plots/property/${propertyId}/blocks/bulk`, {
    blocks: blocksConfig
  }),
};

// Favorites API calls
export const favoritesAPI = {
  getAll: (params) => api.get('/favorites', { params }),
  getByUser: (userId) => api.get(`/favorites/user/${userId}`),
};

// Upload API calls
export const uploadsAPI = {
  uploadFile: (formData, type = 'general') => api.post(`/uploads/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (filename, type = 'general') => api.delete(`/uploads/${type}/${filename}`),
};

// Bulk Operations API calls
export const bulkOperationsAPI = {
  // Properties bulk operations
  bulkUpdateProperties: (propertyIds, updateData) => 
    api.put('/properties/bulk-update', { ids: propertyIds, data: updateData }),
  bulkDeleteProperties: (propertyIds) => 
    api.delete('/properties/bulk-delete', { data: { ids: propertyIds } }),
  bulkActivateProperties: (propertyIds) => 
    api.put('/properties/bulk-activate', { ids: propertyIds }),
  bulkDeactivateProperties: (propertyIds) => 
    api.put('/properties/bulk-deactivate', { ids: propertyIds }),
  bulkArchiveProperties: (propertyIds) => 
    api.put('/properties/bulk-archive', { ids: propertyIds }),
  bulkDuplicateProperties: (propertyIds) => 
    api.post('/properties/bulk-duplicate', { ids: propertyIds }),
  
  // Users bulk operations
  bulkUpdateUsers: (userIds, updateData) => 
    api.put('/users/bulk-update', { ids: userIds, data: updateData }),
  bulkDeleteUsers: (userIds) => 
    api.delete('/users/bulk-delete', { data: { ids: userIds } }),
  bulkActivateUsers: (userIds) => 
    api.put('/users/bulk-activate', { ids: userIds }),
  bulkDeactivateUsers: (userIds) => 
    api.put('/users/bulk-deactivate', { ids: userIds }),
  bulkVerifyEmails: (userIds) => 
    api.put('/users/bulk-verify-emails', { ids: userIds }),
  bulkSendEmails: (userIds, emailData) => 
    api.post('/users/bulk-send-emails', { ids: userIds, ...emailData }),
  bulkChangeRoles: (userIds, role) => 
    api.put('/users/bulk-change-roles', { ids: userIds, role }),
};

// Advanced Reports API calls
export const reportsAPI = {
  getOverviewReport: (dateRange, filters) => 
    api.get('/reports/overview', { params: { ...dateRange, ...filters } }),
  getPropertiesReport: (dateRange, filters) => 
    api.get('/reports/properties', { params: { ...dateRange, ...filters } }),
  getUsersReport: (dateRange, filters) => 
    api.get('/reports/users', { params: { ...dateRange, ...filters } }),
  getEnquiriesReport: (dateRange, filters) => 
    api.get('/reports/enquiries', { params: { ...dateRange, ...filters } }),
  getRevenueReport: (dateRange, filters) => 
    api.get('/reports/revenue', { params: { ...dateRange, ...filters } }),
  exportReport: (reportType, format, dateRange, filters) => 
    api.get(`/reports/export/${reportType}`, { 
      params: { format, ...dateRange, ...filters },
      responseType: 'blob'
    }),
};

// System Health API calls
export const systemAPI = {
  getHealthStatus: () => api.get('/system/health'),
  getPerformanceMetrics: (timeRange = '24h') => 
    api.get('/system/performance', { params: { range: timeRange } }),
  getSystemAlerts: () => api.get('/system/alerts'),
  acknowledgeAlert: (alertId) => api.put(`/system/alerts/${alertId}/acknowledge`),
  getSystemLogs: (level = 'all', limit = 100) => 
    api.get('/system/logs', { params: { level, limit } }),
  runSystemCheck: () => api.post('/system/check'),
  getBackupStatus: () => api.get('/system/backup/status'),
  triggerBackup: () => api.post('/system/backup/trigger'),
  getSecurityStatus: () => api.get('/system/security'),
  runSecurityScan: () => api.post('/system/security/scan'),
};

// Staff API calls
export const staffAPI = {
  // Basic CRUD operations
  getAll: (params = {}) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (staffData) => api.post('/staff', staffData),
  update: (id, staffData) => api.put(`/staff/${id}`, staffData),
  delete: (id) => api.delete(`/staff/${id}`),

  // Search and filters
  search: (query) => api.get(`/staff?search=${encodeURIComponent(query)}`),
  getByDepartment: (department) => api.get(`/staff?department=${department}`),
  getByStatus: (status) => api.get(`/staff?status=${status}`),

  // Statistics
  getStatistics: () => api.get('/staff/statistics'),

  // Bulk operations
  bulkUpdate: (ids, data) => api.put('/staff/bulk', { ids, data }),
  bulkDelete: (ids) => api.delete('/staff/bulk', { data: { ids } }),
  bulkExport: (filters = {}) => api.post('/staff/export', filters, {
    responseType: 'blob'
  }),

  // Settings management
  updateStatus: (id, status) => api.put(`/staff/${id}/status`, { status }),
  updateDepartment: (id, department) => api.put(`/staff/${id}/department`, { department }),
  updateSalary: (id, salary) => api.put(`/staff/${id}/salary`, { salary }),
};

// Teams API calls (project-wise sales teams)
export const teamsAPI = {
  getAll: (params = {}) => api.get('/teams', { params }),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
};

// Customers API calls
export const customersAPI = {
  // Basic CRUD operations
  getAll: (params = {}) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customerData) => api.post('/customers', customerData),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: (id) => api.delete(`/customers/${id}`),
  
  // Search and filters
  search: (query) => api.get(`/customers?search=${encodeURIComponent(query)}`),
  getByStatus: (status) => api.get(`/customers?status=${status}`),
  getBySource: (source) => api.get(`/customers?source=${source}`),
  getByPriority: (priority) => api.get(`/customers?priority=${priority}`),
  
  // Analytics and statistics
  getAnalytics: () => api.get('/customers/analytics/stats'),
  
  // Customer activity
  getCustomerEnquiries: (customerId) => api.get(`/enquiries?customer_id=${customerId}`),
  getCustomerFavorites: (customerId) => api.get(`/favorites/user/${customerId}`),
  
  // Bulk operations
  bulkUpdate: (ids, data) => api.put('/customers/bulk', { ids, data }),
  bulkDelete: (ids) => api.delete('/customers/bulk', { data: { ids } }),
  bulkExport: (filters = {}) => api.post('/customers/export', filters, {
    responseType: 'blob'
  }),
  bulkImport: (formData) => api.post('/customers/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Customer communication
  sendEmail: (customerId, emailData) => api.post(`/customers/${customerId}/send-email`, emailData),
  addNote: (customerId, note) => api.post(`/customers/${customerId}/notes`, { note }),
  getNotes: (customerId) => api.get(`/customers/${customerId}/notes`),
  
  // Customer segmentation
  getSegments: () => api.get('/customers/segments'),
  createSegment: (segmentData) => api.post('/customers/segments', segmentData),
  getCustomersBySegment: (segmentId) => api.get(`/customers/segments/${segmentId}/customers`),
};

// Documents API calls
export const documentsAPI = {
  // Basic CRUD operations
  getAll: (params = {}) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  create: (documentData) => api.post('/documents', documentData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, documentData) => api.put(`/documents/${id}`, documentData),
  delete: (id) => api.delete(`/documents/${id}`),
  
  // Document categories
  getCategories: () => api.get('/documents/categories/list'),
  createCategory: (categoryData) => api.post('/documents/categories', categoryData),
  
  // Document versions
  uploadVersion: (id, versionData) => api.post(`/documents/${id}/versions`, versionData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getVersions: (id) => api.get(`/documents/${id}/versions`),
  
  // Document activity
  getActivity: (id) => api.get(`/documents/${id}/activity`),
  
  // Search and filters
  search: (query) => api.get(`/documents?search=${encodeURIComponent(query)}`),
  getByProperty: (propertyId) => api.get(`/documents?property_id=${propertyId}`),
  getByCategory: (categoryId) => api.get(`/documents?category=${categoryId}`),
  getByStatus: (status) => api.get(`/documents?status=${status}`),
  
  // Download document
  download: (id) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
  
  // Bulk operations
  bulkUpdate: (ids, data) => api.put('/documents/bulk', { ids, data }),
  bulkDelete: (ids) => api.delete('/documents/bulk', { data: { ids } }),
  bulkExport: (filters = {}) => api.post('/documents/export', filters, {
    responseType: 'blob'
  }),
};

// Staff Documents API calls
export const staffDocumentsAPI = {
  // Get all documents for a staff member
  getByStaff: (staffId) => api.get(`/staff-documents/staff/${staffId}`),
  
  // Get a single document
  getById: (id) => api.get(`/staff-documents/${id}`),
  
  // Upload a new document
  upload: (formData) => api.post('/staff-documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Update document details
  update: (id, formData) => api.put(`/staff-documents/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Delete document
  delete: (id) => api.delete(`/staff-documents/${id}`),
  
  // Download document
  download: (id) => api.get(`/staff-documents/download/${id}`, {
    responseType: 'blob'
  }),
};

export default api;