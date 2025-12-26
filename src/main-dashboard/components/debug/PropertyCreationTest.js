import React, { useState } from 'react';
import {
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import { propertiesAPI } from '../../services/api';

const PropertyCreationTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testPropertyData = {
    title: 'Test Property ' + Date.now(),
    price: '500000',
    description: 'This is a test property created via frontend',
    area: 1200.50,
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zip_code: '12345',
    property_type: 'apartment',
    is_featured: false,
    status: 'available',
    unit_number: 'A-101',
    outstanding_amount: 0,
    location: 'Test Location',
    built_year: 2023,
    contact_email: 'test@example.com',
    contact_phone: '+1234567890'
  };

  const handleTestCreation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      
      const response = await propertiesAPI.create(testPropertyData);
      
      setResult(response.data);
      
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Property Creation Test
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This component tests the property creation functionality directly.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Title"
            value={testPropertyData.title}
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Price"
            value={testPropertyData.price}
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            value={testPropertyData.city}
            size="small"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Property Type"
            value={testPropertyData.property_type}
            size="small"
            disabled
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        onClick={handleTestCreation}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
        sx={{ mb: 2 }}
      >
        {loading ? 'Creating Property...' : 'Test Property Creation'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Error:</Typography>
          <pre style={{ fontSize: '12px', margin: 0 }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        </Alert>
      )}

      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Success!</Typography>
          <Typography variant="body2">
            Property created with ID: {result.property?.id}
          </Typography>
          <pre style={{ fontSize: '12px', margin: '8px 0 0 0' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Alert>
      )}
    </Paper>
  );
};

export default PropertyCreationTest;