/**
 * Sales Customer Service for Loans Dashboard
 * This service fetches customers from the sales dashboard (main customers table)
 * These customers can be imported into the loans customer_loan table
 */

import { apiService } from './apiService';

class SalesCustomerService {
  /**
   * Fetch all available customers from sales dashboard for import
   * @param {Object} filters - Filter options (search, page, limit)
   * @returns {Promise} - Promise containing customers data
   */
  static async getAvailableSalesCustomers(filters = {}) {
    try {
      const { search = '', page = 1, limit = 100 } = filters;

      const params = {
        page,
        limit,
        ...(search && { search }),
      };

      const response = await apiService.get('/loans/customers/available/sales', { params });

      if (!response.success || !response.data?.data) {
        return {
          data: [],
          total: 0,
          page,
          limit,
        };
      }

      return {
        data: response.data.data || [],
        total: response.data.pagination?.totalItems || 0,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching available sales customers:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 100,
      };
    }
  }

  /**
   * Import an existing sales customer to loans dashboard
   * Creates a new entry in customer_loan table with customer data from sales
   * @param {string} salesCustomerId - The sales customer ID (users.customer_id)
   * @returns {Promise} - Promise containing created loan customer
   */
  static async importSalesCustomer(salesCustomerId) {
    try {
      const response = await apiService.post('/loans/customers/import', {
        sales_customer_id: salesCustomerId,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to import customer');
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error importing sales customer:', error);
      throw error;
    }
  }
}

export default SalesCustomerService;
