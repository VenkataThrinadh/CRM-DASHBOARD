import { apiService } from './apiService';
import { getApiBaseUrl } from '../../main-dashboard/config/environment';

export class PaymentService {
  static async getPayments(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.loan_id) params.append('loan_id', String(filters.loan_id));

      const resp = await apiService.get(`/loans/payments?${params.toString()}`);
      if (!resp || !resp.success) throw new Error(resp?.message || 'Failed to fetch payments');
      return resp.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PaymentService.getPayments error:', error);
      throw error;
    }
  }

  static async searchLoansForPayment(query) {
    try {
      // Use the lightweight search endpoint implemented on backend
      const resp = await apiService.get(`/loans/loans/search-for-payment`, { params: { q: query } });
      if (!resp || !resp.success) throw new Error(resp?.message || 'Failed to search loans');
      // normalize similar to old frontend
      const payload = resp.data;
      let rows = [];
      if (Array.isArray(payload)) rows = payload;
      else if (payload && Array.isArray(payload.data)) rows = payload.data;
      else if (payload && Array.isArray(payload.rows)) rows = payload.rows;

      return rows;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PaymentService.searchLoansForPayment error:', error);
      throw error;
    }
  }

  static async createPayment(paymentData) {
    try {
      const resp = await apiService.post('/loans/payments', paymentData);
      if (!resp || !resp.success) throw new Error(resp?.message || 'Failed to create payment');
      return resp.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PaymentService.createPayment error:', error);
      throw error;
    }
  }

  static async getPaymentById(paymentId) {
    try {
      const resp = await apiService.get(`/loans/payments/${paymentId}`);
      if (!resp || !resp.success) throw new Error(resp?.message || 'Failed to fetch payment');
      return resp.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PaymentService.getPaymentById error:', error);
      throw error;
    }
  }

  static async calculateOverdueInterest(loanId) {
    try {
      const resp = await apiService.get(`/loans/payments/calculate-overdue/${loanId}`);
      if (!resp || !resp.success) throw new Error(resp?.message || 'Failed to calculate overdue interest');
      return resp.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PaymentService.calculateOverdueInterest error:', error);
      throw error;
    }
  }

  static async downloadReceiptPDF(paymentId) {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/loans/payments/${paymentId}/receipt-pdf`, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cd = response.headers.get('content-disposition');
      let filename = 'receipt.pdf';
      if (cd) {
        const m = cd.match(/filename="?([^";]+)"?/);
        if (m && m[1]) filename = m[1];
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PaymentService.downloadReceiptPDF error:', error);
      throw error;
    }
  }
}

export default PaymentService;
