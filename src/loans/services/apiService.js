/**
 * API Service for Admin Dashboard
 * Connects to real backend API for loan management
 * Fetches data from live database
 */

import { getApiBaseUrl } from '../../main-dashboard/config/environment';

const isDev = process.env.NODE_ENV === 'development';

class ApiService {
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Optional config
   * @returns {Promise} - Promise containing response data
   */
  static async get(endpoint, config = {}) {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const url = new URL(`${API_BASE_URL}${endpoint}`);
      
      // Add query parameters if provided (omit undefined/null/'undefined' strings)
      if (config.params) {
        Object.keys(config.params).forEach(key => {
          const val = config.params[key];
          // Skip undefined / null / 'undefined' / 'null' values
          if (typeof val === 'undefined' || val === null) return;
          if (typeof val === 'string' && (val === 'undefined' || val === 'null' || val.trim() === '')) return;
          // Arrays -> append each
          if (Array.isArray(val)) {
            val.forEach(v => {
              if (typeof v === 'undefined' || v === null) return;
              url.searchParams.append(key, String(v));
            });
          } else {
            url.searchParams.append(key, String(val));
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });

      if (!response.ok) {
        let serverMsg = response.statusText;
        try {
          const errBody = await response.json();
          if (errBody && errBody.message) serverMsg = errBody.message;
        } catch (e) { /* ignore parse errors */ }
        throw new Error(`API Error: ${response.status} ${serverMsg}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      if (isDev) console.error('API Error:', error);
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} config - Optional config
   * @returns {Promise} - Promise containing response data
   */
  static async post(endpoint, data, config = {}) {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let serverMsg = response.statusText;
        try {
          const errBody = await response.json();
          if (errBody && errBody.message) serverMsg = errBody.message;
        } catch (e) { /* ignore parse errors */ }
        throw new Error(`API Error: ${response.status} ${serverMsg}`);
      }

      const responseData = await response.json();
      return {
        success: true,
        data: responseData.data || responseData,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      if (isDev) console.error('API Error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} config - Optional config
   * @returns {Promise} - Promise containing response data
   */
  static async put(endpoint, data, config = {}) {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let serverMsg = response.statusText;
        try {
          const errBody = await response.json();
          if (errBody && errBody.message) serverMsg = errBody.message;
        } catch (e) { /* ignore parse errors */ }
        throw new Error(`API Error: ${response.status} ${serverMsg}`);
      }

      const responseData = await response.json();
      return {
        success: true,
        data: responseData.data || responseData,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      if (isDev) console.error('API Error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Optional config
   * @returns {Promise} - Promise containing response data
   */
  static async delete(endpoint, config = {}) {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });

      if (!response.ok) {
        let serverMsg = response.statusText;
        try {
          const errBody = await response.json();
          if (errBody && errBody.message) serverMsg = errBody.message;
        } catch (e) { /* ignore parse errors */ }
        throw new Error(`API Error: ${response.status} ${serverMsg}`);
      }

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      if (isDev) console.error('API Error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export { ApiService as apiService };
