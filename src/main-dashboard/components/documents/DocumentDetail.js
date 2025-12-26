import React, { useState, useEffect, useCallback } from 'react';
import { formatDateDDMMYYYY } from '../../../loans/utils/dateFormatter';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  LinearProgress,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Paper
} from '@mui/material';
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Upload as UploadIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Home as HomeIcon,
  FilePresent as FileIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { api } from '../../services/api';

const DocumentDetail = ({ documentId, onClose, onUpdate }) => {
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [versionForm, setVersionForm] = useState({
    file: null,
    change_description: ''
  });

  const fetchDocumentDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/${documentId}`);
      setDocument(response.data.document);
      setVersions(response.data.versions || []);
    } catch (error) {
      setError('Failed to fetch document details');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const fetchDocumentActivities = useCallback(async () => {
    try {
      const response = await api.get(`/documents/${documentId}/activity`);
      setActivities(response.data.activities || []);
    } catch (error) {
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId) {
      fetchDocumentDetails();
      fetchDocumentActivities();
    }
  }, [documentId, fetchDocumentDetails, fetchDocumentActivities]);

  const handleDownload = async (versionNumber = null) => {
    try {
      const url = versionNumber 
        ? `/documents/${documentId}/download?version=${versionNumber}`
        : `/documents/${documentId}/download`;
      
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', document.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setSuccess('Document downloaded successfully');
    } catch (error) {
      setError('Failed to download document');
    }
  };

  const handleUploadVersion = async () => {
    try {
      if (!versionForm.file) {
        setError('Please select a file');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('document', versionForm.file);
      formData.append('change_description', versionForm.change_description);

      await api.post(`/documents/${documentId}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('New version uploaded successfully');
      setVersionDialogOpen(false);
      setVersionForm({ file: null, change_description: '' });
      fetchDocumentDetails();
      fetchDocumentActivities();
      if (onUpdate) onUpdate();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload new version');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'archived': return 'warning';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'upload': return <CloudUploadIcon />;
      case 'download': return <DownloadIcon />;
      case 'update': return <EditIcon />;
      case 'version_upload': return <UploadIcon />;
      default: return <FileIcon />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'upload': return 'primary';
      case 'download': return 'info';
      case 'update': return 'warning';
      case 'version_upload': return 'secondary';
      case 'delete': return 'error';
      default: return 'grey';
    }
  };

  if (!document) {
    return (
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress />}
        <Typography>Loading document details...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* Document Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                {document.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {document.description}
              </Typography>
              
              {/* Tags */}
              {document.tags && (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                  {document.tags.split(',').map((tag, index) => (
                    <Chip key={index} label={tag.trim()} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
              
              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload()}
                >
                  Download Current
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setVersionDialogOpen(true)}
                >
                  Upload New Version
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onUpdate && onUpdate(document)}
                >
                  Edit Details
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              {/* Document Info */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Document Information
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Category"
                      secondary={
                        <Chip
                          label={document.category_name}
                          size="small"
                          sx={{ bgcolor: document.category_color || '#007bff', color: 'white' }}
                        />
                      }
                    />
                  </ListItem>
                  
                  {document.property_title && (
                    <ListItem>
                      <ListItemIcon>
                        <HomeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Property"
                        secondary={document.property_title}
                      />
                    </ListItem>
                  )}
                  
                  <ListItem>
                    <ListItemIcon>
                      <FileIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="File Size"
                      secondary={formatFileSize(document.file_size)}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Uploaded By"
                      secondary={document.uploaded_by_name}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Upload Date"
                      secondary={formatDateDDMMYYYY(document.created_at)}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={document.status}
                          size="small"
                          color={getStatusColor(document.status)}
                        />
                      }
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Version History */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Version History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {versions.length > 0 ? (
                <List>
                  {versions.map((version, index) => (
                    <ListItem key={version.id} divider={index < versions.length - 1}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              Version {version.version_number}
                            </Typography>
                            {version.is_current && (
                              <Chip label="Current" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {version.change_description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(version.file_size)} • 
                              {formatDateDDMMYYYY(version.created_at)} • 
                              {version.uploaded_by_name}
                            </Typography>
                          </Box>
                        }
                      />
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(version.version_number)}
                      >
                        Download
                      </Button>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No version history available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Timeline */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Timeline
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {activities.length > 0 ? (
                <Timeline>
                  {activities.map((activity, index) => (
                    <TimelineItem key={activity.id}>
                      <TimelineSeparator>
                        <TimelineDot color={getActionColor(activity.action)}>
                          {getActionIcon(activity.action)}
                        </TimelineDot>
                        {index < activities.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="subtitle2">
                          {activity.action.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {activity.details}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateDDMMYYYY(activity.created_at)} • 
                          {activity.performed_by_name}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <Typography color="text.secondary">
                  No activity history available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Version Dialog */}
      <Dialog open={versionDialogOpen} onClose={() => setVersionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Version</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Change Description"
                multiline
                rows={3}
                value={versionForm.change_description}
                onChange={(e) => setVersionForm({ ...versionForm, change_description: e.target.value })}
                placeholder="Describe what changed in this version..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadIcon />}
                sx={{ height: 56 }}
              >
                {versionForm.file ? versionForm.file.name : 'Select New File'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => setVersionForm({ ...versionForm, file: e.target.files[0] })}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUploadVersion} variant="contained" disabled={loading}>
            Upload Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentDetail;