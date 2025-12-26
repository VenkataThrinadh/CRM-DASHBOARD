// Test script to verify sample data is working
import { sampleUsers, sampleEnquiries, sampleProperties } from './sampleData';
import { usersAPI, enquiriesAPI, propertiesAPI } from '../services/api';

export const testSampleData = async () => {
  try {
    // Test Users API
    const usersResponse = await usersAPI.getAll();

    // Test Enquiries API
    const enquiriesResponse = await enquiriesAPI.getAll();

    // Test Properties API
    const propertiesResponse = await propertiesAPI.getAll();

    return {
      users: usersResponse.data.users || [],
      enquiries: enquiriesResponse.data.enquiries || [],
      properties: propertiesResponse.data.properties || []
    };

  } catch (error) {
    throw error;
  }
};

// Test individual sample data arrays
export const testSampleDataArrays = () => {
  // Test data structure
  if (sampleUsers.length > 0) {
  }

  if (sampleEnquiries.length > 0) {
  }

  if (sampleProperties.length > 0) {
  }
};