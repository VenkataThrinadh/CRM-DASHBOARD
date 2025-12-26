import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { ExpandMore, BugReport } from '@mui/icons-material';
import { authAPI } from '../../services/api';

const LoginDebugger = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field) => (event) => {
    setCredentials({
      ...credentials,
      [field]: event.target.value,
    });
  };

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // eslint-disable-next-line no-console
      console.log('🧪 Testing login with credentials:', {
        email: credentials.email,
        password: '***'
      });

      const response = await authAPI.login(credentials);
      
      setResult({
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      });

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('🚨 Login test failed:', err);
      
      setError({
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
        code: err.code,
        isNetworkError: !err.response,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'default';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BugReport sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            Login API Debugger
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          Use this tool to test the login API endpoint and debug any issues.
          Check the browser console for detailed logs.
        </Typography>

        {/* Input Form */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={credentials.email}
            onChange={handleInputChange('email')}
            margin="normal"
            placeholder="Enter your admin email"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={credentials.password}
            onChange={handleInputChange('password')}
            margin="normal"
            placeholder="Enter your admin password"
          />
          <Button
            variant="contained"
            onClick={testLogin}
            disabled={loading || !credentials.email || !credentials.password}
            sx={{ mt: 2 }}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Test Login API'}
          </Button>
        </Box>

        {/* Results */}
        {result && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              ✅ Login Successful!
            </Typography>
            <Chip 
              label={`Status: ${result.status} ${result.statusText}`}
              color="success"
              size="small"
              sx={{ mb: 1 }}
            />
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              ❌ Login Failed
            </Typography>
            <Chip 
              label={error.status ? `Status: ${error.status} ${error.statusText}` : 'Network Error'}
              color={getStatusColor(error.status)}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2">
              {error.data?.error || error.message}
            </Typography>
          </Alert>
        )}

        {/* Detailed Results */}
        {(result || error) && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                🔍 Detailed Response Information
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Response Data:
                </Typography>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(result?.data || error?.data, null, 2)}
                </pre>

                {(result?.headers || error?.headers) && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Response Headers:
                    </Typography>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '12px', 
                      borderRadius: '4px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {JSON.stringify(result?.headers || error?.headers, null, 2)}
                    </pre>
                  </>
                )}

                {error && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Error Details:
                    </Typography>
                    <pre style={{ 
                      background: '#ffebee', 
                      padding: '12px', 
                      borderRadius: '4px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {JSON.stringify({
                        message: error.message,
                        status: error.status,
                        statusText: error.statusText,
                        code: error.code,
                        isNetworkError: error.isNetworkError,
                      }, null, 2)}
                    </pre>
                  </>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* API Information */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            API Configuration:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Base URL:</strong> {process.env.REACT_APP_API_BASE_URL}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Login Endpoint:</strong> {process.env.REACT_APP_API_BASE_URL}/auth/login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginDebugger;