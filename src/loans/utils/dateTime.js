/**
 * Date and Time Utilities
 */

/**
 * Format currency in Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to IST format
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateToIST = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN');
};

/**
 * Calculate days between two dates
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {number} - Number of days between dates
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get current date in various formats
 * @returns {Object} - Object with various date formats
 */
export const getCurrentDateFormats = () => {
  const today = new Date();
  return {
    iso: today.toISOString().split('T')[0],
    display: today.toLocaleDateString('en-IN'),
    timestamp: today.getTime(),
  };
};
