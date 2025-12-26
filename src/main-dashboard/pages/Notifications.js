import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  FormControlLabel,
  Switch,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MarkEmailRead,
  Delete,
  Refresh,
  Search,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNotifications } from '../contexts/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 25);
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  // Fetch notifications from API
  const fetchNotificationsData = useCallback(async () => {
    const params = {
      limit: 1000, // Get all notifications for client-side filtering
      unread_only: false,
    };

    const response = await fetchNotifications(params);
    return response?.data?.notifications || [];
  }, [fetchNotifications]);

  // Apply filters to notifications
  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title?.toLowerCase().includes(search) ||
        notification.message?.toLowerCase().includes(search) ||
        notification.type?.toLowerCase().includes(search)
      );
    }

    // Unread only filter
    if (showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.is_read);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, showUnreadOnly]);

  // Load notifications on component mount
  useEffect(() => {
    fetchNotificationsData();
  }, [fetchNotificationsData]);

  // Apply filters when notifications or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleRefresh = () => {
    fetchNotificationsData();
  };

  const handleToggleUnreadOnly = (event) => {
    setShowUnreadOnly(event.target.checked);
  };


  const getNotificationColor = (type) => {
    switch (type) {
      case 'enquiry':
        return 'primary';
      case 'user_registration':
        return 'secondary';
      case 'property_added':
        return 'success';
      default:
        return 'info';
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  // DataGrid columns definition
  const columns = [
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getNotificationColor(params.value)}
          variant="filled"
        />
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {params.value}
          </Typography>
          {!params.row.is_read && (
            <Chip
              label="New"
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
            />
          )}
        </Box>
      ),
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1,
      minWidth: 300,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Time',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {formatTimeAgo(params.value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!params.row.is_read && (
            <IconButton
              size="small"
              onClick={() => markAsRead(params.row.id)}
              color="primary"
              title="Mark as read"
            >
              <MarkEmailRead />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => deleteNotification(params.row.id)}
            color="error"
            title="Delete notification"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All notifications are read'
            }
          </Typography>
        </Box>
        
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 2 : 3 }}>
        <Box sx={{
          display: 'flex',
          gap: isMobile ? 1 : 2,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder={isMobile ? "Search notifications..." : "Search notifications by title, message, or type..."}
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
          <FormControlLabel
            control={
              <Switch
                checked={showUnreadOnly}
                onChange={handleToggleUnreadOnly}
              />
            }
            label="Unread only"
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {isMobile ? '' : 'Refresh'}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="contained"
              startIcon={<MarkEmailRead />}
              onClick={markAllAsRead}
              size={isMobile ? "small" : "medium"}
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              {isMobile ? 'Mark Read' : 'Mark All Read'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Notifications Table */}
      <Paper sx={{
        height: isMobile ? 400 : isTablet ? 500 : 600,
        width: '100%',
        overflow: 'hidden'
      }}>
        <DataGrid
          rows={filteredNotifications}
          columns={columns}
          pageSize={pageSize}
          rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
          loading={loading}
          rowHeight={isMobile ? 70 : 80}
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
          components={{
            NoRowsOverlay: () => (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3
              }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  {showUnreadOnly
                    ? 'All your notifications have been read'
                    : 'Notifications will appear here when users send enquiries'
                  }
                </Typography>
              </Box>
            ),
          }}
        />
      </Paper>
    </Box>
  );
};

export default Notifications;