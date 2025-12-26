/**
 * Customer Document Service for Loans Dashboard
 * This service handles all customer document-related API calls
 */

import { apiService } from './apiService';
import { getApiBaseUrl } from '../../main-dashboard/config/environment';

class CustomerDocumentService {
  /**
   * Fetch all customer documents
   * @param {Object} filters - Filter options (customer_id, doc_type, page, limit)
   * @returns {Promise} - Promise containing documents data
   */
  static async getDocuments(filters = {}) {
    try {
      const { customer_id, doc_type, page = 1, limit = 10 } = filters;

      const params = {
        page,
        limit,
        ...(customer_id && { customer_id }),
        ...(doc_type && { doc_type }),
      };

      const response = await apiService.get('/loans/customer-documents', { params });

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
      // eslint-disable-next-line no-console
      console.error('Error fetching documents:', error);
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
   * Get a single document by ID
   * @param {string} docId - The document ID
   * @returns {Promise} - Promise containing document data
   */
  static async getDocumentById(docId) {
    try {
      const response = await apiService.get(`/loans/customer-documents/${docId}`);

      if (!response.success) {
        return null;
      }

      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching document:', error);
      return null;
    }
  }

  /**
   * Upload customer Aadhaar and/or PAN documents
   * @param {string} customerId - The customer ID
   * @param {File} aadhaarFile - The Aadhaar file (optional)
   * @param {File} panFile - The PAN file (optional)
   * @returns {Promise} - Promise containing upload response
   */
  static async uploadDocuments(customerId, aadhaarFile, panFile) {
    try {
      const formData = new FormData();
      formData.append('customer_id', customerId);
      
      if (aadhaarFile) {
        formData.append('aadhaar_file', aadhaarFile);
      }
      if (panFile) {
        formData.append('pan_file', panFile);
      }

      // Use fetch directly for multipart/form-data with dynamic API base URL
      const API_BASE_URL = getApiBaseUrl();
      
      const response = await fetch(`${API_BASE_URL}/loans/customer-documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to upload documents');
      }

      return data.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  /**
   * Delete a customer's all documents (deletes entire row)
   * @param {string} customerId - The customer ID
   * @returns {Promise} - Promise containing delete response
   */
  static async deleteDocument(customerId) {
    try {
      const response = await apiService.delete(`/loans/customer-documents/${customerId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete customer documents');
      }

      return { success: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting customer documents:', error);
      throw error;
    }
  }
}

export default CustomerDocumentService;
