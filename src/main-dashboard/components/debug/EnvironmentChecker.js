import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import { Settings, CheckCircle, Error } from '@mui/icons-material';
import { getApiBaseUrl, getServerBaseUrl, getImageBaseUrl, isDevelopment } from '../../config/environment';

const EnvironmentChecker = () => {
  const envVars = [
    {
      name: 'NODE_ENV',
      value: process.env.NODE_ENV,
      expected: 'development',
    },
    {
      name: 'REACT_APP_API_BASE_URL',
      value: process.env.REACT_APP_API_BASE_URL,
      expected: 'https://mobileapplication.creativeethics.co.in/backend/api',
    },
    {
      name: 'REACT_APP_SERVER_BASE_URL',
      value: process.env.REACT_APP_SERVER_BASE_URL,
      expected: 'https://mobileapplication.creativeethics.co.in/backend',
    },
    {
      name: 'REACT_APP_IMAGE_BASE_URL',
      value: process.env.REACT_APP_IMAGE_BASE_URL,
      expected: 'https://mobileapplication.creativeethics.co.in/backend',
    },
  ];

  const configValues = [
    {
      name: 'API Base URL (from config)',
      value: getApiBaseUrl(),
      expected: 'https://mobileapplication.creativeethics.co.in/backend/api',
    },
    {
      name: 'Server Base URL (from config)',
      value: getServerBaseUrl(),
      expected: 'https://mobileapplication.creativeethics.co.in/backend',
    },
    {
      name: 'Image Base URL (from config)',
      value: getImageBaseUrl(),
      expected: 'https://mobileapplication.creativeethics.co.in/backend',
    },
    {
      name: 'Is Development',
      value: isDevelopment().toString(),
      expected: 'true',
    },
  ];

  const isCorrect = (value, expected) => {
    if (expected === 'development' || expected === 'true') {
      return value === expected;
    }
    return value === expected;
  };

  const getStatusIcon = (value, expected) => {
    return isCorrect(value, expected) ? (
      <CheckCircle color="success" />
    ) : (
      <Error color="error" />
    );
  };

  const getStatusChip = (value, expected) => {
    return isCorrect(value, expected) ? (
      <Chip label="✓ Correct" color="success" size="small" />
    ) : (
      <Chip label="✗ Incorrect" color="error" size="small" />
    );
  };

  const allCorrect = [...envVars, ...configValues].every(item => 
    isCorrect(item.value, item.expected)
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Settings sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            Environment Configuration Checker
          </Typography>
        </Box>

        {allCorrect ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ All environment variables are configured correctly!
          </Alert>
        ) : (
          <Alert severity="error" sx={{ mb: 3 }}>
            ❌ Some environment variables are not configured correctly. This may cause API calls to fail.
          </Alert>
        )}

        {/* Environment Variables */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Environment Variables
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Variable</strong></TableCell>
                <TableCell><strong>Current Value</strong></TableCell>
                <TableCell><strong>Expected Value</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {envVars.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(item.value, item.expected)}
                      <Typography variant="body2" sx={{ ml: 1, fontFamily: 'monospace' }}>
                        {item.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {item.value || '<not set>'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {item.expected}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(item.value, item.expected)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Configuration Values */}
        <Typography variant="h6" gutterBottom>
          Configuration Values (What the App Uses)
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Configuration</strong></TableCell>
                <TableCell><strong>Current Value</strong></TableCell>
                <TableCell><strong>Expected Value</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configValues.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(item.value, item.expected)}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {item.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {item.value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {item.expected}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(item.value, item.expected)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Instructions */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            🔧 How to Fix Configuration Issues:
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Check your <code>.env.local</code> file in the project root
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            2. Restart the development server after making changes
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            3. Clear browser cache if issues persist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            4. Environment variables must start with <code>REACT_APP_</code> to be accessible in React
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default EnvironmentChecker;