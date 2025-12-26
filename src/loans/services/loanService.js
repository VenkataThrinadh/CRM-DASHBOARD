/**
 * Loan Service for Loans Dashboard
 * This service handles all loan-related API calls
 * Fetches data from the real backend database API
 */

import { apiService } from './apiService';
import { getApiBaseUrl } from '../../main-dashboard/config/environment';

class LoanService {
  /**
   * Fetch all loans with optional filters
   * @param {Object} filters - Filter options (filter, search, page, limit)
   * @returns {Promise} - Promise containing loans data
   */
  static async getLoans(filters = {}) {
    try {
      const { search, page = 1, limit = 10, filter = 'uptodate' } = filters;
      
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(filter && { filter }),
      };

      const response = await apiService.get('/loans/loans', { params });

      if (!response.success) {
        return {
          data: [],
          pagination: {
            totalItems: 0,
            page,
            limit,
          },
        };
      }

      // Normalize API response shape. apiService returns { success, data }
      // where data may be either an array (rows) or an object { data: rows, pagination }
      const payload = response.data;
      let rows = [];
      let pagination = { totalItems: 0, page, limit };

      if (Array.isArray(payload)) {
        rows = payload;
        pagination.totalItems = payload.length;
      } else if (payload && payload.data && Array.isArray(payload.data)) {
        rows = payload.data;
        pagination = Object.assign(pagination, payload.pagination || { totalItems: rows.length, page, limit });
      } else if (payload && typeof payload === 'object' && payload !== null) {
        // fallback: try to read likely fields
        rows = payload.rows || payload.items || [];
        pagination = Object.assign(pagination, payload.pagination || { totalItems: rows.length, page, limit });
      }

      return { data: rows, pagination };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching loans:', error);
      return {
        data: [],
        pagination: {
          totalItems: 0,
          page: 1,
          limit: 10,
        },
      };
    }
  }

  /**
   * Apply status filter to loans
   * @param {Array} loans - Array of loans
   * @param {string} filter - Filter type
   * @returns {Array} - Filtered loans
   */
  static applyStatusFilter(loans, filter) {
    // Filter is already applied on the backend
    // This method is kept for backward compatibility
    return loans;
  }

  /**
   * Get loan statistics
   * @returns {Promise} - Promise containing loan stats
   */
  static async getLoanStats() {
    try {
      const response = await apiService.get('/loans/dashboard');
      
      if (!response.success) {
        return {
          uptodate: 0,
          today_due: 0,
          pending: 0,
          overdue_1_3: 0,
          overdue_3_6: 0,
          overdue_6_12: 0,
          overdue_above_12: 0,
          closed: 0,
        };
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching loan stats:', error);
      return {
        uptodate: 0,
        today_due: 0,
        pending: 0,
        overdue_1_3: 0,
        overdue_3_6: 0,
        overdue_6_12: 0,
        overdue_above_12: 0,
        closed: 0,
      };
    }
  }

  /**
   * Get a single loan by ID
   * @param {number} loanId - The loan ID
   * @returns {Promise} - Promise containing loan data
   */
  static async getLoanById(loanId) {
    try {
      const response = await apiService.get(`/loans/loans/${loanId}`);
      
      if (!response.success) {
        return null;
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching loan:', error);
      return null;
    }
  }

  /**
   * Create a new loan
   * @param {Object} loanData - The loan data
   * @returns {Promise} - Promise containing created loan
   */
  static async createLoan(loanData) {
    try {
      // Ensure numeric types for critical fields sent to backend
      const payload = Object.assign({}, loanData, {
        loan_amount: Number(loanData.loan_amount),
        interest_rate: Number(loanData.interest_rate || 0),
        tenure_months: (typeof loanData.tenure_months !== 'undefined' && loanData.tenure_months !== null) ? Number(loanData.tenure_months) : undefined
      });
      const response = await apiService.post('/loans/loans', payload);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create loan');
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating loan:', error);
      throw error;
    }
  }

  /**
   * Update an existing loan
   * @param {number} loanId - The loan ID
   * @param {Object} loanData - The updated loan data
   * @returns {Promise} - Promise containing updated loan
   */
  static async updateLoan(loanId, loanData) {
    try {
      const payload = Object.assign({}, loanData, {
        loan_amount: typeof loanData.loan_amount !== 'undefined' ? Number(loanData.loan_amount) : undefined,
        interest_rate: typeof loanData.interest_rate !== 'undefined' ? Number(loanData.interest_rate) : undefined,
        tenure_months: (typeof loanData.tenure_months !== 'undefined' && loanData.tenure_months !== null) ? Number(loanData.tenure_months) : undefined
      });
      const response = await apiService.put(`/loans/loans/${loanId}`, payload);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update loan');
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating loan:', error);
      throw error;
    }
  }

  /**
   * Update loan status
   * @param {number} loanId - The loan ID
   * @param {number} status - The new status (1=Pending, 2=Sanctioned, 3=Closed)
   * @returns {Promise} - Promise containing updated loan
   */
  static async updateLoanStatus(loanId, status) {
    try {
      const response = await apiService.put(`/loans/loans/${loanId}`, { status });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update loan status');
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating loan status:', error);
      throw error;
    }
  }

  /**
   * Delete a loan
   * @param {number} loanId - The loan ID
   * @returns {Promise} - Promise containing delete response
   */
  static async deleteLoan(loanId) {
    try {
      const response = await apiService.delete(`/loans/loans/${loanId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete loan');
      }

      return { success: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting loan:', error);
      throw error;
    }
  }

  /**
   * Reports: Fetch loans reports summary
   */
  static async getReportsSummary() {
    try {
      const response = await apiService.get('/loans/reports/summary');
      if (!response.success) return null;
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching loans reports summary:', error);
      return null;
    }
  }

  static async getReportsCollections(startDate, endDate) {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const response = await apiService.get('/loans/reports/collections', { params });
      if (!response.success) return null;
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching loans report collections:', error);
      return null;
    }
  }

  static async getReportsOverdue() {
    try {
      const response = await apiService.get('/loans/reports/overdue');
      if (!response.success) return null;
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching loans report overdue:', error);
      return null;
    }
  }

  /**
   * Upload gold photo
   * @param {File} file - The photo file
   * @param {number} loanId - The loan ID
   * @returns {Promise} - Promise containing upload response
   */
  static async uploadGoldPhoto(file, loanId) {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('loan_id', loanId);

      const API_BASE_URL = getApiBaseUrl();
      
      const response = await fetch(`${API_BASE_URL}/loans/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return { filename: data.filename || file.name };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading photo:', error);
      throw error;
    }
  }
}

export { LoanService };
