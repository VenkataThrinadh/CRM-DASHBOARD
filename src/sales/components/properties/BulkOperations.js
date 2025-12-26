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
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Download,
  ContentCopy,
  Archive,
  Restore,
  Warning,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { propertiesAPI } from '../../../main-dashboard/services/api';

const BulkOperations = ({ selectedProperties, onOperationComplete, onClose }) => {
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  
  // Bulk edit fields
  const [bulkEditData, setBulkEditData] = useState({
    status: '',
    type: '',
    city: '',
    price_adjustment: '',
    price_adjustment_type: 'percentage', // percentage or fixed
    featured: null,
    tags: '',
  });

  const operations = [
    { value: 'edit', label: 'Bulk Edit Properties', icon: <Edit /> },
    { value: 'delete', label: 'Delete Properties', icon: <Delete />, dangerous: true },
    { value: 'activate', label: 'Activate Properties', icon: <Visibility /> },
    { value: 'deactivate', label: 'Deactivate Properties', icon: <VisibilityOff /> },
    { value: 'duplicate', label: 'Duplicate Properties', icon: <ContentCopy /> },
    { value: 'archive', label: 'Archive Properties', icon: <Archive /> },
    { value: 'restore', label: 'Restore Properties', icon: <Restore /> },
    { value: 'export', label: 'Export Properties', icon: <Download /> },
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

  const executeOperation = async () => {
    if (!operation || selectedProperties.length === 0) return;

    setLoading(true);
    setProgress(0);
    setConfirmDialog(false);

    try {
      let operationResults = [];
      const total = selectedProperties.length;

      for (let i = 0; i < selectedProperties.length; i++) {
        const property = selectedProperties[i];
        setProgress(((i + 1) / total) * 100);

        try {
          let result;
          switch (operation) {
            case 'edit':
              result = await executeBulkEdit(property);
              break;
            case 'delete':
              result = await propertiesAPI.delete(property.id);
              break;
            case 'activate':
              result = await propertiesAPI.update(property.id, { status: 'available' });
              break;
            case 'deactivate':
              result = await propertiesAPI.update(property.id, { status: 'inactive' });
              break;
            case 'duplicate':
              result = await duplicateProperty(property);
              break;
            case 'archive':
              result = await propertiesAPI.update(property.id, { status: 'archived' });
              break;
            case 'restore':
              result = await propertiesAPI.update(property.id, { status: 'available' });
              break;
            case 'export':
              result = { success: true, message: 'Exported successfully' };
              break;
            default:
              result = { success: false, message: 'Unknown operation' };
          }

          operationResults.push({
            property: property,
            success: result.success !== false,
            message: result.message || 'Operation completed',
          });
        } catch (error) {
          operationResults.push({
            property: property,
            success: false,
            message: error.message || 'Operation failed',
          });
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Handle export operation
      if (operation === 'export') {
        await exportProperties(selectedProperties);
      }

      setResults(operationResults);
      onOperationComplete && onOperationComplete(operation, operationResults);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Bulk operation failed:', error);
      setResults([{
        property: null,
        success: false,
        message: 'Bulk operation failed: ' + error.message,
      }]);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const executeBulkEdit = async (property) => {
    const updateData = {};

    // Only include fields that have values
    if (bulkEditData.status) updateData.status = bulkEditData.status;
    if (bulkEditData.type) updateData.type = bulkEditData.type;
    if (bulkEditData.city) updateData.city = bulkEditData.city;
    if (bulkEditData.featured !== null) updateData.featured = bulkEditData.featured;
    if (bulkEditData.tags) updateData.tags = bulkEditData.tags;

    // Handle price adjustment
    if (bulkEditData.price_adjustment) {
      const adjustment = parseFloat(bulkEditData.price_adjustment);
      const currentPrice = parseFloat(property.price) || 0;
      
      if (bulkEditData.price_adjustment_type === 'percentage') {
        updateData.price = currentPrice * (1 + adjustment / 100);
      } else {
        updateData.price = currentPrice + adjustment;
      }
    }

    return await propertiesAPI.update(property.id, updateData);
  };

  const duplicateProperty = async (property) => {
    const duplicateData = {
      ...property,
      title: `${property.title} (Copy)`,
      status: 'draft',
    };
    delete duplicateData.id;
    delete duplicateData.created_at;
    delete duplicateData.updated_at;

    return await propertiesAPI.create(duplicateData);
  };

  const exportProperties = async (properties) => {
    const exportData = properties.map(property => ({
      id: property.id,
      title: property.title,
      type: property.type,
      city: property.city,
      price: property.price,
      area: property.area,
      status: property.status,
      created_at: property.created_at,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `properties-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getOperationDescription = () => {
    const selectedOp = operations.find(op => op.value === operation);
    if (!selectedOp) return '';

    const count = selectedProperties.length;
    switch (operation) {
      case 'edit':
        return `Apply bulk edits to ${count} selected properties`;
      case 'delete':
        return `Permanently delete ${count} selected properties`;
      case 'activate':
        return `Activate ${count} selected properties`;
      case 'deactivate':
        return `Deactivate ${count} selected properties`;
      case 'duplicate':
        return `Create duplicates of ${count} selected properties`;
      case 'archive':
        return `Archive ${count} selected properties`;
      case 'restore':
        return `Restore ${count} selected properties`;
      case 'export':
        return `Export ${count} selected properties to JSON file`;
      default:
        return `Perform operation on ${count} selected properties`;
    }
  };

  const renderBulkEditForm = () => (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={bulkEditData.status}
            label="Status"
            onChange={handleBulkEditChange('status')}
          >
            <MenuItem value="">No Change</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="sold">Sold</MenuItem>
            <MenuItem value="rented">Rented</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Property Type</InputLabel>
          <Select
            value={bulkEditData.type}
            label="Property Type"
            onChange={handleBulkEditChange('type')}
          >
            <MenuItem value="">No Change</MenuItem>
            <MenuItem value="apartment">Apartment</MenuItem>
            <MenuItem value="house">House</MenuItem>
            <MenuItem value="villa">Villa</MenuItem>
            <MenuItem value="plot">Plot</MenuItem>
            <MenuItem value="commercial">Commercial</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="City"
          value={bulkEditData.city}
          onChange={handleBulkEditChange('city')}
          placeholder="Leave empty for no change"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Tags (comma separated)"
          value={bulkEditData.tags}
          onChange={handleBulkEditChange('tags')}
          placeholder="Leave empty for no change"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          size="small"
          label="Price Adjustment"
          type="number"
          value={bulkEditData.price_adjustment}
          onChange={handleBulkEditChange('price_adjustment')}
          placeholder="0"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel>Adjustment Type</InputLabel>
          <Select
            value={bulkEditData.price_adjustment_type}
            label="Adjustment Type"
            onChange={handleBulkEditChange('price_adjustment_type')}
          >
            <MenuItem value="percentage">Percentage (%)</MenuItem>
            <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={bulkEditData.featured === true}
              indeterminate={bulkEditData.featured === null}
              onChange={(e) => setBulkEditData({
                ...bulkEditData,
                featured: e.target.checked ? true : bulkEditData.featured === true ? null : false
              })}
            />
          }
          label="Featured Property"
        />
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
                    primary={result.property?.title || 'Bulk Operation'}
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
          Bulk Operations
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          {selectedProperties.length} properties selected for bulk operation
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

            {operations.find(op => op.value === operation)?.dangerous && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This operation cannot be undone. Please proceed with caution.
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => setConfirmDialog(true)}
                disabled={loading || !operation}
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
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Confirm Bulk Operation
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {operation} {selectedProperties.length} selected properties?
          </Typography>
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

export default BulkOperations;
