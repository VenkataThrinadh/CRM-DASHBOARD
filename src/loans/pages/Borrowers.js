import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  TablePagination,
  InputAdornment,
  Alert,
  CircularProgress,
  Autocomplete,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiService } from '../services/apiService';

const initialFormData = {
  customer_id: '',
  full_name: '',
  contact_no: '',
  address: '',
  email: '',
};

const Borrowers = () => {
  const [borrowers, setBorrowers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);
  const [searchParams] = useSearchParams();
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filter = activeTab === 1 ? 'repeat_customers' : '';
      const params = {
        page: 1,
        limit: 1000,
        ...(searchTerm && { search: searchTerm }),
        ...(filter && { filter })
      };

      const [borrowersResponse, customersResponse] = await Promise.all([
        apiService.get('/loans/borrowers', { params }),
        apiService.get('/loans/customers', { params })
      ]);

      if (borrowersResponse.success) {
        setBorrowers(borrowersResponse.data?.data || borrowersResponse.data || []);
      } else {
        throw new Error(borrowersResponse.message || 'Failed to fetch borrowers');
      }

      if (customersResponse.success) {
        setCustomers(customersResponse.data?.data || customersResponse.data || []);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Fetch data error:', err);
      setError(err.message || 'Failed to fetch data');
      setBorrowers([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    // Set active tab based on query param filter if present (so callers can deep-link)
    const filter = searchParams.get('filter') || '';
    if (filter === 'repeat_customers') setActiveTab(1);
    fetchData();
  }, [fetchData]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleOpenDialog = (borrower) => {
    if (borrower) {
      setEditingBorrower(borrower);
      setFormData({
        customer_id: String(borrower.customer_id || ''),
        full_name: String(borrower.full_name || ''),
        contact_no: String(borrower.contact_no || ''),
        address: String(borrower.address || ''),
        email: String(borrower.email || ''),
      });
      const customer = customers.find(c => c.customer_id === borrower.customer_id);
      setSelectedCustomer(customer || null);
    } else {
      setEditingBorrower(null);
      setFormData(initialFormData);
      setSelectedCustomer(null);
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBorrower(null);
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedCustomer(null);
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: String(customer.customer_id || ''),
        full_name: String(customer.full_name || ''),
        contact_no: String(customer.phone || ''),
        email: String(customer.email || ''),
        address: String(customer.address || ''),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customer_id: '',
        full_name: '',
        contact_no: '',
        email: '',
        address: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customer_id || !String(formData.customer_id).trim()) {
      errors.customer_id = 'Customer selection is required';
    }

    if (!formData.full_name || !String(formData.full_name).trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.contact_no || !String(formData.contact_no).trim()) {
      errors.contact_no = 'Contact number is required';
    } else if (!/^[0-9]{10}$/.test(String(formData.contact_no))) {
      errors.contact_no = 'Please enter a valid 10-digit contact number';
    }

    if (!formData.address || !String(formData.address).trim()) {
      errors.address = 'Address is required';
    }

    if (formData.email && (formData.email !== 'N/A') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.email))) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (editingBorrower) {
        await apiService.put(`/loans/borrowers/${editingBorrower.borrower_id}`, formData);
        toast.success('Borrower updated successfully');
      } else {
        await apiService.post('/loans/borrowers', formData);
        toast.success('Borrower added successfully');
      }

      handleCloseDialog();
      fetchData();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save borrower';
      toast.error(errorMessage);
      // eslint-disable-next-line no-console
      console.error('Save borrower error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (borrower) => {
    if (!window.confirm(`Are you sure you want to delete ${borrower.full_name}?`)) {
      return;
    }

    try {
      await apiService.delete(`/loans/borrowers/${borrower.borrower_id}`);
      toast.success('Borrower deleted successfully');
      fetchData();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete borrower';
      toast.error(errorMessage);
      // eslint-disable-next-line no-console
      console.error('Delete borrower error:', err);
    }
  };

  const getFilteredBorrowers = () => {
    let filtered = borrowers.filter(borrower =>
      borrower.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrower.customer_id.includes(searchTerm) ||
      borrower.contact_no.includes(searchTerm) ||
      borrower.ref_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab === 1) {
      filtered = filtered.filter(borrower => borrower.is_repeat_customer);
      // Sort by customer_id to group same customers together in Repeat Customers tab
      filtered.sort((a, b) => {
        if (a.customer_id === b.customer_id) {
          return a.borrower_id - b.borrower_id;
        }
        return String(a.customer_id).localeCompare(String(b.customer_id));
      });
    }

    return filtered;
  };

  const filteredBorrowers = getFilteredBorrowers();
  const paginatedBorrowers = filteredBorrowers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getRowSx = (borrower) => {
    if (!borrower.is_repeat_customer) return {};
    return {
      backgroundColor: '#FFF9E6',
      borderLeft: '4px solid #FFB300',
      '&:hover': { backgroundColor: '#FFF3CC' },
    };
  };

  const repeatTabRowSx = React.useMemo(() => {
    if (activeTab !== 1) return [];
    const repeatGroupColors = [
      { bg: '#FFF9E6', hover: '#FFF3CC', border: '#FFB300' },
      { bg: '#E8F4FF', hover: '#D6ECFF', border: '#1E88E5' },
    ];
    const styles = [];
    let lastId = null;
    let toggle = 0;
    paginatedBorrowers.forEach((b) => {
      if (b.is_repeat_customer) {
        if (b.customer_id !== lastId) {
          toggle = 1 - toggle;
          lastId = b.customer_id;
        }
        const colorIndex = toggle ? 0 : 1;
        const c = repeatGroupColors[colorIndex];
        styles.push({
          backgroundColor: c.bg,
          borderLeft: `4px solid ${c.border}`,
          '&:hover': { backgroundColor: c.hover },
        });
      } else {
        styles.push({});
      }
    });
    return styles;
  }, [activeTab, paginatedBorrowers]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Borrowers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Borrower
        </Button>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All Borrowers" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RepeatIcon sx={{ mr: 1 }} />
                Repeat Customers
              </Box>
            } 
          />
        </Tabs>
      </Card>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search borrowers by name, customer ID, contact, or reference number..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Borrowers Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ref No</TableCell>
                  <TableCell>Customer ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBorrowers.map((borrower, idx) => (
                  <TableRow 
                    key={borrower.borrower_id}
                    hover
                    sx={activeTab === 0 ? getRowSx(borrower) : (repeatTabRowSx[idx] || {})}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {borrower.ref_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {borrower.customer_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {borrower.full_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{borrower.contact_no}</Typography>
                        </Box>
                        {borrower.email && borrower.email !== 'N/A' && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">{borrower.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {borrower.address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {borrower.is_repeat_customer ? (
                          <Chip
                            label={`Repeat Customer (${borrower.loan_count} borrowers)`}
                            color="warning"
                            size="small"
                            icon={<RepeatIcon />}
                            sx={{ mb: 0.5 }}
                          />
                        ) : (
                          <Chip
                            label="New Customer"
                            color="success"
                            size="small"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(borrower)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(borrower)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredBorrowers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Borrower Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBorrower ? 'Edit Borrower' : 'Add New Borrower'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => `${option.full_name} (${option.customer_id})`}
                value={selectedCustomer}
                onChange={(event, newValue) => handleCustomerSelect(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Customer"
                    error={!!formErrors.customer_id}
                    helperText={formErrors.customer_id}
                    required
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...restProps } = props;
                  return (
                    <Box key={key} component="li" {...restProps}>
                      <Box>
                        <Typography variant="body1">{option.full_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {option.customer_id} | Phone: {option.phone}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.full_name}
                onChange={handleInputChange('full_name')}
                error={!!formErrors.full_name}
                helperText={formErrors.full_name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contact_no}
                onChange={handleInputChange('contact_no')}
                error={!!formErrors.contact_no}
                helperText={formErrors.contact_no}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!formErrors.email}
                helperText={formErrors.email}
                placeholder="Optional"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={3}
                value={formData.address}
                onChange={handleInputChange('address')}
                error={!!formErrors.address}
                helperText={formErrors.address}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (editingBorrower ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Borrowers;
