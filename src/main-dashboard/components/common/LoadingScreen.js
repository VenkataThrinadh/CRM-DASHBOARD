import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography
        variant="h6"
        component="div"
        sx={{
          mt: 2,
          color: 'text.secondary',
          fontWeight: 400,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;