import React, { useState, useEffect, useRef } from 'react';
import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '../../loans/utils/dateFormatter';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  IconButton,
  ImageList,
  ImageListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Home,
  AttachMoney,
  CalendarToday,
  Star,
  StarBorder,
  Share,
  Print,
  Visibility,
  Phone,
  Email,
  SquareFoot,
  Business,
  Info,
  PhotoLibrary,
  Description,
  ContactPhone,
  Map,
  History,
} from '@mui/icons-material';
import EnhancedPlotsEditor from '../components/properties/EnhancedPlotsEditor';
import ContactCloneUrl from '../components/ContactCloneUrl';
import { propertiesAPI, amenitiesAPI, specificationsAPI } from '../../main-dashboard/services/api';
import { getPropertyImageUrl } from '../../main-dashboard/utils/imageUtils';
import LoadingScreen from '../../main-dashboard/components/common/LoadingScreen';
import PropertyForm from '../components/properties/PropertyForm';

const PropertyDetail = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { id } = useParams();
  const navigate = useNavigate();
  const propertyFormRef = useRef();

  // Data State
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState(0);
  const [unitsActiveTab, setUnitsActiveTab] = useState('all');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await propertiesAPI.getById(id);
      const propertyData = response.data.property || response.data;

      if (!propertyData) {
        setError('Property not found');
        return;
      }

      setProperty(propertyData);

      // Set images from property data if available
      if (propertyData.images) {
        setImages(propertyData.images);
      }

    } catch (error) {
      console.error('Failed to fetch property:', error); // eslint-disable-line no-console
      if (error.response?.status === 404) {
        setError('Property not found');
      } else {
        setError('Failed to load property details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPropertyImages = useCallback(async () => {
    try {
      const response = await propertiesAPI.getImages(id);
      setImages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch property images:', error); // eslint-disable-line no-console
      // Don't set error for images, just continue without them
    }
  }, [id]);

  const fetchAmenities = useCallback(async () => {
    try {
      const response = await amenitiesAPI.getByProperty(id);
      setAmenities(response.data || []);
    } catch (error) {
      console.error('Failed to fetch amenities:', error); // eslint-disable-line no-console
      setAmenities([]);
    }
  }, [id]);

  const fetchSpecifications = useCallback(async () => {
    try {
      const response = await specificationsAPI.getByProperty(id);
      setSpecifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch specifications:', error); // eslint-disable-line no-console
      setSpecifications([]);
    }
  }, [id]);

  useEffect(() => {
    fetchProperty();
    fetchPropertyImages();
    fetchAmenities();
    fetchSpecifications();
  }, [id, fetchProperty, fetchPropertyImages, fetchAmenities, fetchSpecifications]);

  // Utility functions
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    
    // If price is already formatted (contains letters), return as is
    if (/[a-zA-Z]/.test(price)) {
      return price;
    }
    
    // If price is numeric, format it
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    
    if (numPrice >= 10000000) {
      return `₹${(numPrice / 10000000).toFixed(1)} Cr`;
    } else if (numPrice >= 100000) {
      return `₹${(numPrice / 100000).toFixed(1)} L`;
    } else {
      return `₹${numPrice.toLocaleString()}`;
    }
  };

  const formatArea = (area) => {
    if (!area) return 'N/A';
    return `${area} sq ft`;
  };

  const parseFeatures = (features) => {
    if (!features) return [];
    
    try {
      if (typeof features === 'string') {
        // Try to parse as JSON first
        try {
          return JSON.parse(features);
        } catch {
          // If not JSON, split by comma
          return features.split(',').map(f => f.trim()).filter(f => f);
        }
      }
      return Array.isArray(features) ? features : [];
    } catch {
      return [];
    }
  };

  // Event handlers
  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await propertiesAPI.delete(id);
      navigate('/properties');
    } catch (error) {
      console.error('Failed to delete property:', error); // eslint-disable-line no-console
      setError('Failed to delete property. Please try again.');
    }
    setDeleteDialogOpen(false);
  };

  const handleFormSave = async (formData, newImages, removedImages) => {
    try {
      setLoading(true);
      
      // Update property
      await propertiesAPI.update(id, formData);
      
      // Handle image uploads and deletions
      if (newImages.length > 0) {
        for (const image of newImages) {
          const imageFormData = new FormData();
          imageFormData.append('images', image);
          await propertiesAPI.uploadImages(id, imageFormData);
        }
      }
      
      // Refresh property data
      await fetchProperty();
      await fetchPropertyImages();
      setEditDialogOpen(false);
      
    } catch (error) {
      console.error('Failed to update property:', error); // eslint-disable-line no-console
      setError('Failed to update property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async () => {
    try {
      await propertiesAPI.update(id, {
        ...property,
        is_featured: !property.is_featured
      });
      await fetchProperty();
    } catch (error) {
      console.error('Failed to toggle featured status:', error); // eslint-disable-line no-console
      setError('Failed to update property status.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingScreen message="Loading property details..." />;
  }

  if (error || !property) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          {error || 'Property not found'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/properties')}
          sx={{ mt: 2 }}
        >
          Back to Properties
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return 'success';
      case 'pending':
        return 'warning';
      case 'sold':
      case 'inactive':
        return 'error';
      case 'rented':
        return 'info';
      default:
        return 'default';
    }
  };

  const features = parseFeatures(property.features);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Enhanced Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'flex-start',
        mb: isMobile ? 2 : 3,
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: isSmallScreen ? 2 : 0
      }}>
        <IconButton
          onClick={() => navigate('/properties')}
          sx={{ mr: isMobile ? 1 : 2, alignSelf: isSmallScreen ? 'flex-start' : 'center' }}
          size={isMobile ? "small" : "medium"}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
            flexWrap: 'wrap'
          }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              component="h1"
              fontWeight="bold"
              sx={{
                fontSize: isSmallScreen ? '1.5rem' : isMobile ? '1.75rem' : '2.125rem',
                wordBreak: 'break-word'
              }}
            >
              {property.title}
            </Typography>
            {property.is_featured && (
              <Tooltip title="Featured Property">
                <Star sx={{
                  color: 'gold',
                  fontSize: isMobile ? 24 : 28
                }} />
              </Tooltip>
            )}
          </Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 1 : 2,
            flexWrap: 'wrap'
          }}>
            <Chip
              label={property.status || 'available'}
              color={getStatusColor(property.status)}
              variant="filled"
              size={isMobile ? "small" : "medium"}
            />
            <Chip
              label={property.property_type || 'N/A'}
              variant="outlined"
              size={isMobile ? "small" : "medium"}
            />
            <Typography
              variant={isMobile ? "caption" : "body2"}
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              ID: {property.id}
            </Typography>
            <Typography
              variant={isMobile ? "caption" : "body2"}
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              Listed: {formatDateDDMMYYYY(property.created_at)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{
          display: 'flex',
          gap: isMobile ? 0.5 : 1,
          flexWrap: 'wrap',
          alignItems: 'center',
          width: isSmallScreen ? '100%' : 'auto',
          justifyContent: isSmallScreen ? 'center' : 'flex-end'
        }}>
          <Tooltip title="Toggle Featured">
            <IconButton
              onClick={handleToggleFeatured}
              color={property.is_featured ? 'warning' : 'default'}
              size={isMobile ? "small" : "medium"}
            >
              {property.is_featured ? <Star /> : <StarBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Property">
            <IconButton
              onClick={handleShare}
              size={isMobile ? "small" : "medium"}
            >
              <Share />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print Details">
            <IconButton
              onClick={handlePrint}
              size={isMobile ? "small" : "medium"}
            >
              <Print />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {isMobile ? 'Edit' : 'Edit'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {isMobile ? 'Delete' : 'Delete'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Paper sx={{ mb: isMobile ? 2 : 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              minWidth: isMobile ? 80 : 120,
              padding: isMobile ? '6px 12px' : '12px 16px'
            },
            '& .MuiTab-iconWrapper': {
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }
          }}
        >
          <Tab
            icon={<Info />}
            label={isMobile ? '' : 'Overview'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<PhotoLibrary />}
            label={isMobile ? `${images.length}` : `Images (${images.length})`}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<Description />}
            label={isMobile ? '' : 'Details'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<ContactPhone />}
            label={isMobile ? '' : 'Contact'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<Map />}
            label={isMobile ? '' : 'Location'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<History />}
            label={isMobile ? '' : 'History'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<Home />}
            label={isMobile ? '' : 'Units'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={isMobile ? 1 : 3}>
          {/* Main Overview */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                gutterBottom
                fontWeight="bold"
                sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
              >
                Property Overview
              </Typography>

              <Grid container spacing={isMobile ? 1 : 3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{
                    textAlign: 'center',
                    p: isMobile ? 1.5 : 2,
                    bgcolor: 'primary.50',
                    borderRadius: 2
                  }}>
                    <AttachMoney sx={{
                      fontSize: isMobile ? 32 : 40,
                      color: 'primary.main',
                      mb: 1
                    }} />
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      fontWeight="bold"
                      color="primary"
                      sx={{ fontSize: isMobile ? '1.1rem' : '1.5rem' }}
                    >
                      {formatPrice(property.price)}
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      Price
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{
                    textAlign: 'center',
                    p: isMobile ? 1.5 : 2,
                    bgcolor: 'success.50',
                    borderRadius: 2
                  }}>
                    <SquareFoot sx={{
                      fontSize: isMobile ? 32 : 40,
                      color: 'success.main',
                      mb: 1
                    }} />
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      fontWeight="bold"
                      color="success.main"
                      sx={{ fontSize: isMobile ? '1.1rem' : '1.5rem' }}
                    >
                      {formatArea(property.area)}
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      Area
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{
                    textAlign: 'center',
                    p: isMobile ? 1.5 : 2,
                    bgcolor: 'info.50',
                    borderRadius: 2
                  }}>
                    <Home sx={{
                      fontSize: isMobile ? 32 : 40,
                      color: 'info.main',
                      mb: 1
                    }} />
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      fontWeight="bold"
                      color="info.main"
                      sx={{ fontSize: isMobile ? '1.1rem' : '1.5rem' }}
                    >
                      {property.property_type || 'N/A'}
                    </Typography>
                    <Typography
                      variant={isMobile ? "caption" : "body2"}
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      Type
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: isMobile ? 2 : 3 }} />

              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                gutterBottom
                fontWeight="bold"
                sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
              >
                Description
              </Typography>
              <Typography
                variant={isMobile ? "body2" : "body1"}
                paragraph
                sx={{
                  lineHeight: 1.7,
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              >
                {property.description || 'No description available.'}
              </Typography>

              {features.length > 0 && (
                <>
                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    gutterBottom
                    fontWeight="bold"
                    sx={{
                      mt: isMobile ? 2 : 3,
                      fontSize: isMobile ? '1.1rem' : '1.25rem'
                    }}
                  >
                    Features & Amenities
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: isMobile ? 0.5 : 1
                  }}>
                    {features.map((feature, index) => (
                      <Chip
                        key={index}
                        label={feature}
                        variant="outlined"
                        color="primary"
                        size={isMobile ? "small" : "small"}
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Paper>
          </Grid>

          {/* Sidebar Stats */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: isMobile ? 2 : 3 }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  gutterBottom
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
                >
                  Property Statistics
                </Typography>

                <List dense sx={{ p: 0 }}>
                  <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                    <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                      <CalendarToday color="primary" sx={{ fontSize: isMobile ? 20 : 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Built Year"
                      secondary={property.built_year || 'Not specified'}
                      primaryTypographyProps={{
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}
                      secondaryTypographyProps={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }}
                    />
                  </ListItem>

                  <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                    <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                      <Business color="primary" sx={{ fontSize: isMobile ? 20 : 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Unit Number"
                      secondary={property.unit_number || 'Not specified'}
                      primaryTypographyProps={{
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}
                      secondaryTypographyProps={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }}
                    />
                  </ListItem>

                  <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                    <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                      <AttachMoney color="primary" sx={{ fontSize: isMobile ? 20 : 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Outstanding Amount"
                      secondary={property.outstanding_amount ? `₹${property.outstanding_amount}` : 'None'}
                      primaryTypographyProps={{
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}
                      secondaryTypographyProps={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }}
                    />
                  </ListItem>

                  <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                    <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                      <Visibility color="primary" sx={{ fontSize: isMobile ? 20 : 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Status"
                      secondary={property.status || 'available'}
                      primaryTypographyProps={{
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}
                      secondaryTypographyProps={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }}
                    />
                    <Chip
                      label={property.status || 'available'}
                      color={getStatusColor(property.status)}
                      size={isMobile ? "small" : "small"}
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  gutterBottom
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
                >
                  Quick Actions
                </Typography>

                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? 0.5 : 1
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEdit}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Edit Property
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={property.is_featured ? <StarBorder /> : <Star />}
                    onClick={handleToggleFeatured}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    {property.is_featured ? 'Remove Featured' : 'Mark Featured'}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={handleShare}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Share Property
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handlePrint}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Print Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Images Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
          >
            Property Images ({images.length})
          </Typography>

          {images.length > 0 ? (
            <ImageList
              cols={isMobile ? 2 : isTablet ? 3 : 4}
              gap={isMobile ? 8 : 16}
            >
              {images.map((image, index) => (
                <ImageListItem
                  key={index}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setImageDialogOpen(true);
                  }}
                >
                  <img
                    src={getPropertyImageUrl(image.image_url, property.id)}
                    alt={`Property ${index + 1}`}
                    loading="lazy"
                    style={{
                      borderRadius: 8,
                      objectFit: 'cover',
                      height: isMobile ? 150 : 200,
                      transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  />
                  {image.is_primary && (
                    <Chip
                      label="Primary"
                      color="primary"
                      size={isMobile ? "small" : "small"}
                      sx={{
                        position: 'absolute',
                        top: isMobile ? 4 : 8,
                        left: isMobile ? 4 : 8,
                        fontSize: isMobile ? '0.7rem' : '0.875rem'
                      }}
                    />
                  )}
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Box sx={{ textAlign: 'center', py: isMobile ? 3 : 4 }}>
              <PhotoLibrary sx={{
                fontSize: isMobile ? 48 : 64,
                color: 'text.secondary',
                mb: 2
              }} />
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                color="text.secondary"
                sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
              >
                No images available
              </Typography>
              <Typography
                variant={isMobile ? "caption" : "body2"}
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              >
                Add images to showcase this property
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Details Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Detailed Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Basic Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Title" secondary={property.title} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Property Type" secondary={property.property_type || 'N/A'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Status" secondary={property.status || 'available'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Featured" secondary={property.is_featured ? 'Yes' : 'No'} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Financial Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Price" secondary={formatPrice(property.price)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Outstanding Amount" secondary={property.outstanding_amount ? `₹${property.outstanding_amount}` : 'None'} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Physical Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Area" secondary={formatArea(property.area)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Built Year" secondary={property.built_year || 'Not specified'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Unit Number" secondary={property.unit_number || 'Not specified'} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    System Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Property ID" secondary={property.id} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Created" secondary={formatDateDDMMYYYY(property.created_at)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Last Updated" secondary={property.updated_at ? formatDateDDMMYYYY(property.updated_at) : 'Never'} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Amenities Section */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Amenities
                  </Typography>
                  {amenities.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {amenities.map((amenity, index) => (
                        <Chip
                          key={index}
                          label={amenity.name}
                          color="primary"
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No amenities added
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Specifications Section */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Specifications
                  </Typography>
                  {specifications.length > 0 ? (
                    <List dense>
                      {specifications.map((spec, index) => (
                        <ListItem key={index} sx={{ pl: 0, pr: 0 }}>
                          <ListItemText
                            primary={spec.name}
                            secondary={spec.value}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No specifications added
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Contact Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Phone />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Phone Contact
                      </Typography>
                      <Typography variant="body1">
                        {property.contact_phone || 'Not provided'}
                      </Typography>
                      {property.contact_phone && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Phone />}
                          href={`tel:${property.contact_phone}`}
                          sx={{ mt: 1 }}
                        >
                          Call Now
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <Email />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Email Contact
                      </Typography>
                      <Typography variant="body1">
                        {property.contact_email || 'Not provided'}
                      </Typography>
                      {property.contact_email && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Email />}
                          href={`mailto:${property.contact_email}`}
                          sx={{ mt: 1 }}
                        >
                          Send Email
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <ContactCloneUrl cloneUrl={property.clone_url || ''} />
            </Grid>

          </Grid>
        </Paper>
      )}

      {/* Location Tab */}
      {activeTab === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Location Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Address Information
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Full Address
                    </Typography>
                    <Typography variant="body1">
                      {property.address || 'Address not provided'}
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        City
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {property.city || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        State
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {property.state || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        ZIP Code
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {property.zip_code || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Location/Area
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {property.location || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* History Tab */}
      {activeTab === 5 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Property History
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CalendarToday color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Property Created"
                secondary={formatDateDDMMYYYY(property.created_at)}
              />
            </ListItem>
            
            {property.updated_at && (
              <ListItem>
                <ListItemIcon>
                  <Edit color="secondary" />
                </ListItemIcon>
                <ListItemText
                  primary="Last Updated"
                  secondary={formatDateDDMMYYYY(property.updated_at)}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {/* Units / Plots Tab (single combined view) */}
      {activeTab === 6 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom fontWeight="bold">
            Units / Plots
          </Typography>

              <Paper sx={{ mb: 2 }}>
                <Tabs
                  value={unitsActiveTab}
                  onChange={(e, newValue) => setUnitsActiveTab(newValue)}
                  variant="fullWidth"
                >
                  <Tab label={isMobile ? '' : 'All'} value="all" />
                  <Tab label={isMobile ? '' : 'Available'} value="available" />
                  <Tab label={isMobile ? '' : 'Booked'} value="booked" />
                  <Tab label={isMobile ? '' : 'Sold'} value="sold" />
                </Tabs>
              </Paper>

          <EnhancedPlotsEditor
            propertyId={property.id}
            propertyType={property.property_type || 'apartment'}
            showTabs={false}
            showAddForm={false}
            readOnly={true}
            activeTab={unitsActiveTab}
          />
        </Paper>
      )}

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { m: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          Property Images ({selectedImageIndex + 1} of {images.length})
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 1 : 3 }}>
          {images[selectedImageIndex] && (
            <img
              src={getPropertyImageUrl(images[selectedImageIndex].image_url, property.id)}
              alt={`Property ${selectedImageIndex + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: isMobile ? '60vh' : '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
            disabled={selectedImageIndex === 0}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Previous
          </Button>
          <Button
            onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
            disabled={selectedImageIndex === images.length - 1}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Next
          </Button>
          <Button
            onClick={() => setImageDialogOpen(false)}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { height: isMobile ? '100vh' : '90vh' }
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          Edit Property
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <PropertyForm
            ref={propertyFormRef}
            property={property}
            onSave={handleFormSave}
            onCancel={() => setEditDialogOpen(false)}
            loading={loading}
            standalone={false}
          />
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (propertyFormRef.current) {
                propertyFormRef.current.submit();
              }
            }}
            variant="contained"
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update Property'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { m: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Are you sure you want to delete "{property.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <SpeedDial
        ariaLabel="Property Actions"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 12 : 16,
          right: isMobile ? 12 : 16
        }}
        icon={<SpeedDialIcon />}
        FabProps={{
          size: isMobile ? "small" : "large"
        }}
      >
        <SpeedDialAction
          icon={<Edit sx={{ fontSize: isMobile ? 18 : 24 }} />}
          tooltipTitle="Edit Property"
          onClick={handleEdit}
        />
        <SpeedDialAction
          icon={property.is_featured ?
            <StarBorder sx={{ fontSize: isMobile ? 18 : 24 }} /> :
            <Star sx={{ fontSize: isMobile ? 18 : 24 }} />
          }
          tooltipTitle={property.is_featured ? 'Remove Featured' : 'Mark Featured'}
          onClick={handleToggleFeatured}
        />
        <SpeedDialAction
          icon={<Share sx={{ fontSize: isMobile ? 18 : 24 }} />}
          tooltipTitle="Share Property"
          onClick={handleShare}
        />
        <SpeedDialAction
          icon={<Print sx={{ fontSize: isMobile ? 18 : 24 }} />}
          tooltipTitle="Print Details"
          onClick={handlePrint}
        />
      </SpeedDial>
    </Box>
  );
};

export default PropertyDetail;