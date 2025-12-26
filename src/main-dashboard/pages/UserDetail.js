import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Email,
  Phone,
  CalendarToday,
  ContactMail,
  FilterList,
  MoreVert,
  Reply,
  Visibility,
} from '@mui/icons-material';
import { usersAPI, favoritesAPI, enquiriesAPI, propertiesAPI } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { formatDateDDMMYYYY } from '../../loans/utils/dateFormatter';
import EnquiryForm from '../components/enquiries/EnquiryForm';
import EnquiryDetail from '../components/enquiries/EnquiryDetail';
import LoadingScreen from '../components/common/LoadingScreen';
import UserForm from '../components/users/UserForm';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userFavorites, setUserFavorites] = useState([]);
  const [userEnquiries, setUserEnquiries] = useState([]);
  // Expanded enquiries section state (for full table)
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, favoritesRes, enquiriesRes] = await Promise.all([
        usersAPI.getById(id),
        favoritesAPI.getByUser(id),
        enquiriesAPI.getAll({ user_id: id }),
      ]);

      const userData = userRes.data.user || userRes.data;

      setUser(userData);
      setUserFavorites(favoritesRes.data.favorites || []);
      setUserEnquiries(enquiriesRes.data.enquiries || enquiriesRes.data || []);
    } catch (error) {
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Fetch properties when id changes, and fetch enquiries after user data (so we can filter by email)
  useEffect(() => {
    if (id) {
      fetchEnqProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user && user.email) {
      fetchUserEnquiries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchEnqProperties = async () => {
    try {
      const response = await propertiesAPI.getAll({ includeInactive: 'true' });
      const propertiesData = response.data?.properties || response.data || [];
      setEnqProperties(propertiesData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch properties for enquiries', err);
    }
  };

  const fetchUserEnquiries = async () => {
    try {
      setEnqLoading(true);
      setEnqError(null);
      const response = await enquiriesAPI.getAll();
      const enquiriesData = response.data.enquiries || response.data || [];
      const email = (user && (user.email || user.user_email || user.contact_email)) || '';
      const filtered = enquiriesData.filter(e => {
        const eEmail = (e.email || e.user_email || e.contact_email || '').toLowerCase();
        return email && eEmail === String(email).toLowerCase();
      });
      setEnqEnquiries(filtered);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user enquiries', err);
      setEnqError('Failed to load enquiries');
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
      } catch (err) {
        setEnqError('Failed to delete enquiry');
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
        // For new enquiries, associate with the current user
        const enquiryWithUser = {
          ...enquiryData,
          user_id: user.id, // Associate enquiry with the user being viewed
          email: user.email, // Ensure email is set for filtering
          name: user.full_name // Ensure name is set
        };
        const response = await enquiriesAPI.create(enquiryWithUser);
        setEnqEnquiries([...(enqEnquiries || []), response.data]);
      }
      setEnqFormOpen(false);
      setEnqEditing(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save enquiry', err);
      setEnqError('Failed to save enquiry');
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
    } catch (err) {
      setEnqError('Failed to send reply');
    } finally {
      setEnqFormLoading(false);
    }
  };

  const handleEditUser = () => {
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  const handleSaveUser = async (userData) => {
    try {
      setSaving(true);
      await usersAPI.update(id, userData);
      
      // Refresh user data
      const userRes = await usersAPI.getById(id);
      setUser(userRes.data.user || userRes.data);
      
      setEditDialogOpen(false);
    } catch (error) {
      // You might want to show a toast notification here
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading user details..." />;
  }

  if (error || !user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error" component="div">
          {error || 'User not found'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/users')}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'primary';
      case 'agent':
        return 'secondary';
      case 'user':
        return 'default';
      case 'customer':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (emailConfirmed) => {
    return emailConfirmed ? 'success' : 'warning';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/users')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            mr: 2,
            backgroundColor: 'primary.main',
            fontSize: '1.5rem',
          }}
        >
          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            {user.full_name || 'User'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={user.role || 'user'}
              color={getRoleColor(user.role)}
            />
            <Chip
              label={user.email_confirmed ? 'Verified' : 'Pending'}
              color={getStatusColor(user.email_confirmed)}
            />
            <Typography variant="body2" color="text.secondary" component="span">
              User ID: {user.id}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEditUser}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
              User Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Email Address
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Phone Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {user.phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Joined Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {user.created_at ? formatDateDDMMYYYY(user.created_at) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Last Updated
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {user.updated_at ? formatDateDDMMYYYY(user.updated_at) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Customer Credentials Section */}
            {user.role === 'customer' && (user.customer_id || user.customer_password) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                  Customer Credentials
                </Typography>
                <Grid container spacing={2}>
                  {user.customer_id && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ContactMail sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" component="div">
                            Customer ID
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" component="div" color="primary">
                            {user.customer_id}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {user.customer_password && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ContactMail sx={{ mr: 1, color: 'secondary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" component="div">
                            Customer Password
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" component="div" color="secondary">
                            {user.customer_password}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </>
            )}

            {/* Sub-Admin Credentials Section */}
            {user.role === 'sub-admin' && user.sub_admin_password && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                  Sub-Admin Credentials
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ContactMail sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" component="div">
                          Sub-Admin Password
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" component="div" color="primary">
                          {user.sub_admin_password}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}

            {user.address && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                  Address
                </Typography>
                <Typography variant="body1" paragraph component="div">
                  {user.address}
                </Typography>
              </>
            )}

            {user.bio && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                  Bio
                </Typography>
                <Typography variant="body1" paragraph component="div">
                  {user.bio}
                </Typography>
              </>
            )}
          </Paper>

          {/* User Enquiries - full management section */}
          {user.role !== 'sub-admin' && (
            <Box sx={{ mt: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Enquiries for {user.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Project-wise enquiries and management tools ({enqEnquiries.length} shown)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={fetchUserEnquiries} disabled={enqLoading}>
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

            {enqError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEnqError(null)}>
                {enqError}
              </Alert>
            )}

            <Paper sx={{ height: 520 }}>
              <DataGrid
                rows={(enqEnquiries || []).filter(enq => {
                  const matchesStatus = enqFilters.status === 'all' || enq.status === enqFilters.status;
                  const matchesProperty = enqActiveTab === 'all' || enq.property_id === parseInt(enqActiveTab);
                  return matchesStatus && matchesProperty;
                })}
                columns={[
                  {
                    field: 'name',
                    headerName: 'Customer',
                    flex: 1,
                    minWidth: 180,
                    renderCell: (params) => (
                      <Box>
                        <Typography variant="body2" fontWeight="medium">{params.row.name || params.row.user_name || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">{params.row.email || params.row.user_email || 'N/A'}</Typography>
                      </Box>
                    ),
                  },
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

            {/* Actions Menu */}
            <Menu anchorEl={enqAnchorEl} open={Boolean(enqAnchorEl)} onClose={handleEnqMenuClose}>
              <MenuItem onClick={handleEnqView}><Visibility sx={{ mr: 1 }} /> View Details</MenuItem>
              <MenuItem onClick={handleEnqReply}><Reply sx={{ mr: 1 }} /> Reply to Enquiry</MenuItem>
              <MenuItem onClick={handleEnqDeleteClick} sx={{ color: 'error.main' }}><Delete sx={{ mr: 1 }} /> Delete Enquiry</MenuItem>
            </Menu>

            {/* Delete Dialog */}
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

            {/* Enquiry Form Dialog */}
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
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Stats */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                Activity Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Total Favorites
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary" component="div">
                      {userFavorites.length}
                    </Typography>
                  </Box>
                </Grid>
                {user.role !== 'sub-admin' && (
                  <Grid item xs={4}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" component="div">
                        Total Enquiries
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="secondary" component="div">
                        {userEnquiries.length}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Account Status
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {user.email_confirmed ? 'Active' : 'Pending Verification'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Favorite Properties */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                Favorite Properties
              </Typography>
              {userFavorites.length > 0 ? (
                <List dense>
                  {userFavorites.slice(0, 5).map((favorite) => (
                    <ListItem key={favorite.id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={favorite.property_title || `Property #${favorite.property_id}`}
                        secondary={favorite.created_at ? formatDateDDMMYYYY(favorite.created_at) : ''}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" component="div">
                  No favorite properties.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit User Dialog */}
      <UserForm
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        user={user}
        onSave={handleSaveUser}
        loading={saving}
      />
    </Box>
  );
};

export default UserDetail;