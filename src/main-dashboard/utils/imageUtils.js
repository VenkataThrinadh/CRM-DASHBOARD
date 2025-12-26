import { getImageBaseUrl } from '../config/environment';

/**
 * Get the full image URL, handling both relative and absolute paths
 * @param {string} imageUrl - The image URL from the database
 * @param {number} propertyId - The property ID (optional, for fallback)
 * @returns {string} - The complete image URL
 */
export const getFullImageUrl = (imageUrl, propertyId = null) => {
  if (!imageUrl) return null;
  
  const baseUrl = getImageBaseUrl();
  
  // If imageUrl already starts with /uploads, it's a full path
  if (imageUrl.startsWith('/uploads/')) {
    return `${baseUrl}${imageUrl}`;
  }
  
  // If imageUrl is just a filename, construct the full path
  if (propertyId) {
    return `${baseUrl}/uploads/properties/${propertyId}/${imageUrl}`;
  }
  
  // Fallback: assume it's a relative path and prepend base URL
  return `${baseUrl}/${imageUrl}`;
};

/**
 * Get property image URL specifically
 * @param {string} imageUrl - The image URL from the database
 * @param {number} propertyId - The property ID
 * @returns {string} - The complete property image URL
 */
export const getPropertyImageUrl = (imageUrl, propertyId) => {
  if (!imageUrl || !propertyId) return null;
  
  const baseUrl = getImageBaseUrl();
  
  // If imageUrl already contains the full path, just prepend base URL
  if (imageUrl.startsWith('/uploads/')) {
    return `${baseUrl}${imageUrl}`;
  }
  
  // Otherwise, construct the full path
  return `${baseUrl}/uploads/properties/${propertyId}/${imageUrl}`;
};

const imageUtils = {
  getFullImageUrl,
  getPropertyImageUrl
};

export default imageUtils;