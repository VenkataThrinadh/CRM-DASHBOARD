/**
 * Date Formatter Utility
 * Provides consistent date and time formatting across the loans module
 */

/**
 * Format a date from database timestamp to locale string
 * Handles various date formats and timezone conversions
 * 
 * @param {string|Date|number} dateValue - The date value from API (ISO string, timestamp, or Date object)
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeTime - Include time in output (default: true)
 * @param {string} options.locale - Locale string (default: 'en-US')
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateValue, options = {}) => {
  const {
    includeTime = true,
    locale = 'en-US'
  } = options;

  if (!dateValue) {
    return '-';
  }

  try {
    // Convert various formats to Date object
    let date;
    
    if (typeof dateValue === 'string') {
      // Handle MySQL datetime format (YYYY-MM-DD HH:mm:ss)
      if (dateValue.includes(' ') && !dateValue.includes('T')) {
        // Convert to local time interpretation
        const [datePart, timePart] = dateValue.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes, seconds] = timePart.split(':');
        date = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        // ISO format string
        date = new Date(dateValue);
      }
    } else if (typeof dateValue === 'number') {
      // Timestamp in milliseconds
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      // Already a Date object
      date = dateValue;
    } else {
      return '-';
    }

    // Validate date
    if (isNaN(date.getTime())) {
      return '-';
    }

    // Format based on locale
    if (includeTime) {
      return date.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error formatting date:', dateValue, error);
    return '-';
  }
};

/**
 * Format date as "DD/MM/YYYY HH:mm:ss" format
 * Handles both MySQL TIMESTAMP (as Date objects from mysql2) and string formats
 * 
 * @param {string|Date} dateValue - The date value
 * @returns {string} - Formatted date string
 */
export const formatDateDDMMYYYY = (dateValue) => {
  if (!dateValue) return '-';
  // If it's a Date object, format directly
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    const day = String(dateValue.getDate()).padStart(2, '0');
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const year = dateValue.getFullYear();
    const hour = String(dateValue.getHours()).padStart(2, '0');
    const minute = String(dateValue.getMinutes()).padStart(2, '0');
    const second = String(dateValue.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }
  // If it's a string, use regex
  if (typeof dateValue === 'string') {
    const match = dateValue.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }
    return dateValue; // fallback: show as-is
  }
  // For numbers (timestamp)
  if (typeof dateValue === 'number') {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }
  }
  return '-';
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * 
 * @param {string|Date} dateValue - The date value
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (dateValue) => {
  if (!dateValue) return '-';

  try {
    let date;
    
    if (typeof dateValue === 'string') {
      if (dateValue.includes(' ') && !dateValue.includes('T')) {
        const [datePart, timePart] = dateValue.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hours, minutes, seconds] = timePart.split(':');
        date = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return '-';
    }

    if (isNaN(date.getTime())) {
      return '-';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return formatDateDDMMYYYY(date);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error formatting relative time:', dateValue, error);
    return '-';
  }
};

/**
 * Format date and time separately
 * 
 * @param {string|Date} dateValue - The date value
 * @returns {Object} - Object with date and time properties
 */
export const formatDateAndTime = (dateValue) => {
  return {
    date: formatDate(dateValue, { includeTime: false }),
    time: formatTime(dateValue),
    full: formatDate(dateValue, { includeTime: true })
  };
};

/**
 * Format time only (HH:mm:ss)
 * Handles both MySQL TIMESTAMP (as Date objects) and string formats
 * 
 * @param {string|Date} dateValue - The date value
 * @returns {string} - Time string
 */
export const formatTime = (dateValue) => {
  if (!dateValue) return '-';

  try {
    let date;
    
    if (typeof dateValue === 'string') {
      // Handle MySQL datetime format (YYYY-MM-DD HH:mm:ss)
      if (dateValue.includes(' ') && !dateValue.includes('T')) {
        const [datePart, timePart] = dateValue.split(' ');
        // Parse as local time
        const [year, month, day] = datePart.split('-');
        const [hours, minutes, seconds] = timePart.split(':');
        date = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      // Already a Date object - use it directly
      date = dateValue;
    } else {
      return '-';
    }

    if (isNaN(date.getTime())) {
      return '-';
    }

    // Use local time components (not UTC)
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error formatting time:', dateValue, error);
    return '-';
  }
};

const dateFormatterUtils = {
  formatDate,
  formatDateDDMMYYYY,
  formatRelativeTime,
  formatDateAndTime,
  formatTime
};

export default dateFormatterUtils;
