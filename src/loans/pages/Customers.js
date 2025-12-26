import React, { useState, useEffect, useCallback } from 'react';
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
  Avatar,
  TablePagination,
  InputAdornment,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiService } from '../services/apiService';
import CustomerService from '../services/customerService';
import SalesCustomerService from '../services/salesCustomerService';

const initialFormData = {
  full_name: '',
  email: '',
  phone: '',
  state: '',
  zip_code: '',
  address: '',
  photo: null,
};

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Andaman and Nicobar Islands'
];

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Dual-mode dialog states
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'import'
  const [salesCustomers, setSalesCustomers] = useState([]);
  const [selectedSalesCustomer, setSelectedSalesCustomer] = useState(null);
  const [loadingSalesCustomers, setLoadingSalesCustomers] = useState(false);

  // Mock fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
      };
      const response = await CustomerService.getCustomers({ ...params });
      setCustomers(response.data || []);
      setTotalItems(response.pagination?.totalItems || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
      // eslint-disable-next-line no-console
      console.error('Fetch customers error:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

  const handleOpenDialog = (customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        address: customer.address,
        photo: null,
      });
      if (customer.photo) {
        setPhotoPreview(customer.photo);
      }
      setDialogMode('create');
    } else {
      setEditingCustomer(null);
      setFormData(initialFormData);
      setPhotoPreview(null);
      setSelectedSalesCustomer(null);
      setDialogMode('create');
      // Fetch sales customers for import mode
      fetchSalesCustomers();
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setFormData(initialFormData);
    setFormErrors({});
    setPhotoPreview(null);
    setSelectedSalesCustomer(null);
    setDialogMode('create');
  };

  const fetchSalesCustomers = useCallback(async () => {
    try {
      setLoadingSalesCustomers(true);
      const response = await SalesCustomerService.getAvailableSalesCustomers({ 
        limit: 500,
        page: 1 
      });
      setSalesCustomers(response.data || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching sales customers:', err);
      setSalesCustomers([]);
    } finally {
      setLoadingSalesCustomers(false);
    }
  }, []);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSelectChange = (field) => (event) => {
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

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPG, JPEG, PNG, WEBP and GIF files are allowed.');
        return;
      }
      
      // Validate file size (max 10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('File size too large. Maximum size allowed is 10MB.');
        return;
      }

      setFormData(prev => ({ ...prev, photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateUniqueCustomerId = () => {
    let customerId;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate a random 6-digit number (100000-999999)
      customerId = Math.floor(Math.random() * 900000) + 100000;
      
      // Check if this ID already exists in the customers list
      isUnique = !customers.some(c => Number(c.customer_id) === customerId);
    }
    
    return customerId.toString();
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.email && formData.email !== 'N/A' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.zip_code.trim()) {
      errors.zip_code = 'Zip Code is required';
    } else if (!/^[0-9]{6}$/.test(formData.zip_code)) {
      errors.zip_code = 'Please enter a valid 6-digit Zip Code';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Handle import mode
    if (dialogMode === 'import') {
      if (!selectedSalesCustomer) {
        toast.error('Please select a customer to import');
        return;
      }

      try {
        setSubmitting(true);
        // Import the selected sales customer to loans dashboard
        await SalesCustomerService.importSalesCustomer(selectedSalesCustomer.customer_id);
        toast.success(`Customer "${selectedSalesCustomer.full_name}" imported successfully`);
        handleCloseDialog();
        fetchCustomers();
      } catch (err) {
        const msg = err?.message || 'Failed to import customer';
        toast.error(msg);
        // eslint-disable-next-line no-console
        console.error('Import customer error:', err);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Handle create mode
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare data to send to backend
      const customerData = {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        email: formData.email === 'N/A' ? '' : formData.email,
        state: formData.state,
        zip_code: formData.zip_code
      };

      if (editingCustomer) {
        // Update customer via API
        await CustomerService.updateCustomer(editingCustomer.customer_id, customerData);
        toast.success('Customer updated successfully');
      } else {
        // Generate unique 6-digit customer ID for new customers
        const customerId = generateUniqueCustomerId();
        customerData.customer_id = customerId;
        
        // Create new customer via API
        await CustomerService.createCustomer(customerData);
        toast.success(`Customer added successfully (ID: ${customerId})`);
      }

      handleCloseDialog();
      fetchCustomers();
    } catch (err) {
      const msg = err?.message || 'Failed to save customer';
      toast.error(msg);
      if (/phone number.*exists|already exists|duplicate/i.test(msg)) {
        setFormErrors(prev => ({ ...prev, phone: 'Phone number already exists' }));
      }
      // eslint-disable-next-line no-console
      console.error('Save customer error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete ${customer.full_name}?`)) {
      return;
    }

    try {
      await CustomerService.deleteCustomer(customer.customer_id);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
      // eslint-disable-next-line no-console
      console.error('Delete customer error:', err);
    }
  };

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

  // Filter customers based on search
  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search customers by name, ID, phone, or email..."
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

      {/* Customers Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Photo</TableCell>
                  <TableCell>Customer ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow key={customer.customer_id} hover>
                    <TableCell>
                      <Avatar sx={{ backgroundColor: '#1976d2' }}>
                        {customer.full_name.charAt(0).toUpperCase()}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {customer.customer_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {customer.full_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{customer.phone}</Typography>
                        </Box>
                        {customer.email && customer.email !== 'N/A' && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">{customer.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">{customer.state || 'N/A'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer.zip_code || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(customer)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(customer)}
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
            count={filteredCustomers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        
        {/* Tabs for mode selection */}
        {!editingCustomer && (
          <Tabs
            value={dialogMode}
            onChange={(e, newValue) => setDialogMode(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label="Create New Customer" value="create" />
            <Tab label="Import Existing Customer" value="import" />
          </Tabs>
        )}

        <DialogContent>
          {dialogMode === 'create' ? (
            // Create New Customer Form
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Photo Upload */}
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={photoPreview || undefined}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  >
                    <PersonIcon sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Stack spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<PhotoCameraIcon />}
                      size="small"
                    >
                      Upload Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </Button>
                    <Typography variant="caption" display="block">
                      Max 10MB (JPG, PNG, GIF, WEBP)
                    </Typography>
                  </Stack>
                </Box>
              </Grid>

              {/* Form Fields */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
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
                      label="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      error={!!formErrors.phone}
                      helperText={formErrors.phone}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
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
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!formErrors.state}>
                      <InputLabel>State *</InputLabel>
                      <Select
                        value={formData.state}
                        onChange={handleSelectChange('state')}
                        label="State *"
                      >
                        {indianStates.map((state) => (
                          <MenuItem key={state} value={state}>
                            {state}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Zip Code"
                      value={formData.zip_code}
                      onChange={handleInputChange('zip_code')}
                      error={!!formErrors.zip_code}
                      helperText={formErrors.zip_code}
                      required
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
              </Grid>
            </Grid>
          ) : (
            // Import Existing Customer Form
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {loadingSalesCustomers ? (
                <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Loading customers...</Typography>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Autocomplete
                    options={salesCustomers}
                    getOptionLabel={(option) => `${option.full_name} (${option.customer_id || 'N/A'})`}
                    value={selectedSalesCustomer}
                    onChange={(event, newValue) => setSelectedSalesCustomer(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Customer from Sales"
                        placeholder="Type to search..."
                        required
                      />
                    )}
                    filterOptions={(options, state) => {
                      const inputValue = state.inputValue.toLowerCase();
                      return options.filter(
                        (option) =>
                          option.full_name.toLowerCase().includes(inputValue) ||
                          (option.customer_id && option.customer_id.toString().includes(inputValue)) ||
                          (option.email && option.email.toLowerCase().includes(inputValue)) ||
                          (option.phone && option.phone.includes(inputValue))
                      );
                    }}
                    isOptionEqualToValue={(option, value) => option.customer_id === value?.customer_id}
                    noOptionsText="No customers found"
                  />
                  
                  {selectedSalesCustomer && (
                    <Card sx={{ mt: 3, backgroundColor: '#f5f5f5' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Selected Customer Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Name
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {selectedSalesCustomer.full_name}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Customer ID
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {selectedSalesCustomer.customer_id || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Phone
                              </Typography>
                              <Typography variant="body2">
                                {selectedSalesCustomer.phone || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Email
                              </Typography>
                              <Typography variant="body2">
                                {selectedSalesCustomer.email || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Address
                              </Typography>
                              <Typography variant="body2">
                                {selectedSalesCustomer.address || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || (dialogMode === 'import' && !selectedSalesCustomer)}
          >
            {submitting ? <CircularProgress size={20} /> : (editingCustomer ? 'Update' : dialogMode === 'import' ? 'Import' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
