/**
 * Reusable Components for Loans Module
 * These components are shared across different loan pages
 */

import React from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * DetailPanelHeader Component
 * Displays the header of the detail panel
 */
export const DetailPanelHeader = ({ title, onClose }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
    <Typography variant="h6" fontWeight="bold">
      {title}
    </Typography>
    <IconButton onClick={onClose} size="small">
      <CloseIcon />
    </IconButton>
  </Box>
);

/**
 * DetailPanelContainer Component
 * Main container for detail panels with responsive drawer behavior
 */
export const DetailPanelContainer = ({ children, open, onClose, title = 'Details' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 400,
          maxHeight: isMobile ? '80vh' : '100vh',
          boxShadow: isMobile ? '0 -2px 10px rgba(0,0,0,0.1)' : '0 -2px 10px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <DetailPanelHeader title={title} onClose={onClose} />
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          {children}
        </Box>
      </Box>
    </Drawer>
  );
};

/**
 * SplitViewLayout Component
 * Provides a split-view layout with list on left and details on right
 */
export const SplitViewLayout = ({ leftPanel, rightPanel, isMobile }) => {
  return (
    <Box sx={{ display: 'flex', gap: 0, height: '100%' }}>
      {/* Left side - List */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {leftPanel}
      </Box>

      {/* Right side - Detail Panel (visible only on desktop) */}
      {!isMobile && (
        <Box sx={{ width: 400, borderLeft: '1px solid #e0e0e0', overflowY: 'auto' }}>
          {rightPanel}
        </Box>
      )}
    </Box>
  );
};

/**
 * DetailInfo Component
 * Displays key-value information pairs in the detail panel
 */
export const DetailInfo = ({ icon: Icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
    {Icon && <Icon sx={{ fontSize: 18, mr: 1.5, mt: 0.5, color: 'primary.main' }} />}
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || 'N/A'}</Typography>
    </Box>
  </Box>
);

/**
 * DetailAvatar Component
 * Displays an avatar with customer name and ID
 */
export const DetailAvatar = ({ name, id }) => (
  <Box sx={{ textAlign: 'center', mb: 3 }}>
    <Avatar
      sx={{
        width: 80,
        height: 80,
        mx: 'auto',
        backgroundColor: '#1976d2',
        fontSize: '2rem',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
    <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
      {name}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {id}
    </Typography>
  </Box>
);

/**
 * EmptyDetailPanel Component
 * Shows a message when no item is selected
 */
export const EmptyDetailPanel = ({ message = 'Select an item from the list to view details' }) => (
  <Box sx={{ p: 3, textAlign: 'center', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography color="text.secondary">
      {message}
    </Typography>
  </Box>
);
