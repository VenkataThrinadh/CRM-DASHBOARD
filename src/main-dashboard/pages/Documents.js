import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Home as HomeIcon, Folder as FolderIcon } from '@mui/icons-material';
import DocumentsManager from '../components/documents/DocumentsManager';

const Documents = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/dashboard"
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <FolderIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Documents
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Document Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a property to view and manage its documents. Upload contracts, certificates, 
          legal documents, and other important files organized by property.
        </Typography>
      </Box>

      {/* Documents Manager Component */}
      <DocumentsManager />
    </Box>
  );
};

export default Documents;