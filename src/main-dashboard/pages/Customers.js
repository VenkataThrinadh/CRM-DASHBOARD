import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Modal,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Email,
  Phone,
  TrendingUp,
  People,
  PersonAdd,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '../../loans/utils/dateFormatter';
import { customersAPI } from '../services/api';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerAnalytics from '../components/customers/CustomerAnalytics';
import BulkCustomerOperations from '../components/customers/BulkCustomerOperations';

const Customers = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [credentialsDialog, setCredentialsDialog] = useState({ open: false, credentials: null });
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [bulkOperationsDialogOpen, setBulkOperationsDialogOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 25);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // Column visibility state
  const [columnVisibilityModel, setColumnVisibilityModel] = useState(() => {
    const saved = localStorage.getItem('customers-column-visibility');
    const parsed = saved ? JSON.parse(saved) : {};
    // eslint-disable-next-line no-console
    console.log('Loaded column visibility from localStorage:', parsed);
    return parsed;
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    newCustomersThisDay: 0,
    newCustomersThisWeek: 0,
    sourceDistribution: [],
    customerTypeDistribution: [],
    statusDistribution: [],
  });
  
  const navigate = useNavigate();

  // Handle column visibility changes
  const handleColumnVisibilityModelChange = useCallback((newModel) => {
    setColumnVisibilityModel(newModel);
    localStorage.setItem('customers-column-visibility', JSON.stringify(newModel));
  }, []);


  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (selectedDate) {
        // Format date as YYYY-MM-DD
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        params.filterDate = `${year}-${month}-${day}`;
      }
      if (selectedMonth) {
        params.filterMonth = selectedMonth;
      }
      if (selectedYear) {
        params.filterYear = selectedYear;
      }

      const response = await customersAPI.getAll(params);
      setCustomers(response.data.customers || []);
    } catch (error) {
      setError('Failed to fetch customers. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, sourceFilter, selectedDate, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCustomers();
    fetchAnalytics();
  }, [fetchCustomers]);

  const fetchAnalytics = async () => {
    try {
      const response = await customersAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching customer analytics:', error);
    }
  };

  const handleMenuOpen = (event, customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  const handleView = () => {
    if (selectedCustomer) {
      navigate(`/customers/${selectedCustomer.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedCustomer) {
      handleEditCustomer(selectedCustomer);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setCustomerToDelete(selectedCustomer);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (customerToDelete) {
      try {
        await customersAPI.delete(customerToDelete.id);
        setCustomers(customers.filter(c => c.id !== customerToDelete.id));
        setDeleteDialogOpen(false);
        setCustomerToDelete(null);
        fetchAnalytics(); // Refresh analytics
      } catch (error) {
        setError('Failed to delete customer. Please try again.');
      }
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setError(null);
    setSuccess(null);
    setCustomerFormOpen(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setError(null);
    setSuccess(null);
    setCustomerFormOpen(true);
  };

  const handleCustomerSave = async (customerData) => {
    try {
      setFormLoading(true);
      setError(null); // Clear any existing errors
      if (editingCustomer) {
        // Update existing customer
        const response = await customersAPI.update(editingCustomer.id, customerData);
        setCustomers(customers.map(c => 
          c.id === editingCustomer.id ? response.data.customer || response.data : c
        ));
      } else {
        // Create new customer
        const response = await customersAPI.create(customerData);
        
        // eslint-disable-next-line no-console
        console.log('Customer creation response:', response.data);
        
        // Check if response includes credentials (new customer with generated login)
        if (response.data.credentials) {
          // Show credentials dialog
          setCredentialsDialog({
            open: true,
            credentials: response.data.credentials
          });
        }
        
        // Add the new customer to the list
        const newCustomer = response.data.customer || response.data;
        if (newCustomer) {
          setCustomers([newCustomer, ...customers]);
        }
        
        // Also refresh the customer list to ensure consistency
        fetchCustomers();
        
        // Show success message if no credentials dialog
        if (!response.data.credentials) {
          setSuccess('Customer created successfully!');
        }
      }
      setCustomerFormOpen(false);
      setEditingCustomer(null);
      fetchAnalytics(); // Refresh analytics
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving customer:', error);
      // eslint-disable-next-line no-console
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to save customer. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleBulkOperations = () => {
    setBulkOperationsDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'prospect': return 'warning';
      case 'converted': return 'primary';
      default: return 'default';
    }
  };


  const columns = [
    {
      field: 'full_name',
      headerName: 'Name',
      width: isMobile ? 150 : 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
          <Avatar sx={{
            width: isMobile ? 28 : 32,
            height: isMobile ? 28 : 32,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}>
            {params.row.full_name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Typography
            variant="body2"
            sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
          >
            {params.row.full_name}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: isMobile ? 180 : 250,
      hide: isMobile, // Hide email on mobile to save space
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Email fontSize="small" color="action" />
          <Typography variant="body2">{params.row.email}</Typography>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: isMobile ? 120 : 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone fontSize="small" color="action" />
          <Typography
            variant="body2"
            sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
          >
            {params.row.phone || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: isMobile ? 80 : 120,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          color={getStatusColor(params.row.status)}
          size="small"
          variant="outlined"
          sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
        />
      ),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: isMobile ? 100 : 120,
      renderCell: (params) => {
        const source = params.row.source || 'other';
        let color = 'default';
        switch (source) {
          case 'website':
            color = 'primary';
            break;
          case 'referral':
            color = 'secondary';
            break;
          case 'social_media':
            color = 'info';
            break;
          default:
            color = 'default';
        }

        return (
          <Chip
            label={source}
            color={color}
            size="small"
            variant="outlined"
            sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
          />
        );
      },
    },
    {
      field: 'days_joined',
      headerName: 'Days Joined',
      width: isMobile ? 90 : 110,
      renderCell: (params) => {
        const createdDate = new Date(params.row.created_at);
        const today = new Date();
        const diffTime = Math.abs(today - createdDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return (
          <Typography
            variant="body2"
            sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
          >
            {diffDays}
          </Typography>
        );
      },
    },
    {
      field: 'assigned_staff_name',
      headerName: 'Assigned Staff',
      width: isMobile ? 120 : 150,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
        >
          {params.row.assigned_staff_name || 'Not Assigned'}
        </Typography>
      ),
    },
    {
      field: 'assigned_staff_phone',
      headerName: 'Staff Phone',
      width: isMobile ? 120 : 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone fontSize="small" color="action" />
          <Typography
            variant="body2"
            sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
          >
            {params.row.assigned_staff_phone || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: isMobile ? 100 : 120,
      hide: isMobile, // Hide created date on mobile
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
        >
          {formatDateDDMMYYYY(params.row.created_at)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: isMobile ? 60 : 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, params.row)}
          sx={{ padding: isMobile ? '4px' : '8px' }}
        >
          <MoreVert sx={{ fontSize: isMobile ? 18 : 20 }} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', p: isMobile ? 1 : 3 }}>
      {/* Header */}
      <Box sx={{
        mb: isMobile ? 2 : 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: isSmallScreen ? 2 : 0
      }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h1"
          sx={{ fontSize: isSmallScreen ? '1.5rem' : isMobile ? '1.75rem' : '2.125rem' }}
        >
          Customer Management
        </Typography>
        <Box sx={{
          display: 'flex',
          gap: isMobile ? 1 : 1,
          flexWrap: 'wrap',
          alignItems: 'center',
          width: isSmallScreen ? '100%' : 'auto'
        }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterModalOpen(true)}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {isMobile ? 'Filter' : 'Filter Customers'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={handleBulkOperations}
            disabled={selectedCustomers.length === 0}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            Bulk Actions ({selectedCustomers.length})
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddCustomer}
            size={isMobile ? "small" : "large"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {isMobile ? 'Add' : 'Add Customer'}
          </Button>
        </Box>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={isMobile ? 1 : 3} sx={{ mb: isMobile ? 2 : 3 }}>
        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{
            minHeight: isMobile ? 80 : 100,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent sx={{
              p: isMobile ? 1.5 : 2,
              '&:last-child': { pb: isMobile ? 1.5 : 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
                <People color="primary" sx={{ fontSize: isMobile ? 24 : 28 }} />
                <Box>
                  <Typography
                    variant={isMobile ? "h5" : "h6"}
                    sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
                  >
                    {analytics.totalCustomers}
                  </Typography>
                  <Typography
                    variant={isMobile ? "caption" : "body2"}
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                  >
                    Total Customers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            minHeight: isMobile ? 80 : 100,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent sx={{
              p: isMobile ? 1.5 : 2,
              '&:last-child': { pb: isMobile ? 1.5 : 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
                <TrendingUp color="success" sx={{ fontSize: isMobile ? 24 : 28 }} />
                <Box>
                  <Typography
                    variant={isMobile ? "h5" : "h6"}
                    sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
                  >
                    {analytics.activeCustomers}
                  </Typography>
                  <Typography
                    variant={isMobile ? "caption" : "body2"}
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                  >
                    Active Customers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{
            minHeight: isMobile ? 80 : 100,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent sx={{
              p: isMobile ? 1.5 : 2,
              '&:last-child': { pb: isMobile ? 1.5 : 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
                <PersonAdd color="info" sx={{ fontSize: isMobile ? 24 : 28 }} />
                <Box>
                  <Typography
                    variant={isMobile ? "h5" : "h6"}
                    sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
                  >
                    {analytics.newCustomersThisMonth}
                  </Typography>
                  <Typography
                    variant={isMobile ? "caption" : "body2"}
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                  >
                    New This Month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{
            minHeight: isMobile ? 80 : 100,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent sx={{
              p: isMobile ? 1.5 : 2,
              '&:last-child': { pb: isMobile ? 1.5 : 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
                <PersonAdd color="secondary" sx={{ fontSize: isMobile ? 24 : 28 }} />
                <Box>
                  <Typography
                    variant={isMobile ? "h5" : "h6"}
                    sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
                  >
                    {analytics.newCustomersThisDay || 0}
                  </Typography>
                  <Typography
                    variant={isMobile ? "caption" : "body2"}
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                  >
                    New This Day
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{
            minHeight: isMobile ? 80 : 100,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'translateY(-2px)' }
          }}>
            <CardContent sx={{
              p: isMobile ? 1.5 : 2,
              '&:last-child': { pb: isMobile ? 1.5 : 2 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
                <PersonAdd color="warning" sx={{ fontSize: isMobile ? 24 : 28 }} />
                <Box>
                  <Typography
                    variant={isMobile ? "h5" : "h6"}
                    sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}
                  >
                    {analytics.newCustomersThisWeek || 0}
                  </Typography>
                  <Typography
                    variant={isMobile ? "caption" : "body2"}
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                  >
                    New This Week
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Modal */}
      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        aria-labelledby="filter-modal-title"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Paper 
          sx={{ 
            p: isMobile ? 2.5 : 3.5, 
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxHeight: '90vh',
            overflowY: 'auto',
            width: isMobile ? '95%' : isTablet ? '85%' : '70%',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        >
          {/* Modal Header */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography 
              id="filter-modal-title"
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <FilterList sx={{ color: '#1976d2', fontSize: '1.8rem' }} />
              Filter Customers
            </Typography>
            <IconButton
              onClick={() => setFilterModalOpen(false)}
              sx={{
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' }
              }}
            >
              ×
            </IconButton>
          </Box>

          {/* Filter Content */}
          <Grid container spacing={isMobile ? 1.5 : 2.5} alignItems="flex-end">
            {/* Search Field - Full Width */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder={isMobile ? "Search..." : "Search customers by name, email, or phone..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: 1,
                    '&:hover fieldset': {
                      borderColor: '#1976d2'
                    }
                  },
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel sx={{ color: '#666' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#fafafa'
                    }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Source Filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel sx={{ color: '#666' }}>Source</InputLabel>
                <Select
                  value={sourceFilter}
                  label="Source"
                  onChange={(e) => setSourceFilter(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#fafafa'
                    }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="website">Website</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                  <MenuItem value="social_media">Social Media</MenuItem>
                  <MenuItem value="advertisement">Advertisement</MenuItem>
                  <MenuItem value="walk_in">Walk In</MenuItem>
                  <MenuItem value="phone_call">Phone Call</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Calendar Date Filter */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size={isMobile ? 'small' : 'medium'}
                      sx={{
                        backgroundColor: 'white',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root:hover fieldset': {
                          borderColor: '#1976d2'
                        }
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            {/* Month Filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel sx={{ color: '#666' }}>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#fafafa'
                    }
                  }}
                >
                  <MenuItem value="">All Months</MenuItem>
                  <MenuItem value="01">January</MenuItem>
                  <MenuItem value="02">February</MenuItem>
                  <MenuItem value="03">March</MenuItem>
                  <MenuItem value="04">April</MenuItem>
                  <MenuItem value="05">May</MenuItem>
                  <MenuItem value="06">June</MenuItem>
                  <MenuItem value="07">July</MenuItem>
                  <MenuItem value="08">August</MenuItem>
                  <MenuItem value="09">September</MenuItem>
                  <MenuItem value="10">October</MenuItem>
                  <MenuItem value="11">November</MenuItem>
                  <MenuItem value="12">December</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Year Filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel sx={{ color: '#666' }}>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: '#fafafa'
                    }
                  }}
                >
                  <MenuItem value="">All Years</MenuItem>
                  {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((year) => (
                    <MenuItem key={year} value={year.toString()}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Modal Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setSourceFilter('');
                    setSelectedDate(null);
                    setSelectedMonth('');
                    setSelectedYear('');
                  }}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    borderColor: '#dc3545',
                    color: '#dc3545',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                      borderColor: '#dc3545'
                    }
                  }}
                >
                  Clear All
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setFilterModalOpen(false)}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    backgroundColor: '#1976d2',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                >
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Modal>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Data Grid */}
      <Paper sx={{
        height: isMobile ? 400 : isTablet ? 500 : 600,
        width: '100%',
        overflow: 'hidden'
      }}>
        <DataGrid
          rows={customers}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          onSelectionModelChange={(newSelection) => {
            setSelectedCustomers(newSelection);
          }}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
          pageSize={pageSize}
          rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: pageSize },
            },
            columns: {
              columnVisibilityModel: columnVisibilityModel,
            },
          }}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          sx={{
            border: 'none',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              padding: isMobile ? '4px 8px' : '8px 12px',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#fafafa',
              borderBottom: '2px solid #e0e0e0',
              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                fontWeight: 600,
              },
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f8f9fa',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #e0e0e0',
            },
          }}
        />
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { m: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Are you sure you want to delete customer "{customerToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Form Dialog */}
      <CustomerForm
        open={customerFormOpen}
        onClose={() => {
          setCustomerFormOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleCustomerSave}
        customer={editingCustomer}
        loading={formLoading}
      />

      {/* Analytics Dialog */}
      <CustomerAnalytics
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        analytics={analytics}
      />

      {/* Bulk Operations Dialog */}
      <BulkCustomerOperations
        open={bulkOperationsDialogOpen}
        onClose={() => setBulkOperationsDialogOpen(false)}
        selectedCustomers={selectedCustomers}
        onOperationComplete={() => {
          fetchCustomers();
          fetchAnalytics();
          setSelectedCustomers([]);
        }}
      />

      {/* Customer Credentials Dialog */}
      <Dialog
        open={credentialsDialog.open}
        onClose={() => setCredentialsDialog({ open: false, credentials: null })}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { m: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{
          textAlign: 'center',
          color: 'success.main',
          fontSize: isMobile ? '1.25rem' : '1.5rem'
        }}>
          🎉 Customer Created Successfully!
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box sx={{ textAlign: 'center', py: isMobile ? 1 : 2 }}>
            <Typography
              variant={isMobile ? "body2" : "body1"}
              sx={{ mb: isMobile ? 2 : 3 }}
            >
              A new customer account has been created with login credentials:
            </Typography>

            <Paper sx={{
              p: isMobile ? 2 : 3,
              bgcolor: 'grey.50',
              mb: isMobile ? 1.5 : 2
            }}>
              <Grid container spacing={isMobile ? 1 : 2}>
                <Grid item xs={12}>
                  <Typography
                    variant={isMobile ? "caption" : "subtitle2"}
                    color="text.secondary"
                  >
                    Customer ID
                  </Typography>
                  <Typography
                    variant={isMobile ? "h6" : "h6"}
                    sx={{
                      fontFamily: 'monospace',
                      color: 'primary.main',
                      fontSize: isMobile ? '1rem' : '1.25rem'
                    }}
                  >
                    {credentialsDialog.credentials?.customer_id}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant={isMobile ? "caption" : "subtitle2"}
                    color="text.secondary"
                  >
                    Password
                  </Typography>
                  <Typography
                    variant={isMobile ? "h6" : "h6"}
                    sx={{
                      fontFamily: 'monospace',
                      color: 'primary.main',
                      fontSize: isMobile ? '1rem' : '1.25rem'
                    }}
                  >
                    {credentialsDialog.credentials?.customer_password}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Alert
              severity="info"
              sx={{
                textAlign: 'left',
                '& .MuiAlert-message': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }
              }}
            >
              <Typography variant={isMobile ? "caption" : "body2"}>
                <strong>Important:</strong> Please save these credentials and share them with the customer.
                They can use these to log into their account.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          justifyContent: 'center',
          pb: isMobile ? 2 : 3,
          px: isMobile ? 2 : 3
        }}>
          <Button
            onClick={() => setCredentialsDialog({ open: false, credentials: null })}
            variant="contained"
            size={isMobile ? "medium" : "large"}
            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
          >
            Got It!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
