/**
 * Customer Service for Loans Dashboard
 * This service handles all customer-related API calls
 * Fetches data from the real backend database API
 */

import { apiService } from './apiService';
import { getApiBaseUrl } from '../../main-dashboard/config/environment';

class CustomerService {
  /**
   * Fetch all customers with optional filters
   * @param {Object} filters - Filter options (search, page, limit)
   * @returns {Promise} - Promise containing customers data
   */
  static async getCustomers(filters = {}) {
    try {
      const { search, page = 1, limit = 10 } = filters;

      const params = {
        page,
        limit,
        ...(search && { search }),
      };

      const response = await apiService.get('/loans/customers', { params });

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

      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
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
   * Get a single customer by ID
   * @param {string} customerId - The customer ID
   * @returns {Promise} - Promise containing customer data
   */
  static async getCustomerById(customerId) {
    try {
      const response = await apiService.get(`/loans/customers/${customerId}`);

      if (!response.success) {
        return null;
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  /**
   * Create a new customer
   * @param {Object} customerData - The customer data
   * @returns {Promise} - Promise containing created customer
   */
  static async createCustomer(customerData) {
    try {
      const response = await apiService.post('/loans/customers', customerData);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create customer');
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update an existing customer
   * @param {string} customerId - The customer ID
   * @param {Object} customerData - The updated customer data
   * @returns {Promise} - Promise containing updated customer
   */
  static async updateCustomer(customerId, customerData) {
    try {
      const response = await apiService.put(`/loans/customers/${customerId}`, customerData);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update customer');
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete a customer
   * @param {string} customerId - The customer ID
   * @returns {Promise} - Promise containing delete response
   */
  static async deleteCustomer(customerId) {
    try {
      const response = await apiService.delete(`/loans/customers/${customerId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete customer');
      }

      return { success: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Upload customer photo
   * @param {File} file - The photo file
   * @param {string} customerId - The customer ID
   * @returns {Promise} - Promise containing upload response
   */
  static async uploadCustomerPhoto(file, customerId) {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('customer_id', customerId);

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

export default CustomerService;
