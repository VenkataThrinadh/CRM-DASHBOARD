import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Badge,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Star,
  StarBorder,
  Visibility,
  Close,
  Image as ImageIcon,
  PhotoLibrary,
} from '@mui/icons-material';
import { propertiesAPI } from '../../../main-dashboard/services/api';

const PropertyImagesEditor = ({ propertyId, propertyType = 'apartment' }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [viewImage, setViewImage] = useState(null);

  const fileInputRef = useRef(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await propertiesAPI.getImages(propertyId);
      const imagesData = Array.isArray(response.data) ? response.data : [];
      setImages(imagesData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching images:', error);
      setError('Failed to load images. Please try again.');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchImages();
    }
  }, [propertyId, fetchImages]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} - Not an image file`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        invalidFiles.push(`${file.name} - File too large (max 5MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid files: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      
      // Create preview URLs
      const previews = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setPreviewImages(previews);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select images to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await propertiesAPI.uploadImages(propertyId, formData);
      
      if (response.data) {
        // Refresh images list
        await fetchImages();
        
        // Clear selections
        setSelectedFiles([]);
        setPreviewImages([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setSuccess(`Successfully uploaded ${selectedFiles.length} image(s)`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading images:', error);
      setError(error.response?.data?.message || 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      setUploading(true);
      await propertiesAPI.deleteImage(propertyId, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setSuccess('Image deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting image:', error);
      setError('Failed to delete image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      setUploading(true);
      await propertiesAPI.setPrimaryImage(propertyId, imageId);
      
      // Update local state
      setImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId,
      })));
      
      setSuccess('Primary image updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error setting primary image:', error);
      setError('Failed to set primary image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setPreviewImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPropertyTypeIcon = () => {
    switch (propertyType) {
      case 'land':
        return '🏞️';
      case 'commercial':
      case 'office':
        return '🏢';
      case 'apartment':
        return '🏠';
      case 'villa':
        return '🏡';
      default:
        return '🏘️';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PhotoLibrary sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Property Images {getPropertyTypeIcon()}
        </Typography>
        <Chip 
          label={`${images.length} image${images.length !== 1 ? 's' : ''}`} 
          color="primary" 
          size="small" 
        />
      </Box>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Upload Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload New Images
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{ mr: 2 }}
          >
            Select Images
          </Button>
          
          {selectedFiles.length > 0 && (
            <>
              <Button
                variant="contained"
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                onClick={handleUpload}
                disabled={uploading}
                sx={{ mr: 2 }}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={clearSelection}
                disabled={uploading}
              >
                Clear
              </Button>
            </>
          )}
        </Box>

        {/* Preview Selected Images */}
        {previewImages.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Selected Images Preview:
            </Typography>
            <Grid container spacing={2}>
              {previewImages.map((preview, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="120"
                      image={preview.url}
                      alt={preview.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardActions sx={{ p: 1 }}>
                      <Typography variant="caption" noWrap sx={{ flexGrow: 1 }}>
                        {preview.name}
                      </Typography>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Existing Images */}
      <Typography variant="h6" gutterBottom>
        Existing Images ({images.length})
      </Typography>
      
      {images.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography color="text.secondary">
            No images uploaded yet. Upload your first property image above.
          </Typography>
        </Paper>
      ) : (
        <ImageList variant="masonry" cols={4} gap={8}>
          {images.map((image) => (
            <ImageListItem key={image.id}>
              <img
                src={image.image_url || image.url}
                alt={image.alt_text || 'Property image'}
                loading="lazy"
                style={{ cursor: 'pointer' }}
                onClick={() => setViewImage(image)}
              />
              <ImageListItemBar
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {image.is_primary && (
                      <Badge badgeContent="Primary" color="primary">
                        <Star sx={{ color: 'gold' }} />
                      </Badge>
                    )}
                    <Typography variant="caption">
                      Image {image.id}
                    </Typography>
                  </Box>
                }
                actionIcon={
                  <Box>
                    <IconButton
                      sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewImage(image);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(image.id);
                      }}
                      disabled={uploading}
                    >
                      {image.is_primary ? <Star /> : <StarBorder />}
                    </IconButton>
                    <IconButton
                      sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      disabled={uploading}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Image View Dialog */}
      <Dialog
        open={!!viewImage}
        onClose={() => setViewImage(null)}
        maxWidth="md"
        fullWidth
      >
        {viewImage && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Property Image
                {viewImage.is_primary && (
                  <Chip label="Primary" color="primary" size="small" />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <img
                src={viewImage.image_url || viewImage.url}
                alt={viewImage.alt_text || 'Property image'}
                style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
              />
              {viewImage.alt_text && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {viewImage.alt_text}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={viewImage.is_primary ? <Star /> : <StarBorder />}
                onClick={() => {
                  handleSetPrimary(viewImage.id);
                  setViewImage(null);
                }}
                disabled={uploading}
              >
                {viewImage.is_primary ? 'Primary Image' : 'Set as Primary'}
              </Button>
              <Button
                startIcon={<Delete />}
                color="error"
                onClick={() => {
                  handleDeleteImage(viewImage.id);
                  setViewImage(null);
                }}
                disabled={uploading}
              >
                Delete
              </Button>
              <Button onClick={() => setViewImage(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PropertyImagesEditor;
