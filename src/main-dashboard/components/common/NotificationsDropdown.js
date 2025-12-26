import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Avatar,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone,
  ContactMail,
  Person,
  Home,
  MarkEmailRead,
  Delete,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown = () => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    if (notifications.length === 0) {
      fetchNotifications({ limit: 10 });
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type) => {
    // Render icon with 'inherit' color so it takes Avatar color (white)
    switch (type) {
      case 'enquiry':
        return <ContactMail color="inherit" fontSize="small" />;
      case 'user_registration':
        return <Person color="inherit" fontSize="small" />;
      case 'property_added':
        return <Home color="inherit" fontSize="small" />;
      default:
        return <NotificationsIcon color="inherit" fontSize="small" />;
    }
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

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ ml: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNone />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '90vw', sm: 380, md: 420 },
            maxHeight: 520,
            overflow: 'visible',
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                startIcon={<MarkEmailRead />}
              >
                Mark all read
              </Button>
            )}
          </Box>
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Notifications List */}
        <Box sx={{ maxHeight: 380, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Loading notifications...
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsNone sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                sx={{
                  p: 1.25,
                  pr: 2,
                  borderLeft: !notification.is_read ? 3 : 0,
                  borderLeftColor: 'primary.main',
                  backgroundColor: !notification.is_read ? 'action.hover' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                  alignItems: 'center',
                }}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <ListItemIcon sx={{ minWidth: 56, alignSelf: 'center', mr: 1 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: '#1976d2',
                        color: 'common.white',
                        boxShadow: 1,
                      }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemIcon>

                <ListItemText
                  primaryTypographyProps={{
                    sx: { fontWeight: 600 },
                  }}
                  sx={{ ml: 1.5, mr: 1, minWidth: 0, flex: 1 }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium" noWrap sx={{ maxWidth: '70%' }}>
                        {notification.title}
                      </Typography>
                      {!notification.is_read && (
                        <Chip
                          label="New"
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatTimeAgo(notification.created_at)}
                      </Typography>
                    </Box>
                  }
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 'auto', alignItems: 'center' }}>
                  {!notification.is_read && (
                    <Tooltip title="Mark as read">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                      >
                        <MarkEmailRead fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(notification.id, e)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>

        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button
                size="small"
                onClick={() => {
                  handleClose();
                  navigate('/notifications');
                }}
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationsDropdown;