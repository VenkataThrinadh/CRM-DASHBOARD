import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tabs,
  Tab,

  Menu,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Phone,
  Email,
  LocationOn,
  Badge,
  Lock,
  Business,
  Save,
  Cancel,
  AccountCircle,
  ContactPhone,
  Home,
  Cake,
  PersonAdd,
  SupervisorAccount,
  Assignment,
  VisibilityOff,
  Visibility,
  FilterList,
  MoreVert,
  Reply,
  Delete,
  ContactMail,
} from '@mui/icons-material';
import { customersAPI, enquiriesAPI, propertiesAPI } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { formatDateDDMMYYYY } from '../../loans/utils/dateFormatter';
import EnquiryForm from '../components/enquiries/EnquiryForm';
import EnquiryDetail from '../components/enquiries/EnquiryDetail';
import CustomerStaffAssignment from '../components/customers/CustomerStaffAssignment';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Enquiries section states (scoped to this page)
  const [enqEnquiries, setEnqEnquiries] = useState([]);
  const [enqLoading, setEnqLoading] = useState(true);
  const [enqError, setEnqError] = useState(null);
  const [enqAnchorEl, setEnqAnchorEl] = useState(null);
  const [enqSelected, setEnqSelected] = useState(null);
  const [enqDeleteDialogOpen, setEnqDeleteDialogOpen] = useState(false);
  const [enqToDelete, setEnqToDelete] = useState(null);
  const [enqFormOpen, setEnqFormOpen] = useState(false);
  const [enqEditing, setEnqEditing] = useState(null);
  const [enqFormLoading, setEnqFormLoading] = useState(false);
  const [enqFilterMenuAnchorEl, setEnqFilterMenuAnchorEl] = useState(null);
  const [enqFilters, setEnqFilters] = useState({ status: 'all' });
  const [enqReplyDialogOpen, setEnqReplyDialogOpen] = useState(false);
  const [enqReplyMessage, setEnqReplyMessage] = useState('');
  const [enqToReply, setEnqToReply] = useState(null);
  const [enqPageSize, setEnqPageSize] = useState(10);
  const [enqActiveTab, setEnqActiveTab] = useState('all');
  const [enqProperties, setEnqProperties] = useState([]);
  const [enqViewDialogOpen, setEnqViewDialogOpen] = useState(false);
  const [enqSelectedId, setEnqSelectedId] = useState(null);
  // Summary related
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getById(id);
      setCustomer(response.data.customer);
      setEditFormData(response.data.customer);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching customer details:', error);
      setError('Failed to load customer details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch customer data
  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  // Enquiries section: fetch properties and enquiries for this customer (project-wise tabs + table)
  useEffect(() => {
    if (customer?.email) {
      fetchCustomerEnquiries();
      fetchEnqProperties();
      fetchCustomerFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  // Recompute last activity when enquiries or customer change
  useEffect(() => {
    computeLastActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enqEnquiries, customer]);

  const fetchCustomerFavorites = async () => {
    if (!customer?.id) return;
    try {
      setFavoritesLoading(true);
      // customersAPI provides a helper for customer favorites
      const response = await customersAPI.getCustomerFavorites(customer.id);
      const favs = response.data.favorites || response.data || [];
      setFavoritesCount(Array.isArray(favs) ? favs.length : 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch customer favorites:', error);
      setFavoritesCount(0);
    } finally {
      setFavoritesLoading(false);
      computeLastActivity();
    }
  };

  const computeLastActivity = () => {
    // Determine the most recent timestamp among enquiries, favorites and customer updated_at
    let latest = null;
    // enquiries
    (enqEnquiries || []).forEach(e => {
      if (e.created_at) {
        const d = new Date(e.created_at);
        if (!latest || d > latest) latest = d;
      }
    });
    // customer updated_at or created_at
    if (customer?.updated_at) {
      const d = new Date(customer.updated_at);
      if (!latest || d > latest) latest = d;
    }
    if (customer?.created_at) {
      const d = new Date(customer.created_at);
      if (!latest || d > latest) latest = d;
    }
    // favorites are not guaranteed to include timestamps; if they do, attempt to use them
    // (This is defensive: many APIs include created_at on favorites)
    // No need to fetch favorites list here — rely on favoritesCount only; if favorites API returns timestamps, compute elsewhere.

    if (latest) {
      setLastActivity(formatDateDDMMYYYY(latest));
    } else {
      setLastActivity(null);
    }
  };

  const fetchEnqProperties = async () => {
    try {
      const response = await propertiesAPI.getAll({ includeInactive: 'true' });
      const propertiesData = response.data?.properties || response.data || [];
      setEnqProperties(propertiesData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch properties for customer enquiries:', error);
    }
  };

  const fetchCustomerEnquiries = async () => {
    try {
      setEnqLoading(true);
      setEnqError(null);
      const response = await enquiriesAPI.getAll();
      const enquiriesData = response.data.enquiries || response.data || [];
      // Filter enquiries by customer's email
      const filteredEnquiries = enquiriesData.filter(enquiry => 
        enquiry.email === customer?.email || enquiry.user_email === customer?.email
      );
      setEnqEnquiries(filteredEnquiries);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load customer enquiries:', error);
      setEnqError(error.response?.data?.error || 'Failed to load enquiries.');
      setEnqEnquiries([]);
    } finally {
      setEnqLoading(false);
    }
  };

  const handleEnqMenuOpen = (event, enquiry) => {
    setEnqAnchorEl(event.currentTarget);
    setEnqSelected(enquiry);
  };

  const handleEnqMenuClose = () => {
    setEnqAnchorEl(null);
    setEnqSelected(null);
  };

  const handleEnqView = () => {
    if (enqSelected) {
      setEnqSelectedId(enqSelected.id);
      setEnqViewDialogOpen(true);
    }
    handleEnqMenuClose();
  };

  const handleEnqReply = () => {
    if (enqSelected) {
      setEnqToReply(enqSelected);
      setEnqReplyMessage('');
      setEnqReplyDialogOpen(true);
    }
    handleEnqMenuClose();
  };

  const handleEnqDeleteClick = () => {
    setEnqToDelete(enqSelected);
    setEnqDeleteDialogOpen(true);
    handleEnqMenuClose();
  };

  const handleEnqDeleteConfirm = async () => {
    if (enqToDelete) {
      try {
        await enquiriesAPI.delete(enqToDelete.id);
        setEnqEnquiries(enqEnquiries.filter(e => e.id !== enqToDelete.id));
        setEnqDeleteDialogOpen(false);
        setEnqToDelete(null);
      } catch (error) {
        setEnqError('Failed to delete enquiry. Please try again.');
      }
    }
  };

  const handleEnqAdd = () => {
    setEnqEditing(null);
    setEnqFormOpen(true);
  };

  const handleEnqFormClose = () => {
    setEnqFormOpen(false);
    setEnqEditing(null);
  };

  const handleEnqSave = async (enquiryData) => {
    try {
      setEnqFormLoading(true);
      if (enqEditing) {
        const response = await enquiriesAPI.update(enqEditing.id, enquiryData);
        setEnqEnquiries(enqEnquiries.map(e => e.id === enqEditing.id ? { ...e, ...response.data } : e));
      } else {
        // For new enquiries, associate with the current customer
        const enquiryWithCustomer = {
          ...enquiryData,
          user_id: customer.id, // Associate enquiry with the customer being viewed
          email: customer.email, // Ensure email is set for filtering
          name: customer.full_name // Ensure name is set
        };
        const response = await enquiriesAPI.create(enquiryWithCustomer);
        setEnqEnquiries([...(enqEnquiries || []), response.data]);
      }
      setEnqFormOpen(false);
      setEnqEditing(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Enquiry save error (customer section):', error);
      setEnqError(error.response?.data?.error || 'Failed to save enquiry.');
    } finally {
      setEnqFormLoading(false);
    }
  };

  const handleEnqReplySend = async () => {
    if (!enqToReply || !enqReplyMessage.trim()) return;
    try {
      setEnqFormLoading(true);
      await enquiriesAPI.respond(enqToReply.id, enqReplyMessage);
      setEnqEnquiries(enqEnquiries.map(e => e.id === enqToReply.id ? { ...e, status: 'responded' } : e));
      setEnqReplyDialogOpen(false);
      setEnqReplyMessage('');
      setEnqToReply(null);
    } catch (error) {
      setEnqError('Failed to send reply. Please try again.');
    } finally {
      setEnqFormLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditFormData({ ...customer });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditFormData({});
    setShowPassword(false);
  };

  const handleEditSave = async () => {
    try {
      setEditLoading(true);
      const response = await customersAPI.update(id, editFormData);
      setCustomer(response.data.customer);
      setEditDialogOpen(false);
      setEditFormData({});
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating customer:', error);
      setError('Failed to update customer. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return formatDateDDMMYYYY(dateString);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'blocked': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getCustomerTypeColor = (type) => {
    switch (type) {
      case 'individual': return 'primary';
      case 'business': return 'secondary';
      case 'investor': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" width="100%" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" width="100%" height={200} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Customer not found.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/customers')}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              Customer Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage customer information
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={handleEditClick}
        >
          Edit Customer
        </Button>
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Customer Information Card */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 'fit-content' }}>
            <CardHeader
              avatar={
                <Avatar
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: 'primary.main',
                    fontSize: '1.5rem'
                  }}
                >
                  {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
                </Avatar>
              }
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" component="h2">
                    {customer.full_name || 'Unknown Customer'}
                  </Typography>
                  <Chip
                    label={customer.status || 'Unknown'}
                    color={getStatusColor(customer.status)}
                    size="small"
                  />
                  <Chip
                    label={customer.customer_type || 'Individual'}
                    color={getCustomerTypeColor(customer.customer_type)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              }
              subheader={
                <Typography variant="body2" color="text.secondary">
                  Customer since {formatDate(customer.created_at)}
                </Typography>
              }
              action={
                <Tooltip title="Edit Customer Information">
                  <IconButton onClick={handleEditClick}>
                    <Edit />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ContactPhone color="primary" />
                    Contact Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Phone color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Phone Number"
                        secondary={customer.phone || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Email color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Address"
                        secondary={customer.email || 'Not provided'}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Badge color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Customer ID"
                        secondary={customer.customer_id || 'Not assigned'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Lock color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Customer Password"
                        secondary={customer.customer_password ? '••••••••' : 'Not set'}
                      />
                    </ListItem>
                  </List>
                </Grid>

                {/* Personal Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <AccountCircle color="primary" />
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Home color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={customer.address || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="City"
                        secondary={customer.city || 'Not provided'}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Cake color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Date of Birth"
                        secondary={formatDate(customer.date_of_birth)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonAdd color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Registration Date"
                        secondary={formatDate(customer.created_at)}
                      />
                    </ListItem>
                  </List>
                </Grid>

                {/* Business Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <Business color="primary" />
                    Business Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <SupervisorAccount color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Assigned Sales Executive"
                        secondary="Not assigned" // This would come from a relationship
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions & Summary Card */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Quick Actions Card */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Quick Actions"
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEditClick}
                      >
                        Edit Information
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assignment />}
                        disabled
                      >
                        View Enquiries
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Business />}
                        disabled
                      >
                        View Properties
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Customer Summary Card */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Customer Summary"
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                          <Typography variant="h4" color="primary" align="center">
                            {enqLoading ? <Skeleton width={60} /> : (enqEnquiries?.length || 0)}
                          </Typography>
                          <Typography variant="body2" align="center" color="text.secondary">
                            Total Enquiries
                          </Typography>
                    </Grid>
                    <Grid item xs={6}>
                          <Typography variant="h4" color="secondary" align="center">
                            {favoritesLoading ? <Skeleton width={60} /> : (favoritesCount || 0)}
                          </Typography>
                          <Typography variant="body2" align="center" color="text.secondary">
                            Properties Viewed
                          </Typography>
                    </Grid>
                    <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Last Activity: {lastActivity || 'Never'}
                          </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            {/* Staff Assignment Component - positioned under Customer Summary */}
            <Grid item xs={12}>
              <CustomerStaffAssignment
                customerId={id}
                customer={customer}
                onAssignmentChange={(assignedStaff) => {
                  // Refresh customer data to show updated assignment
                  fetchCustomerDetails();
                }}
              />
            </Grid>
          </Grid>
        </Grid>

        
      </Grid>

      {/* Customer Enquiries Section (project-wise tabs + enquiries table) */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Enquiries for {customer.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project-wise enquiries and full management tools for this customer ({enqEnquiries.length} shown)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={fetchCustomerEnquiries} disabled={enqLoading}>
              {enqLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              onClick={(ev) => setEnqFilterMenuAnchorEl(ev.currentTarget)}
              startIcon={<FilterList />}
            >
              Filters
            </Button>
            <Button variant="contained" onClick={handleEnqAdd} startIcon={<ContactMail />}>
              Add Enquiry
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={enqActiveTab}
            onChange={(e, v) => setEnqActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label={`All (${enqEnquiries.length})`} value="all" />
            {enqProperties.map((p) => {
              const count = (enqEnquiries || []).filter(e => e.property_id === p.id).length;
              return <Tab key={p.id} label={`${p.title} (${count})`} value={p.id.toString()} />;
            })}
          </Tabs>
        </Paper>

        {/* Filters Menu */}
        <Menu
          anchorEl={enqFilterMenuAnchorEl}
          open={Boolean(enqFilterMenuAnchorEl)}
          onClose={() => setEnqFilterMenuAnchorEl(null)}
        >
          {[
            { label: 'All Statuses', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Responded', value: 'responded' },
          ].map((opt) => (
            <MenuItem
              key={opt.value}
              selected={enqFilters.status === opt.value}
              onClick={() => {
                setEnqFilters((prev) => ({ ...prev, status: opt.value }));
                setEnqFilterMenuAnchorEl(null);
              }}
            >
              {opt.label}
            </MenuItem>
          ))}
        </Menu>

        {/* Error Alert */}
        {enqError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEnqError(null)}>
            {enqError}
          </Alert>
        )}

        {/* Table */}
        <Paper sx={{ height: 520 }}>
          <DataGrid
            rows={(enqEnquiries || []).filter(enq => {
              const matchesStatus = enqFilters.status === 'all' || enq.status === enqFilters.status;
              const matchesProperty = enqActiveTab === 'all' || enq.property_id === parseInt(enqActiveTab);
              return matchesStatus && matchesProperty;
            })}
            columns={[
              { field: 'name', headerName: 'Customer', flex: 1, minWidth: 180, renderCell: (params) => (
                <Box>
                  <Typography variant="body2" fontWeight="medium">{params.row.name || params.row.user_name || 'N/A'}</Typography>
                  <Typography variant="caption" color="text.secondary">{params.row.email || params.row.user_email || 'N/A'}</Typography>
                </Box>
              )},
              { field: 'phone', headerName: 'Phone', width: 140 },
              { field: 'property_title', headerName: 'Property', flex: 1, minWidth: 160 },
              { field: 'enquiry_type', headerName: 'Type', width: 120 },
              { field: 'message', headerName: 'Message', flex: 1, minWidth: 220 },
              { field: 'status', headerName: 'Status', width: 120 },
              { field: 'created_at', headerName: 'Date', width: 120, renderCell: (p) => (<Typography variant="caption">{formatDateDDMMYYYY(p.value)}</Typography>) },
              { field: 'actions', headerName: 'Actions', width: 80, sortable: false, filterable: false, renderCell: (params) => (
                <IconButton size="small" onClick={(e) => handleEnqMenuOpen(e, params.row)}><MoreVert /></IconButton>
              )},
            ]}
            pageSize={enqPageSize}
            onPageSizeChange={(s) => setEnqPageSize(s)}
            rowsPerPageOptions={[10, 25, 50]}
            loading={enqLoading}
          />
        </Paper>

        {/* Actions Menu for enquiries */}
        <Menu anchorEl={enqAnchorEl} open={Boolean(enqAnchorEl)} onClose={handleEnqMenuClose}>
          <MenuItem onClick={handleEnqView}><Visibility sx={{ mr: 1 }} /> View Details</MenuItem>
          <MenuItem onClick={handleEnqReply}><Reply sx={{ mr: 1 }} /> Reply to Enquiry</MenuItem>
          <MenuItem onClick={handleEnqDeleteClick} sx={{ color: 'error.main' }}><Delete sx={{ mr: 1 }} /> Delete Enquiry</MenuItem>
        </Menu>

        {/* Delete confirmation dialog */}
        <Dialog open={enqDeleteDialogOpen} onClose={() => setEnqDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this enquiry from "{enqToDelete?.name}"?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEnqDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleEnqDeleteConfirm}>Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Enquiry Form Dialog (create/edit) */}
        <EnquiryForm open={enqFormOpen} onClose={handleEnqFormClose} enquiry={enqEditing} onSave={handleEnqSave} loading={enqFormLoading} />

        {/* Reply Dialog */}
        <Dialog open={enqReplyDialogOpen} onClose={() => setEnqReplyDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Reply to Enquiry</DialogTitle>
          <DialogContent>
            {enqToReply && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Enquiry from: {enqToReply.name || enqToReply.user_name}</Typography>
                <Typography variant="caption" color="text.secondary">Email: {enqToReply.email || enqToReply.user_email}</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1 }}><Typography>{enqToReply.message}</Typography></Paper>
              </Box>
            )}
            <TextField autoFocus margin="dense" fullWidth multiline rows={6} value={enqReplyMessage} onChange={(e) => setEnqReplyMessage(e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEnqReplyDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleEnqReplySend} disabled={!enqReplyMessage.trim()}>Send Reply</Button>
          </DialogActions>
        </Dialog>

        {/* View Enquiry Dialog */}
        <Dialog open={enqViewDialogOpen} onClose={() => setEnqViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogContent>
            <EnquiryDetail enquiryId={enqSelectedId} onClose={() => setEnqViewDialogOpen(false)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEnqViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Edit />
            Edit Customer Information
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={editFormData.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={editFormData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer ID"
                value={editFormData.customer_id || ''}
                onChange={(e) => handleInputChange('customer_id', e.target.value)}
                helperText="Unique identifier for the customer"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Password"
                type={showPassword ? 'text' : 'password'}
                value={editFormData.customer_password || ''}
                onChange={(e) => handleInputChange('customer_password', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
                helperText="Password for customer portal access"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={editFormData.date_of_birth ? editFormData.date_of_birth.split('T')[0] : ''}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Address Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={editFormData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={editFormData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={editFormData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={editFormData.zip_code || ''}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
              />
            </Grid>

            {/* Customer Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Customer Settings
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status || 'active'}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={editFormData.customer_type || 'individual'}
                  label="Customer Type"
                  onChange={(e) => handleInputChange('customer_type', e.target.value)}
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="investor">Investor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleEditClose}
            startIcon={<Cancel />}
            disabled={editLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            startIcon={<Save />}
            loading={editLoading}
            disabled={editLoading}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetail;