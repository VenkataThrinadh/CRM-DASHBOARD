import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';

/**
 * GoldPhotoDisplay Component
 * Displays gold photo with view option
 */
const GoldPhotoDisplay = ({ goldPhoto, loanRefNo, size = 'small' }) => {
  if (!goldPhoto) {
    return (
      <Tooltip title="No photo uploaded">
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>-</Box>
      </Tooltip>
    );
  }

  const handleViewPhoto = () => {
    // Open photo in a new window or modal
    const photoUrl = `/uploads/gold/${goldPhoto}`;
    window.open(photoUrl, '_blank');
  };

  return (
    <Tooltip title={`View ${loanRefNo} gold photo`}>
      <IconButton
        size={size}
        color="primary"
        onClick={handleViewPhoto}
      >
        <ViewIcon />
      </IconButton>
    </Tooltip>
  );
};

export default GoldPhotoDisplay;
