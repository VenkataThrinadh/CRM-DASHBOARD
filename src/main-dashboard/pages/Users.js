import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Email,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '../../loans/utils/dateFormatter';
import { usersAPI } from '../services/api';
import UserForm from '../components/users/UserForm';
import BulkUserOperations from '../components/users/BulkUserOperations';

const Users = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [bulkOperationsDialogOpen, setBulkOperationsDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filters, setFilters] = useState({ role: 'all', status: 'all' });
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.data.users || []);
    } catch (error) {
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleView = () => {
    if (selectedUser) {
      navigate(`/users/${selectedUser.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedUser) {
      handleEditUser(selectedUser);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setUserToDelete(selectedUser);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await usersAPI.delete(userToDelete.id);
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } catch (error) {
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormOpen(true);
  };

  const handleUserFormClose = () => {
    setUserFormOpen(false);
    setEditingUser(null);
  };

  const handleUserSave = async (userData, avatarFile) => {
    try {
      setFormLoading(true);
      
      if (editingUser) {
        // Update existing user
        const response = await usersAPI.update(editingUser.id, userData);
        
        // Upload avatar if provided
        if (avatarFile) {
          await usersAPI.uploadAvatar(editingUser.id, avatarFile);
        }
        
        // Update users list
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...response.data } : u));
      } else {
        // Create new user
        const response = await usersAPI.create(userData);
        
        // Upload avatar if provided
        if (avatarFile) {
          await usersAPI.uploadAvatar(response.data.id, avatarFile);
        }
        
        // Add to users list
        setUsers([...users, response.data]);
      }
      
      setUserFormOpen(false);
      setEditingUser(null);
    } catch (error) {
      setError('Failed to save user. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

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

  const filteredUsers = users
    .filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(user => {
      const roleMatch = filters.role === 'all' || user.role?.toLowerCase() === filters.role;
      const statusMatch =
        filters.status === 'all' ||
        (filters.status === 'verified' && user.email_confirmed) ||
        (filters.status === 'pending' && !user.email_confirmed);

      return roleMatch && statusMatch;
    });

  const columns = [
    {
      field: 'avatar',
      headerName: 'Avatar',
      width: isMobile ? 60 : 80,
      renderCell: (params) => (
        <Avatar sx={{
          backgroundColor: 'primary.main',
          width: isMobile ? 32 : 40,
          height: isMobile ? 32 : 40,
          fontSize: isMobile ? '0.875rem' : '1rem'
        }}>
          {params.row.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: 'full_name',
      headerName: 'Full Name',
      flex: 1,
      minWidth: isMobile ? 150 : 200,
      renderCell: (params) => (
        <Box>
          <Typography
            variant="body2"
            fontWeight="medium"
            sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
          >
            {params.value || 'N/A'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
          >
            ID: {params.row.id}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: isMobile ? 200 : 250,
      hide: isMobile, // Hide email on mobile to save space
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Email sx={{ fontSize: isMobile ? 14 : 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography
            variant="body2"
            sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: isMobile ? 80 : 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'user'}
          size="small"
          color={getRoleColor(params.value)}
          sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
        />
      ),
    },
    {
      field: 'email_confirmed',
      headerName: 'Status',
      width: isMobile ? 80 : 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Verified' : 'Pending'}
          size="small"
          color={getStatusColor(params.value)}
          sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Joined',
      width: isMobile ? 100 : 120,
      hide: isMobile, // Hide joined date on mobile
      renderCell: (params) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: isMobile ? '0.875rem' : '0.875rem' }}
        >
          {formatDateDDMMYYYY(params.value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: isMobile ? 60 : 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => handleMenuOpen(event, params.row)}
          sx={{ padding: isMobile ? '4px' : '8px' }}
        >
          <MoreVert sx={{ fontSize: isMobile ? 18 : 20 }} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Page Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: isMobile ? 2 : 3,
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: isSmallScreen ? 2 : 0
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: isSmallScreen ? '1.5rem' : isMobile ? '1.75rem' : '2.125rem' }}
          >
            App Users
          </Typography>
          <Typography
            variant={isMobile ? "body2" : "body1"}
            color="text.secondary"
            sx={{ maxWidth: isSmallScreen ? '100%' : '500px' }}
          >
            Manage user accounts and permissions
          </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          gap: isMobile ? 1 : 1,
          flexWrap: 'wrap',
          alignItems: 'center',
          width: isSmallScreen ? '100%' : 'auto'
        }}>
          {selectedUsers.length > 0 && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setBulkOperationsDialogOpen(true)}
              size={isMobile ? "small" : "medium"}
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              Bulk Actions ({selectedUsers.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddUser}
            size={isMobile ? "small" : "large"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {isMobile ? 'Add' : 'Add User'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 2 : 3 }}>
        <Box sx={{
          display: 'flex',
          gap: isMobile ? 1 : 2,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder={isMobile ? "Search users..." : "Search users by name or email..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{
              flexGrow: 1,
              minWidth: isMobile ? '100%' : '200px',
              '& .MuiInputBase-root': {
                fontSize: isMobile ? '0.875rem' : '1rem'
              }
            }}
            size={isMobile ? "small" : "medium"}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(event) => setFilterMenuAnchorEl(event.currentTarget)}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {isMobile ? '' : 'Filters'}
          </Button>
        </Box>
      </Paper>

      <Menu
        anchorEl={filterMenuAnchorEl}
        open={Boolean(filterMenuAnchorEl)}
        onClose={() => setFilterMenuAnchorEl(null)}
        MenuListProps={{ 'aria-labelledby': 'users-filter-button' }}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 300,
            maxWidth: '100vw',
            maxHeight: isMobile ? '80vh' : 'auto'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            Role
          </Typography>
          {[
            { label: 'All Roles', value: 'all' },
            { label: 'Admin', value: 'admin' },
            { label: 'Agent', value: 'agent' },
            { label: 'User', value: 'user' },
            { label: 'Customer', value: 'customer' },
          ].map((option) => (
            <MenuItem
              key={option.value}
              selected={filters.role === option.value}
              onClick={() => {
                setFilters((prev) => ({ ...prev, role: option.value }));
                setFilterMenuAnchorEl(null);
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Box>
        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" gutterBottom>
            Status
          </Typography>
          {[
            { label: 'All Statuses', value: 'all' },
            { label: 'Verified', value: 'verified' },
            { label: 'Pending', value: 'pending' },
          ].map((option) => (
            <MenuItem
              key={option.value}
              selected={filters.status === option.value}
              onClick={() => {
                setFilters((prev) => ({ ...prev, status: option.value }));
                setFilterMenuAnchorEl(null);
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Box>
      </Menu>

      {/* Users Table */}
      <Paper sx={{
        height: isMobile ? 400 : isTablet ? 500 : 600,
        width: '100%',
        overflow: 'hidden'
      }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          pageSize={pageSize}
          rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50]}
          loading={loading}
          checkboxSelection
          disableSelectionOnClick
          selectionModel={selectedUsers.map(u => u.id)}
          onSelectionModelChange={(newSelection) => {
            const selectedUsersData = filteredUsers.filter(u => newSelection.includes(u.id));
            setSelectedUsers(selectedUsersData);
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

      {/* Actions Menu */}
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
          Edit User
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
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
            Are you sure you want to delete "{userToDelete?.full_name || userToDelete?.email}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={handleDeleteCancel}
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

      {/* User Form Dialog */}
      <UserForm
        open={userFormOpen}
        onClose={handleUserFormClose}
        user={editingUser}
        onSave={handleUserSave}
        loading={formLoading}
      />

      {/* Bulk Operations Dialog */}
      <Dialog
        open={bulkOperationsDialogOpen}
        onClose={() => setBulkOperationsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { m: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          Bulk User Operations
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 1 : 3 }}>
          <BulkUserOperations
            selectedUsers={selectedUsers}
            onOperationComplete={(operation, results) => {
              // Refresh data after bulk operation
              fetchUsers();
              // Clear selection
              setSelectedUsers([]);
              // Close dialog
              setBulkOperationsDialogOpen(false);
            }}
            onClose={() => setBulkOperationsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Users;