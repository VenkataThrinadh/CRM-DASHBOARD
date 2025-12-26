import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Edit,
  Delete,
  Block,
  CheckCircle as Activate,
  Email,
  Download,
  Security,
  Warning,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { usersAPI } from '../../services/api';

const BulkUserOperations = ({ selectedUsers, onOperationComplete, onClose }) => {
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  
  // Bulk edit fields
  const [bulkEditData, setBulkEditData] = useState({
    role: '',
    status: '',
    email_verified: null,
    tags: '',
  });

  // Email template data
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    template: 'custom',
  });

  const operations = [
    { value: 'edit', label: 'Bulk Edit Users', icon: <Edit /> },
    { value: 'activate', label: 'Activate Users', icon: <Activate /> },
    { value: 'deactivate', label: 'Deactivate Users', icon: <Block /> },
    { value: 'verify_email', label: 'Verify Email Addresses', icon: <CheckCircle /> },
    { value: 'send_email', label: 'Send Bulk Email', icon: <Email /> },
    { value: 'change_role', label: 'Change User Roles', icon: <Security /> },
    { value: 'export', label: 'Export Users', icon: <Download /> },
    { value: 'delete', label: 'Delete Users', icon: <Delete />, dangerous: true },
  ];

  const emailTemplates = [
    { value: 'welcome', label: 'Welcome Message' },
    { value: 'verification', label: 'Email Verification' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'promotion', label: 'Promotional' },
    { value: 'custom', label: 'Custom Message' },
  ];

  const handleOperationChange = (event) => {
    setOperation(event.target.value);
    setResults(null);
  };

  const handleBulkEditChange = (field) => (event) => {
    setBulkEditData({
      ...bulkEditData,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    });
  };

  const handleEmailDataChange = (field) => (event) => {
    setEmailData({
      ...emailData,
      [field]: event.target.value,
    });

    // Auto-fill template content
    if (field === 'template' && event.target.value !== 'custom') {
      const templates = {
        welcome: {
          subject: 'Welcome to Our Platform!',
          message: 'Welcome to our real estate platform! We\'re excited to have you on board.',
        },
        verification: {
          subject: 'Please Verify Your Email Address',
          message: 'Please click the link below to verify your email address and complete your registration.',
        },
        newsletter: {
          subject: 'Latest Property Updates',
          message: 'Check out the latest properties and market updates in your area.',
        },
        promotion: {
          subject: 'Special Offer - Limited Time!',
          message: 'Don\'t miss out on our special promotional offers for premium properties.',
        },
      };

      if (templates[event.target.value]) {
        setEmailData({
          ...emailData,
          template: event.target.value,
          ...templates[event.target.value],
        });
      }
    }
  };

  const executeOperation = async () => {
    if (!operation || selectedUsers.length === 0) return;

    setLoading(true);
    setProgress(0);
    setConfirmDialog(false);

    try {
      let operationResults = [];
      const total = selectedUsers.length;

      for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i];
        setProgress(((i + 1) / total) * 100);

        try {
          let result;
          switch (operation) {
            case 'edit':
              result = await executeBulkEdit(user);
              break;
            case 'activate':
              result = await usersAPI.update(user.id, { status: 'active' });
              break;
            case 'deactivate':
              result = await usersAPI.update(user.id, { status: 'inactive' });
              break;
            case 'verify_email':
              result = await usersAPI.update(user.id, { email_verified: true });
              break;
            case 'send_email':
              result = await sendEmailToUser(user);
              break;
            case 'change_role':
              result = await usersAPI.update(user.id, { role: bulkEditData.role });
              break;
            case 'delete':
              result = await usersAPI.delete(user.id);
              break;
            case 'export':
              result = { success: true, message: 'Exported successfully' };
              break;
            default:
              result = { success: false, message: 'Unknown operation' };
          }

          operationResults.push({
            user: user,
            success: result.success !== false,
            message: result.message || 'Operation completed',
          });
        } catch (error) {
          operationResults.push({
            user: user,
            success: false,
            message: error.message || 'Operation failed',
          });
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Handle export operation
      if (operation === 'export') {
        await exportUsers(selectedUsers);
      }

      setResults(operationResults);
      onOperationComplete && onOperationComplete(operation, operationResults);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Bulk operation failed:', error);
      setResults([{
        user: null,
        success: false,
        message: 'Bulk operation failed: ' + error.message,
      }]);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const executeBulkEdit = async (user) => {
    const updateData = {};

    // Only include fields that have values
    if (bulkEditData.role) updateData.role = bulkEditData.role;
    if (bulkEditData.status) updateData.status = bulkEditData.status;
    if (bulkEditData.email_verified !== null) updateData.email_verified = bulkEditData.email_verified;
    if (bulkEditData.tags) updateData.tags = bulkEditData.tags;

    return await usersAPI.update(user.id, updateData);
  };

  const sendEmailToUser = async (user) => {
    // Simulate email sending
    // In a real implementation, this would call an email service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Email sent successfully' });
      }, 500);
    });
  };

  const exportUsers = async (users) => {
    const exportData = users.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      email_verified: user.email_verified,
      created_at: user.created_at,
      last_login: user.last_login,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getOperationDescription = () => {
    const selectedOp = operations.find(op => op.value === operation);
    if (!selectedOp) return '';

    const count = selectedUsers.length;
    switch (operation) {
      case 'edit':
        return `Apply bulk edits to ${count} selected users`;
      case 'activate':
        return `Activate ${count} selected users`;
      case 'deactivate':
        return `Deactivate ${count} selected users`;
      case 'verify_email':
        return `Mark email as verified for ${count} selected users`;
      case 'send_email':
        return `Send email to ${count} selected users`;
      case 'change_role':
        return `Change role for ${count} selected users`;
      case 'delete':
        return `Permanently delete ${count} selected users`;
      case 'export':
        return `Export ${count} selected users to JSON file`;
      default:
        return `Perform operation on ${count} selected users`;
    }
  };

  const renderBulkEditForm = () => (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Role</InputLabel>
          <Select
            value={bulkEditData.role}
            label="Role"
            onChange={handleBulkEditChange('role')}
          >
            <MenuItem value="">No Change</MenuItem>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="agent">Agent</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="sub-admin">Sub Admin</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={bulkEditData.status}
            label="Status"
            onChange={handleBulkEditChange('status')}
          >
            <MenuItem value="">No Change</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          size="small"
          label="Tags (comma separated)"
          value={bulkEditData.tags}
          onChange={handleBulkEditChange('tags')}
          placeholder="Leave empty for no change"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={bulkEditData.email_verified === true}
              indeterminate={bulkEditData.email_verified === null}
              onChange={(e) => setBulkEditData({
                ...bulkEditData,
                email_verified: e.target.checked ? true : bulkEditData.email_verified === true ? null : false
              })}
            />
          }
          label="Email Verified"
        />
      </Grid>
    </Grid>
  );

  const renderEmailForm = () => (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={12}>
        <FormControl fullWidth size="small">
          <InputLabel>Email Template</InputLabel>
          <Select
            value={emailData.template}
            label="Email Template"
            onChange={handleEmailDataChange('template')}
          >
            {emailTemplates.map((template) => (
              <MenuItem key={template.value} value={template.value}>
                {template.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          size="small"
          label="Subject"
          value={emailData.subject}
          onChange={handleEmailDataChange('subject')}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Message"
          value={emailData.message}
          onChange={handleEmailDataChange('message')}
          placeholder="Use {{name}} to include user's name"
          required
        />
      </Grid>
      <Grid item xs={12}>
        <Alert severity="info">
          The email will be sent to {selectedUsers.length} users. Use {'{{name}}'} in your message to personalize it with each user's name.
        </Alert>
      </Grid>
    </Grid>
  );

  const renderRoleChangeForm = () => (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          Select new role for selected users:
        </Typography>
        <RadioGroup
          value={bulkEditData.role}
          onChange={(e) => setBulkEditData({ ...bulkEditData, role: e.target.value })}
        >
          <FormControlLabel value="user" control={<Radio />} label="User - Basic access" />
          <FormControlLabel value="agent" control={<Radio />} label="Agent - Can manage properties" />
          <FormControlLabel value="admin" control={<Radio />} label="Admin - Full access" />
        </RadioGroup>
      </Grid>
    </Grid>
  );

  const renderResults = () => {
    if (!results) return null;

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => r.success === false).length;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Operation Results
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {successful}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Successful
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Error color="error" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="error.main">
                  {failed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Info color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary.main">
                  {results.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List>
            {results.map((result, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {result.success ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Error color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.user?.full_name || result.user?.email || 'Bulk Operation'}
                    secondary={result.message}
                  />
                </ListItem>
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bulk User Operations
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          {selectedUsers.length} users selected for bulk operation
        </Alert>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Operation</InputLabel>
          <Select
            value={operation}
            label="Select Operation"
            onChange={handleOperationChange}
          >
            {operations.map((op) => (
              <MenuItem key={op.value} value={op.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {op.icon}
                  <span>{op.label}</span>
                  {op.dangerous && <Chip label="Dangerous" color="error" size="small" />}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {operation && (
          <Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {getOperationDescription()}
            </Typography>

            {operation === 'edit' && renderBulkEditForm()}
            {operation === 'send_email' && renderEmailForm()}
            {operation === 'change_role' && renderRoleChangeForm()}

            {operations.find(op => op.value === operation)?.dangerous && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This operation cannot be undone. Please proceed with caution.
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => setConfirmDialog(true)}
                disabled={loading || !operation || 
                  (operation === 'send_email' && (!emailData.subject || !emailData.message)) ||
                  (operation === 'change_role' && !bulkEditData.role)
                }
                color={operations.find(op => op.value === operation)?.dangerous ? 'error' : 'primary'}
              >
                Execute Operation
              </Button>
              <Button variant="outlined" onClick={onClose}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        {loading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Processing... {Math.round(progress)}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {renderResults()}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Confirm Bulk Operation
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to {operation} {selectedUsers.length} selected users?
          </Typography>
          
          {operation === 'send_email' && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Email Preview:</Typography>
              <Typography variant="body2"><strong>Subject:</strong> {emailData.subject}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Message:</strong> {emailData.message.substring(0, 100)}
                {emailData.message.length > 100 && '...'}
              </Typography>
            </Box>
          )}

          {operations.find(op => op.value === operation)?.dangerous && (
            <Alert severity="error" sx={{ mt: 2 }}>
              This action cannot be undone!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={executeOperation}
            variant="contained"
            color={operations.find(op => op.value === operation)?.dangerous ? 'error' : 'primary'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkUserOperations;