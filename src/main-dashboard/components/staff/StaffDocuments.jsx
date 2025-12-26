import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  Edit,
  Delete,
  Close,
  Description,
} from '@mui/icons-material';
import { staffDocumentsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const StaffDocuments = ({ staffId, staffName }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, [staffId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await staffDocumentsAPI.getByStaff(staffId);
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Error fetching staff documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !documentName.trim()) {
      toast.error('Please provide document name and select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_name', documentName);
      formData.append('staff_id', staffId);

      await staffDocumentsAPI.upload(formData);
      toast.success('Document uploaded successfully');
      setUploadDialogOpen(false);
      setDocumentName('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    setDocumentName(doc.document_name);
    setEditDialogOpen(true);
  };

  const handleUpdateDocument = async () => {
    if (!documentName.trim()) {
      toast.error('Please provide a document name');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('document_name', documentName);

      await staffDocumentsAPI.update(editingDoc.id, formData);
      toast.success('Document updated successfully');
      setEditDialogOpen(false);
      setDocumentName('');
      setSelectedFile(null);
      setEditingDoc(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await staffDocumentsAPI.delete(docId);
        toast.success('Document deleted successfully');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      }
    }
  };

  const handleDownloadDocument = async (docId, fileName) => {
    try {
      const response = await staffDocumentsAPI.download(docId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
            Personal Documents
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
            size="small"
          >
            Upload Document
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Alert severity="info">No documents uploaded yet. Start by uploading a personal document.</Alert>
        ) : (
          <List>
            {documents.map((doc) => (
              <Paper key={doc.id} sx={{ mb: 2, p: 2 }}>
                <ListItem
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 0,
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <Description sx={{ mr: 1, color: 'primary.main' }} />
                    <ListItemText
                      primary={doc.document_name}
                      secondary={`Uploaded: ${formatDate(doc.created_at)}`}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                    <ListItemSecondaryAction sx={{ position: 'static', ml: 2 }}>
                      <IconButton
                        edge="end"
                        aria-label="download"
                        onClick={() => handleDownloadDocument(doc.id, doc.file_name)}
                        title="Download"
                        size="small"
                      >
                        <Download />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditDocument(doc)}
                        title="Edit"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete"
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`Size: ${formatFileSize(doc.file_size)}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Format: ${doc.file_name.split('.').pop().toUpperCase()}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Upload Personal Document
            <IconButton onClick={() => setUploadDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Document Name"
              placeholder="e.g., Passport, Driving License, etc."
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              variant="outlined"
              disabled={uploading}
            />
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                {selectedFile ? selectedFile.name : 'Click to select file or drag and drop'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedFile && `Size: ${formatFileSize(selectedFile.size)}`}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            disabled={!selectedFile || !documentName.trim() || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Edit Document
            <IconButton onClick={() => setEditDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Document Name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              variant="outlined"
              disabled={uploading}
            />
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                {selectedFile ? selectedFile.name : 'Click to select new file (optional)'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedFile ? `Size: ${formatFileSize(selectedFile.size)}` : `Current: ${editingDoc?.file_name}`}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateDocument}
            variant="contained"
            disabled={!documentName.trim() || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default StaffDocuments;
