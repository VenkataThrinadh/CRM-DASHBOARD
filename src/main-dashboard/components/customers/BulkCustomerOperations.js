import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Delete,
  Edit,
  Email,
  Download,
  People,
} from '@mui/icons-material';
import { customersAPI } from '../../services/api';

const BulkCustomerOperations = ({ 
  open, 
  onClose, 
  selectedCustomers, 
  onOperationComplete 
}) => {
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Operation-specific states
  const [updateData, setUpdateData] = useState({
    status: '',
    customer_type: '',
    source: '',
  });
  
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
  });

  const handleOperationChange = (newOperation) => {
    setOperation(newOperation);
    setError(null);
    setSuccess(null);
  };

  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleBulkUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter out empty values
      const filteredData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value && value.trim() !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      if (Object.keys(filteredData).length === 0) {
        setError('Please select at least one field to update');
        return;
      }
      
      await customersAPI.bulkUpdate(selectedCustomers, filteredData);
      setSuccess(`Successfully updated ${selectedCustomers.length} customers`);
      onOperationComplete();
      setOperation('');
    } catch (error) {
      setError('Failed to update customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await customersAPI.bulkDelete(selectedCustomers);
      setSuccess(`Successfully deleted ${selectedCustomers.length} customers`);
      onOperationComplete();
      setOperation('');
    } catch (error) {
      setError('Failed to delete customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!emailData.subject.trim() || !emailData.message.trim()) {
        setError('Please provide both subject and message');
        return;
      }
      
      // Send emails to selected customers
      const emailPromises = selectedCustomers.map(customerId =>
        customersAPI.sendEmail(customerId, emailData)
      );
      
      await Promise.all(emailPromises);
      setSuccess(`Successfully sent emails to ${selectedCustomers.length} customers`);
      setOperation('');
    } catch (error) {
      setError('Failed to send emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await customersAPI.bulkExport({ 
        customer_ids: selectedCustomers 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Successfully exported ${selectedCustomers.length} customers`);
      setOperation('');
    } catch (error) {
      setError('Failed to export customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const executeOperation = async () => {
    switch (operation) {
      case 'update':
        await handleBulkUpdate();
        break;
      case 'delete':
        await handleBulkDelete();
        break;
      case 'email':
        await handleBulkEmail();
        break;
      case 'export':
        await handleExport();
        break;
      default:
        setError('Please select an operation');
    }
  };

  const renderOperationForm = () => {
    switch (operation) {
      case 'update':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select fields to update (leave empty to keep current values):
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateData.status}
                  label="Status"
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">Keep Current</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={updateData.customer_type}
                  label="Customer Type"
                  onChange={(e) => setUpdateData(prev => ({ ...prev, customer_type: e.target.value }))}
                >
                  <MenuItem value="">Keep Current</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="investor">Investor</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={updateData.source}
                  label="Source"
                  onChange={(e) => setUpdateData(prev => ({ ...prev, source: e.target.value }))}
                >
                  <MenuItem value="">Keep Current</MenuItem>
                  <MenuItem value="website">Website</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                  <MenuItem value="social_media">Social Media</MenuItem>
                  <MenuItem value="advertisement">Advertisement</MenuItem>
                  <MenuItem value="walk_in">Walk In</MenuItem>
                  <MenuItem value="phone_call">Phone Call</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        );
        
      case 'delete':
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This action will permanently delete {selectedCustomers.length} customers.
                This cannot be undone.
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to delete these customers?
            </Typography>
          </Box>
        );
        
      case 'email':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Send email to {selectedCustomers.length} customers:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                required
              />
            </Box>
          </Box>
        );
        
      case 'export':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Export {selectedCustomers.length} customers to CSV file.
            </Typography>
          </Box>
        );
        
      default:
        return null;
    }
  };

  const getOperationIcon = (op) => {
    switch (op) {
      case 'update': return <Edit />;
      case 'delete': return <Delete />;
      case 'email': return <Email />;
      case 'export': return <Download />;
      default: return null;
    }
  };

  const getOperationColor = (op) => {
    switch (op) {
      case 'update': return 'primary';
      case 'delete': return 'error';
      case 'email': return 'info';
      case 'export': return 'success';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <People />
          <Typography variant="h6">
            Bulk Customer Operations
          </Typography>
          <Chip 
            label={`${selectedCustomers.length} selected`} 
            color="primary" 
            size="small" 
          />
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Operation Selection */}
        <Typography variant="h6" gutterBottom>
          Select Operation
        </Typography>
        
        <List>
          {[
            { id: 'update', label: 'Update Fields', description: 'Update status, customer type, or source' },
            { id: 'delete', label: 'Delete Customers', description: 'Permanently delete selected customers' },
            { id: 'email', label: 'Send Email', description: 'Send bulk email to selected customers' },
            { id: 'export', label: 'Export Data', description: 'Export customer data to CSV file' },
          ].map((op) => (
            <ListItem
              key={op.id}
              button
              selected={operation === op.id}
              onClick={() => handleOperationChange(op.id)}
              sx={{
                border: 1,
                borderColor: operation === op.id ? `${getOperationColor(op.id)}.main` : 'divider',
                borderRadius: 1,
                mb: 1,
                '&.Mui-selected': {
                  backgroundColor: `${getOperationColor(op.id)}.light`,
                  '&:hover': {
                    backgroundColor: `${getOperationColor(op.id)}.light`,
                  },
                },
              }}
            >
              <ListItemIcon>
                {getOperationIcon(op.id)}
              </ListItemIcon>
              <ListItemText
                primary={op.label}
                secondary={op.description}
              />
            </ListItem>
          ))}
        </List>

        {/* Operation Form */}
        {renderOperationForm()}

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={executeOperation}
          variant="contained"
          disabled={!operation || loading}
          color={operation === 'delete' ? 'error' : 'primary'}
          startIcon={loading ? <CircularProgress size={20} /> : getOperationIcon(operation)}
        >
          {loading ? 'Processing...' : `Execute ${operation ? operation.charAt(0).toUpperCase() + operation.slice(1) : 'Operation'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkCustomerOperations;
