import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatDateDDMMYYYY } from '../../loans/utils/dateFormatter';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Drawer,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Home,
  LocationOn,
  Analytics,
  FileDownload,
  Refresh,
  ViewModule,
  ViewList,
  Star,
  StarBorder,
  CalendarToday,
  Phone,
  Email,
  Close,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../../main-dashboard/services/api';
import { getPropertyImageUrl } from '../../main-dashboard/utils/imageUtils';
import PropertyForm from '../components/properties/PropertyForm';
import PropertyGridView from '../components/properties/PropertyGridView';
import PropertyImportExport from '../components/properties/PropertyImportExport';
import BulkOperations from '../components/properties/BulkOperations';

const Properties = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Data State
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const propertyFormRef = useRef();
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 25);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);
  const [bulkOperationsDialogOpen, setBulkOperationsDialogOpen] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState([]);
  
  // Filter States
  const [filters, setFilters] = useState({
    propertyType: '',
    status: '',
    city: '',
    state: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    isFeatured: null,
    builtYear: '',
  });
  
  // Statistics State
  const [statistics, setStatistics] = useState({
    total: 0,
    available: 0,
    sold: 0,
    pending: 0,
    featured: 0,
  });
  
  const navigate = useNavigate();

  // Fetch properties from API
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await propertiesAPI.getAll({ includeInactive: 'true' });
      const propertiesData = response.data?.properties || response.data || [];

      setProperties(propertiesData);
      calculateStatistics(propertiesData);

    } catch (error) {
      console.error('Failed to fetch properties:', error); // eslint-disable-line no-console
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Apply filters to properties
  const applyFilters = useCallback(() => {
    let filtered = [...properties];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(search) ||
        property.city?.toLowerCase().includes(search) ||
        property.address?.toLowerCase().includes(search) ||
        property.property_type?.toLowerCase().includes(search)
      );
    }

    // Property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(p => p.property_type === filters.propertyType);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(p =>
        p.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // State filter
    if (filters.state) {
      filtered = filtered.filter(p =>
        p.state?.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(p => {
        const price = parseFloat(p.price?.toString().replace(/[^\d.]/g, '')) || 0;
        const min = parseFloat(filters.minPrice) || 0;
        const max = parseFloat(filters.maxPrice) || Infinity;
        return price >= min && price <= max;
      });
    }

    // Area range filter
    if (filters.minArea || filters.maxArea) {
      filtered = filtered.filter(p => {
        const area = parseFloat(p.area) || 0;
        const min = parseFloat(filters.minArea) || 0;
        const max = parseFloat(filters.maxArea) || Infinity;
        return area >= min && area <= max;
      });
    }

    // Featured filter
    if (filters.isFeatured !== null) {
      filtered = filtered.filter(p => Boolean(p.is_featured) === filters.isFeatured);
    }

    // Built year filter
    if (filters.builtYear) {
      filtered = filtered.filter(p =>
        p.built_year?.toString().includes(filters.builtYear)
      );
    }

    setFilteredProperties(filtered);
  }, [properties, filters, searchTerm]);

  // Apply filters when properties or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Calculate statistics
  const calculateStatistics = (propertiesData) => {
    const stats = {
      total: propertiesData.length,
      available: propertiesData.filter(p => p.status === 'available').length,
      sold: propertiesData.filter(p => p.status === 'sold').length,
      pending: propertiesData.filter(p => p.status === 'pending').length,
      featured: propertiesData.filter(p => p.is_featured).length,
    };
    setStatistics(stats);
  };



  // Clear all filters
  const clearFilters = () => {
    setFilters({
      propertyType: '',
      status: '',
      city: '',
      state: '',
      minPrice: '',
      maxPrice: '',
      minArea: '',
      maxArea: '',
      isFeatured: null,
      builtYear: '',
    });
    setSearchTerm('');
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== '' && value !== null
    ).length + (searchTerm ? 1 : 0);
  };

  // Menu handlers
  const handleMenuOpen = (event, property) => {
    setAnchorEl(event.currentTarget);
    setSelectedProperty(property);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProperty(null);
  };

  // Navigation handlers
  const handleView = () => {
    if (selectedProperty) {
      navigate(`/properties/${selectedProperty.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    setEditingProperty(selectedProperty);
    setFormDialogOpen(true);
    handleMenuClose();
  };

  const handleAddNew = () => {
    setEditingProperty(null);
    setFormDialogOpen(true);
  };

  // Delete handlers
  const handleDeleteClick = () => {
    setPropertyToDelete(selectedProperty);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (propertyToDelete) {
      try {
        await propertiesAPI.delete(propertyToDelete.id);
        await fetchProperties(); // Refresh the list
        setDeleteDialogOpen(false);
        setPropertyToDelete(null);
      } catch (error) {
        console.error('Failed to delete property:', error); // eslint-disable-line no-console
        setError('Failed to delete property. Please try again.');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPropertyToDelete(null);
  };

  // Form handlers
  const handleFormSave = async (formData, newImages, removedImages) => {
    try {
      console.log('🔍 handleFormSave called with:', { formData, newImages, removedImages }); // eslint-disable-line no-console
      setLoading(true);
      
      if (editingProperty) {
        // Update existing property
        await propertiesAPI.update(editingProperty.id, formData);
        
        // Handle image uploads and deletions
        if (newImages.length > 0) {
          // Upload new images
          for (const image of newImages) {
            const imageFormData = new FormData();
            imageFormData.append('images', image);
            await propertiesAPI.uploadImages(editingProperty.id, imageFormData);
          }
        }
        
        // Handle removed images (if API supports it)
        // for (const imageId of removedImages) {
        //   await propertiesAPI.deleteImage(editingProperty.id, imageId);
        // }
        
      } else {
        // Create new property
        const response = await propertiesAPI.create(formData);
        const newPropertyId = response.data.property?.id || response.data.id;
        
        // Upload images for new property
        if (newImages.length > 0 && newPropertyId) {
          for (const image of newImages) {
            const imageFormData = new FormData();
            imageFormData.append('images', image);
            await propertiesAPI.uploadImages(newPropertyId, imageFormData);
          }
        }
      }
      
      // Refresh properties list
      await fetchProperties();
      setFormDialogOpen(false);
      setEditingProperty(null);
      
    } catch (error) {
      console.error('Failed to save property:', error); // eslint-disable-line no-console
      setError('Failed to save property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setFormDialogOpen(false);
    setEditingProperty(null);
  };

  // Toggle featured status
  const handleToggleFeatured = async (property) => {
    try {
      await propertiesAPI.update(property.id, {
        ...property,
        is_featured: !property.is_featured
      });
      await fetchProperties();
    } catch (error) {
      console.error('Failed to toggle featured status:', error); // eslint-disable-line no-console
      setError('Failed to update property status.');
    }
  };

  // Open import/export dialog
  const handleImportExport = () => {
    setImportExportDialogOpen(true);
  };

  // Utility functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return 'success';
      case 'pending':
        return 'warning';
      case 'sold':
        return 'error';
      case 'inactive':
        return 'default';
      case 'rented':
        return 'info';
      default:
        return 'default';
    }
  };


  // Property type options for filters
  const propertyTypes = [
    'apartment', 'house', 'villa', 'land', 'commercial', 'office'
  ];

  // Status options for filters
  const statusOptions = [
    'available', 'sold', 'pending', 'inactive', 'rented'
  ];

  // Enhanced column definitions
  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      width: 80,
      renderCell: (params) => (
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 1,
            backgroundColor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {params.row.image_url ? (
            <img
              src={getPropertyImageUrl(params.row.image_url, params.row.id)}
              alt={params.row.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <Home sx={{ 
            color: 'grey.500', 
            display: params.row.image_url ? 'none' : 'flex',
            fontSize: 24 
          }} />
          {params.row.is_featured && (
            <Star
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                fontSize: 16,
                color: 'gold',
              }}
            />
          )}
        </Box>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: 'title',
      headerName: 'Property Details',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {params.row.id} • {params.row.property_type}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <LocationOn sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.city}, {params.row.state}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      renderCell: (params) => (
        <Chip
          label={params.value || 'available'}
          size="small"
          color={getStatusColor(params.value)}
          variant="filled"
        />
      ),
    },
    {
      field: 'contact_info',
      headerName: 'Contact',
      width: 150,
      renderCell: (params) => (
        <Box>
          {params.row.contact_phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Phone sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" noWrap>
                {params.row.contact_phone}
              </Typography>
            </Box>
          )}
          {params.row.contact_email && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Email sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" noWrap>
                {params.row.contact_email}
              </Typography>
            </Box>
          )}
        </Box>
      ),
      sortable: false,
    },
    {
      field: 'details',
      headerName: 'Details',
      width: 120,
      renderCell: (params) => (
        <Box>
          {params.row.built_year && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <CalendarToday sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption">
                {params.row.built_year}
              </Typography>
            </Box>
          )}
          {params.row.unit_number && (
            <Typography variant="caption" color="text.secondary">
              Unit: {params.row.unit_number}
            </Typography>
          )}
        </Box>
      ),
      sortable: false,
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {formatDateDDMMYYYY(params.value)}
        </Typography>
      ),
    },
    {
      field: 'featured',
      headerName: 'Featured',
      width: 100,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleToggleFeatured(params.row)}
          color={params.row.is_featured ? 'warning' : 'default'}
        >
          {params.row.is_featured ? <Star /> : <StarBorder />}
        </IconButton>
      ),
      sortable: false,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => handleMenuOpen(event, params.row)}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Page Header with Statistics */}
      <Box sx={{ mb: isMobile ? 2 : 3 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
          flexDirection: isSmallScreen ? 'column' : 'row',
          gap: isSmallScreen ? 2 : 0
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              component="h1"
              gutterBottom
              fontWeight="bold"
              sx={{ fontSize: isSmallScreen ? '1.5rem' : isMobile ? '1.75rem' : '2.125rem' }}
            >
              Properties Management
            </Typography>
            <Typography
              variant={isMobile ? "body2" : "body1"}
              color="text.secondary"
              sx={{ maxWidth: isSmallScreen ? '100%' : '500px' }}
            >
              Manage all property listings and their details
            </Typography>
          </Box>
          <Box sx={{
            display: 'flex',
            gap: isMobile ? 1 : 1,
            flexWrap: 'wrap',
            alignItems: 'center',
            width: isSmallScreen ? '100%' : 'auto'
          }}>
            {selectedProperties.length > 0 && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setBulkOperationsDialogOpen(true)}
                size={isMobile ? "small" : "medium"}
                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              >
                Bulk Actions ({selectedProperties.length})
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchProperties}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              {isMobile ? '' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddNew}
              size={isMobile ? "small" : "large"}
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              {isMobile ? 'Add' : 'Add Property'}
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: isMobile ? 2 : 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{
              minHeight: isMobile ? 80 : 100,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{
                textAlign: 'center',
                py: isMobile ? 1.5 : 2,
                px: isMobile ? 1 : 2
              }}>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  color="primary"
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1.25rem' : '2.125rem' }}
                >
                  {statistics.total}
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Total Properties
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{
              minHeight: isMobile ? 80 : 100,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{
                textAlign: 'center',
                py: isMobile ? 1.5 : 2,
                px: isMobile ? 1 : 2
              }}>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  color="success.main"
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1.25rem' : '2.125rem' }}
                >
                  {statistics.available}
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{
              minHeight: isMobile ? 80 : 100,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{
                textAlign: 'center',
                py: isMobile ? 1.5 : 2,
                px: isMobile ? 1 : 2
              }}>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  color="error.main"
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1.25rem' : '2.125rem' }}
                >
                  {statistics.sold}
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Sold
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{
              minHeight: isMobile ? 80 : 100,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{
                textAlign: 'center',
                py: isMobile ? 1.5 : 2,
                px: isMobile ? 1 : 2
              }}>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  color="warning.main"
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1.25rem' : '2.125rem' }}
                >
                  {statistics.pending}
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card sx={{
              minHeight: isMobile ? 80 : 100,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <CardContent sx={{
                textAlign: 'center',
                py: isMobile ? 1.5 : 2,
                px: isMobile ? 1 : 2
              }}>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  color="info.main"
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '1.25rem' : '2.125rem' }}
                >
                  {statistics.featured}
                </Typography>
                <Typography
                  variant={isMobile ? "caption" : "body2"}
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                >
                  Featured
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}



      {/* Search and Filters */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 2 : 3 }}>
        <Box sx={{
          display: 'flex',
          gap: isMobile ? 1 : 2,
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder={isMobile ? "Search properties..." : "Search properties by title, city, address..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{
              flexGrow: 1,
              minWidth: isMobile ? '100%' : '200px',
              '& .MuiInputBase-root': {
                fontSize: isMobile ? '0.875rem' : '1rem'
              }
            }}
            size={isMobile ? "small" : "medium"}
          />
          <Badge badgeContent={getActiveFiltersCount()} color="primary">
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFiltersDrawerOpen(true)}
              size={isMobile ? "small" : "medium"}
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              {isMobile ? '' : 'Filters'}
            </Button>
          </Badge>
          {!isMobile && (
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleImportExport}
              size="medium"
            >
              Import/Export
            </Button>
          )}
          <IconButton
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            color="primary"
            size={isMobile ? "small" : "medium"}
          >
            {viewMode === 'table' ? <ViewModule /> : <ViewList />}
          </IconButton>
        </Box>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <Box sx={{
            display: 'flex',
            gap: 0.5,
            flexWrap: 'wrap',
            alignItems: 'center',
            maxHeight: isMobile ? '60px' : 'auto',
            overflow: isMobile ? 'auto' : 'visible'
          }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              Active Filters:
            </Typography>
            {searchTerm && (
              <Chip
                label={isMobile ? `"${searchTerm}"` : `Search: ${searchTerm}`}
                size="small"
                onDelete={() => setSearchTerm('')}
                sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
              />
            )}
            {Object.entries(filters).map(([key, value]) => {
              if (value !== '' && value !== null) {
                return (
                  <Chip
                    key={key}
                    label={isMobile ? `${value}` : `${key}: ${value}`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, [key]: key === 'isFeatured' ? null : '' })}
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                  />
                );
              }
              return null;
            })}
            <Button
              size="small"
              onClick={clearFilters}
              sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      {/* Properties Table/Grid */}
      {viewMode === 'table' ? (
        <Paper sx={{
          height: isMobile ? 400 : isTablet ? 500 : 600,
          width: '100%',
          overflow: 'hidden'
        }}>
          <DataGrid
            rows={filteredProperties}
            columns={columns}
            pageSize={pageSize}
            rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
            loading={loading}
            checkboxSelection
            disableSelectionOnClick
            rowHeight={isMobile ? 70 : 80}
            selectionModel={selectedProperties.map(p => p.id)}
            onSelectionModelChange={(newSelection) => {
              const selectedProps = filteredProperties.filter(p => newSelection.includes(p.id));
              setSelectedProperties(selectedProps);
            }}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            sx={{
              border: 'none',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                padding: isMobile ? '4px 8px' : '8px 12px',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#fafafa',
                borderBottom: '2px solid #e0e0e0',
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: 600,
                },
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f8f9fa',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #e0e0e0',
              },
            }}
          />
        </Paper>
      ) : (
        <PropertyGridView
          properties={filteredProperties}
          onView={(property) => navigate(`/properties/${property.id}`)}
          onEdit={(property) => {
            setEditingProperty(property);
            setFormDialogOpen(true);
          }}
          onDelete={(property) => {
            setPropertyToDelete(property);
            setDeleteDialogOpen(true);
          }}
          onToggleFeatured={handleToggleFeatured}
          loading={loading}
        />
      )}

      {/* Filters Drawer */}
      <Drawer
        anchor="right"
        open={filtersDrawerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : isTablet ? 320 : 350,
            p: isMobile ? 1.5 : 2,
            maxWidth: '100vw'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setFiltersDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Property Type</InputLabel>
            <Select
              value={filters.propertyType}
              onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
              label="Property Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {propertyTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="City"
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            placeholder="Enter city name"
          />

          <TextField
            label="State"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            placeholder="Enter state name"
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Price Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                type="number"
                size="small"
              />
              <TextField
                label="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                type="number"
                size="small"
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Area Range (sq ft)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Min Area"
                value={filters.minArea}
                onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                type="number"
                size="small"
              />
              <TextField
                label="Max Area"
                value={filters.maxArea}
                onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                type="number"
                size="small"
              />
            </Box>
          </Box>

          <TextField
            label="Built Year"
            value={filters.builtYear}
            onChange={(e) => setFilters({ ...filters, builtYear: e.target.value })}
            placeholder="Enter built year"
          />

          <FormControlLabel
            control={
              <Switch
                checked={filters.isFeatured === true}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  isFeatured: e.target.checked ? true : null 
                })}
              />
            }
            label="Featured Properties Only"
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={clearFilters} fullWidth>
              Clear All
            </Button>
            <Button 
              variant="contained" 
              onClick={() => setFiltersDrawerOpen(false)}
              fullWidth
            >
              Apply Filters
            </Button>
          </Box>
        </Stack>
      </Drawer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Edit Property
        </MenuItem>
        <MenuItem 
          onClick={() => handleToggleFeatured(selectedProperty)}
          disabled={!selectedProperty}
        >
          {selectedProperty?.is_featured ? <StarBorder sx={{ mr: 1 }} /> : <Star sx={{ mr: 1 }} />}
          {selectedProperty?.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Property
        </MenuItem>
      </Menu>

      {/* Property Form Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={handleFormCancel}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? '100vh' : '90vh',
            m: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle>
          {editingProperty ? 'Edit Property' : 'Add New Property'}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <PropertyForm
            ref={propertyFormRef}
            property={editingProperty}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            loading={loading}
            standalone={false}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleFormCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Trigger form submission using ref
              if (propertyFormRef.current) {
                propertyFormRef.current.submit();
              }
            }}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : (editingProperty ? 'Update Property' : 'Create Property')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{propertyToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Actions */}
      <SpeedDial
        ariaLabel="Property Actions"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 12 : 16,
          right: isMobile ? 12 : 16,
          '& .MuiSpeedDial-fab': {
            width: isMobile ? 48 : 56,
            height: isMobile ? 48 : 56,
          }
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="Add Property"
          onClick={handleAddNew}
        />
        <SpeedDialAction
          icon={<FileDownload />}
          tooltipTitle="Import/Export"
          onClick={handleImportExport}
        />
        <SpeedDialAction
          icon={<Analytics />}
          tooltipTitle="View Analytics"
          onClick={() => navigate('/sales-dashboard/analytics')}
        />
        <SpeedDialAction
          icon={<Refresh />}
          tooltipTitle="Refresh Data"
          onClick={fetchProperties}
        />
      </SpeedDial>

      {/* Import/Export Dialog */}
      <PropertyImportExport
        open={importExportDialogOpen}
        onClose={() => setImportExportDialogOpen(false)}
        onImportComplete={fetchProperties}
      />

      {/* Bulk Operations Dialog */}
      <Dialog
        open={bulkOperationsDialogOpen}
        onClose={() => setBulkOperationsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bulk Operations</DialogTitle>
        <DialogContent>
          <BulkOperations
            selectedProperties={selectedProperties}
            onOperationComplete={(operation, results) => {
              // Refresh data after bulk operation
              fetchProperties();
              // Clear selection
              setSelectedProperties([]);
              // Close dialog
              setBulkOperationsDialogOpen(false);
            }}
            onClose={() => setBulkOperationsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Properties;