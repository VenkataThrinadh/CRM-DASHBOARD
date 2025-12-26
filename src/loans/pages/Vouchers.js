import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function Vouchers() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vouchers (Removed)
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        The vouchers feature is no longer available in this installation. If you need to restore it, please consult the project maintainers.
      </Typography>
      <Button variant="contained" href="/loans-dashboard">
        Back to Loans Dashboard
      </Button>
    </Box>
  );
}
