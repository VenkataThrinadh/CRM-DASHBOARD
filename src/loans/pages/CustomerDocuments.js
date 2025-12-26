import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import CustomerService from '../services/customerService';
import CustomerDocumentService from '../services/customerDocumentService';
import { formatDate, formatDateDDMMYYYY } from '../utils/dateFormatter';

const CustomerDocuments = () => {
  const [rows, setRows] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  // Add dialog state
  const [openAdd, setOpenAdd] = useState(false);
  const [addCustomerId, setAddCustomerId] = useState('');
  const [addAadhaar, setAddAadhaar] = useState(null);
  const [addPan, setAddPan] = useState(null);

  // Edit dialog state
  const [openEdit, setOpenEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editAadhaar, setEditAadhaar] = useState(null);
  const [editPan, setEditPan] = useState(null);

  // Viewer state for in-page preview (image/pdf)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerKind, setViewerKind] = useState('image');
  const [viewerError, setViewerError] = useState(null);

  const fetchRows = useCallback(async () => {
    try {
      // eslint-disable-next-line no-console
      console.log('Fetching customer documents...');
      
      // Fetch all documents from the API
      const response = await CustomerDocumentService.getDocuments({
        limit: 500,
        page: 1
      });
      
      // eslint-disable-next-line no-console
      console.log('Customer documents response:', response);
      
      setRows(response.data || []);
      setError(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching customer documents:', error);
      setError('Failed to fetch customer documents: ' + (error)?.message);
      setRows([]);
    }
  }, []);

  const fetchAvailable = useCallback(async (currentRows = []) => {
    try {
      // Fetch all customers from loans dashboard
      const response = await CustomerService.getCustomers({ 
        limit: 500,
        page: 1 
      });
      
      const batch = response.data || [];
      
      // Get customer IDs that already have documents
      const existingIds = new Set(currentRows.map(r => r.customer_id));
      
      // Filter out customers that already have documents
      const list = batch
        .filter((c) => !existingIds.has(c.customer_id))
        .map((c) => ({ 
          customer_id: c.customer_id, 
          full_name: c.full_name 
        }));
      
      setAvailableCustomers(list);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load available customers:', e);
      setAvailableCustomers([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchRows();
        await fetchAvailable([]);
      } catch (e) {
        setError('Failed to initialize Customer Documents');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchAvailable, fetchRows]);

  const resetAddForm = () => {
    setAddCustomerId('');
    setAddAadhaar(null);
    setAddPan(null);
  };

  const resetEditForm = () => {
    setEditAadhaar(null);
    setEditPan(null);
  };

  const onOpenAdd = () => {
    resetAddForm();
    setOpenAdd(true);
  };

  const onOpenEdit = (row) => {
    setEditRow(row);
    resetEditForm();
    setOpenEdit(true);
  };

  const handleAdd = async () => {
    try {
      if (!addCustomerId) {
        setError('Please select a customer');
        toast.error('Please select a customer');
        return;
      }
      if (!addAadhaar && !addPan) {
        setError('Please choose Aadhaar and/or PAN file');
        toast.error('Please choose Aadhaar and/or PAN file');
        return;
      }

      // Upload documents via API
      await CustomerDocumentService.uploadDocuments(addCustomerId, addAadhaar, addPan);
      
      setOpenAdd(false);
      await Promise.all([fetchRows(), fetchAvailable(rows)]);
      setError(null);
      setSuccess('Documents uploaded successfully');
      toast.success('Documents uploaded successfully');
    } catch (e) {
      const errorMsg = e?.message || 'Failed to add documents';
      setError(errorMsg);
      toast.error(errorMsg);
      // eslint-disable-next-line no-console
      console.error('Add documents error:', e);
    }
  };

  const handleEdit = async () => {
    try {
      if (!editRow) return;
      if (!editAadhaar && !editPan) {
        setError('Please choose a file to update');
        toast.error('Please choose a file to update');
        return;
      }

      // Upload updated documents via API
      await CustomerDocumentService.uploadDocuments(editRow.customer_id, editAadhaar, editPan);
      
      setOpenEdit(false);
      await fetchRows();
      setError(null);
      setSuccess('Documents updated successfully');
      toast.success('Documents updated successfully');
    } catch (e) {
      const errorMsg = e?.message || 'Failed to update documents';
      setError(errorMsg);
      toast.error(errorMsg);
      // eslint-disable-next-line no-console
      console.error('Edit documents error:', e);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer record along with all documents?')) return;
    try {
      // Delete all documents for the customer via API
      await CustomerDocumentService.deleteDocument(customerId);
      
      await Promise.all([fetchRows(), fetchAvailable(rows)]);
      setSuccess('Customer documents deleted successfully');
      toast.success('Customer documents deleted successfully');
    } catch (e) {
      const errorMsg = e?.message || 'Failed to delete customer documents';
      setError(errorMsg);
      toast.error(errorMsg);
      // eslint-disable-next-line no-console
      console.error('Delete customer documents error:', e);
    }
  };

  const viewFile = (file) => {
    if (!file) {
      toast.error('No file available');
      return;
    }
    
    const apiBase = process.env.REACT_APP_API_URL || window.location.origin + '/backend/api';
    const backendOrigin = apiBase.replace(/\/api$/, '');
    // Use the static uploads directory for file serving
    const url = `${backendOrigin}/uploads/documents/${file}`;
    const lower = file.toLowerCase();
    const kind = lower.endsWith('.pdf') ? 'pdf' : 'image';
    
    // eslint-disable-next-line no-console
    console.log('Viewing file:', { file, url, kind, apiBase, backendOrigin });
    
    // For PDF, add cache busting to prevent browser caching issues
    const finalUrl = kind === 'pdf' ? `${url}?t=${Date.now()}` : url;
    
    setViewerError(null);
    setViewerUrl(finalUrl);
    setViewerKind(kind);
    setViewerOpen(true);
  };

  const downloadFile = async (id, type) => {
    try {
      // TODO: Replace with actual API call
      // const response = await apiService.get(`/customer-documents/${id}/download?type=${type}`, { responseType: 'blob' });
      // Handle file download...
      toast.success('Download started');
    } catch (e) {
      setError('Failed to download file');
      toast.error('Failed to download file');
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const name = (r.customer_name || '').toLowerCase();
      const matchesName = name.includes(searchTerm.toLowerCase());
      const matchesCustomer = !selectedCustomer || r.customer_id === selectedCustomer;
      return matchesName && matchesCustomer;
    });
  }, [rows, searchTerm, selectedCustomer]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Customer Documents
        </Typography>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={onOpenAdd}>
          Add ID Proofs
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search by customer name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Customer (filter)</InputLabel>
                <Select
                  value={selectedCustomer}
                  label="Customer (filter)"
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {rows.map((r) => (
                    <MenuItem key={r.doc_id} value={r.customer_id}>
                      {r.customer_name} ({r.customer_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Customer ID</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Aadhaar</TableCell>
                  <TableCell>PAN</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((r, idx) => (
                  <TableRow key={r.doc_id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{r.customer_id}</TableCell>
                    <TableCell>{r.customer_name}</TableCell>
                    <TableCell>
                      {r.aadhaar_file ? (
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Aadhaar">
                            <IconButton size="small" color="primary" onClick={() => viewFile(r.aadhaar_file)}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download Aadhaar">
                            <IconButton size="small" color="info" onClick={() => downloadFile(r.doc_id, 'aadhaar')}>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Chip label="Not Available" color="error" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {r.pan_file ? (
                        <Box display="flex" gap={1}>
                          <Tooltip title="View PAN">
                            <IconButton size="small" color="primary" onClick={() => viewFile(r.pan_file)}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download PAN">
                            <IconButton size="small" color="info" onClick={() => downloadFile(r.doc_id, 'pan')}>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Chip label="Not Available" color="error" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{formatDateDDMMYYYY(r.created_at)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" color="warning" onClick={() => onOpenEdit(r)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(r.customer_id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No documents found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* In-page viewer dialog */}
      <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {viewerKind === 'image' ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 400 }}>
              <img src={viewerUrl} alt="document" style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }} />
            </Box>
          ) : (
            <Box sx={{ height: 700, backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {viewerError && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#ffebee', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="error">
                    {viewerError}
                  </Typography>
                </Box>
              )}
              {!viewerError && (
                <>
                  <embed
                    src={viewerUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    onError={() => {
                      setViewerError('PDF could not be loaded. Click "Open in Browser" to view.');
                      // eslint-disable-next-line no-console
                      console.error('PDF embed failed, URL:', viewerUrl);
                    }}
                  />
                  {/* Fallback message */}
                  <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20, textAlign: 'center', pointerEvents: 'none' }}>
                    <Typography variant="caption" color="textSecondary">
                      If PDF doesn't display, use "Open in Browser" button
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {viewerKind === 'pdf' && (
            <Button
              variant="outlined"
              onClick={() => window.open(viewerUrl, '_blank')}
              sx={{ mr: 'auto' }}
            >
              Open in Browser
            </Button>
          )}
          <Button onClick={() => setViewerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add ID Proofs</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={availableCustomers}
                getOptionLabel={(o) => `${o.full_name} (${o.customer_id})`}
                value={availableCustomers.find(c => c.customer_id === addCustomerId) || null}
                onChange={(_e, v) => setAddCustomerId(v?.customer_id || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Customer" required placeholder="Search customer by name or ID" />
                )}
                noOptionsText={availableCustomers.length === 0 ? 'No customers available to add (all have documents?)' : 'No matches'}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Aadhaar</Typography>
              <Button variant="outlined" component="label" fullWidth>
                Choose file / Use camera
                <input
                  hidden
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  type="file"
                  capture="environment"
                  onChange={(e) => setAddAadhaar(e.target.files?.[0] || null)}
                />
              </Button>
              {addAadhaar && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  Selected: {addAadhaar.name}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">Optional</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload PAN</Typography>
              <Button variant="outlined" component="label" fullWidth>
                Choose file / Use camera
                <input
                  hidden
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  type="file"
                  capture="environment"
                  onChange={(e) => setAddPan(e.target.files?.[0] || null)}
                />
              </Button>
              {addPan && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  Selected: {addPan.name}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">Optional</Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Add Documents</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Documents</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Customer" value={editRow ? `${editRow.customer_name} (${editRow.customer_id})` : ''} disabled />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Replace Aadhaar</Typography>
              <input
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                type="file"
                capture="environment"
                onChange={(e) => setEditAadhaar(e.target.files?.[0] || null)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Replace PAN</Typography>
              <input
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                type="file"
                capture="environment"
                onChange={(e) => setEditPan(e.target.files?.[0] || null)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDocuments;
