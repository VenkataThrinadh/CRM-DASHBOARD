import React, { useState, useEffect, useCallback } from 'react';
import { formatDateDDMMYYYY } from '../../../loans/utils/dateFormatter';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Alert,
  Snackbar,
  Stack,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  SquareFoot as SquareFootIcon,
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as DescriptionIcon,
  GetApp as DownloadIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import api, { propertiesAPI, documentsAPI, plotsAPI, landPlotsAPI } from '../../services/api';
import { getPropertyImageUrl } from '../../utils/imageUtils';
import PropertyCard from './PropertyCard';
import LoadingScreen from '../common/LoadingScreen';

/* eslint-disable no-console */

const DocumentsManager = () => {
  // View states
  const [currentView, setCurrentView] = useState('properties'); // 'properties', 'plots', or 'documents'
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  
  // Plots/Units data
  const [plots, setPlots] = useState([]);
  const [landPlots, setLandPlots] = useState([]);
  const [propertyBlocks, setPropertyBlocks] = useState([]);
  
  // Plot documents data - stores documents for each plot
  const [plotDocuments, setPlotDocuments] = useState({}); // { plotId: [documents] }
  const [expandedPlots, setExpandedPlots] = useState({}); // { plotId: boolean }
  
  // Data states
  const [properties, setProperties] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination and filtering for properties
  const [propertiesPage, setPropertiesPage] = useState(1);
  const [propertiesTotalPages, setPropertiesTotalPages] = useState(1);
  const [propertiesSearchTerm, setPropertiesSearchTerm] = useState('');
  
  // Pagination and filtering for documents
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentsTotalPages, setDocumentsTotalPages] = useState(1);
  const [documentsSearchTerm, setDocumentsSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  // const [plotFallback, setPlotFallback] = useState(false); // no longer used
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Form states
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category_id: '',
    property_id: '',
    plot_id: '',
    plot_type: '',
    tags: '',
    status: 'active',
    file: null
  });
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category_id: '',
    property_id: '',
    tags: '',
    status: 'active'
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#007bff'
  });

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await propertiesAPI.getAll({ includeInactive: 'true' });
      const propertiesData = response.data?.properties || response.data || [];
      
      // Debug: Log the first property to see the data structure (remove in production)
      if (propertiesData.length > 0) {
        console.log('Sample property data:', propertiesData[0]);
      }
      
      // Apply search filter if needed
      let filteredData = propertiesData;
      if (propertiesSearchTerm) {
        const search = propertiesSearchTerm.toLowerCase();
        filteredData = propertiesData.filter(property =>
          property.title?.toLowerCase().includes(search) ||
          property.city?.toLowerCase().includes(search) ||
          property.address?.toLowerCase().includes(search) ||
          property.property_type?.toLowerCase().includes(search)
        );
      }
      
      // Apply pagination
      const startIndex = (propertiesPage - 1) * 12;
      const endIndex = startIndex + 12;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setProperties(paginatedData);
      const totalPages = Math.max(1, Math.ceil(filteredData.length / 12));
      setPropertiesTotalPages(isNaN(totalPages) ? 1 : totalPages);
    } catch (error) {
      setError('Failed to fetch properties');
      setProperties([]);
      setPropertiesTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [propertiesPage, propertiesSearchTerm]);

  const fetchDocuments = useCallback(async () => {
    if (!selectedProperty) return;
    
    try {
      setLoading(true);
      // Build params: if a plot is selected, filter strictly by plot_id (no property_id)
      const baseParams = {
        page: documentsPage.toString(),
        limit: '12',
        ...(documentsSearchTerm && { search: documentsSearchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedStatus && { status: selectedStatus })
      };

      const plotNum = selectedPlot ? (selectedPlot.plot_number || selectedPlot.unit_number || selectedPlot.number || '').toString().trim() : '';
      const params = plotNum
        ? { ...baseParams, property_id: selectedProperty.id.toString(), plot_number: plotNum }
        : { ...baseParams, property_id: selectedProperty.id.toString() };
      
      console.log('🔍 Fetching documents with params:', params);
      const response = await documentsAPI.getAll(params);
      console.log('📄 Documents response:', response.data);

      const docs = response.data.documents || [];

      // Plot fallback no longer used; keeping strict plot_number filtering
      setDocuments(docs);
      const total = parseInt(response.data.total) || docs.length || 0;
      const totalPages = Math.max(1, Math.ceil(total / 12));
      setDocumentsTotalPages(isNaN(totalPages) ? 1 : totalPages);

      if (response.data.message) {
        setSuccess(response.data.message);
      }
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      setError(`Failed to fetch documents: ${error.response?.data?.error || error.message}`);
      setDocuments([]);
      setDocumentsTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [selectedProperty, selectedPlot, documentsPage, documentsSearchTerm, selectedCategory, selectedStatus]);

  // Force refresh function that doesn't depend on useCallback dependencies
  const forceRefreshDocuments = async () => {
    if (!selectedProperty) return;
    
    try {
      setLoading(true);
      const baseParams = {
        page: '1', // Always start from page 1 after upload
        limit: '12',
        ...(documentsSearchTerm && { search: documentsSearchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedStatus && { status: selectedStatus })
      };

      const plotNum = selectedPlot ? (selectedPlot.plot_number || selectedPlot.unit_number || selectedPlot.number || '').toString().trim() : '';
      const params = plotNum
        ? { ...baseParams, property_id: selectedProperty.id.toString(), plot_number: plotNum }
        : { ...baseParams, property_id: selectedProperty.id.toString() };
      
      console.log('🔄 Force refreshing documents with params:', params);
      const response = await documentsAPI.getAll(params);
      console.log('📄 Force refresh response:', response.data);

    const docs = response.data.documents || [];
      // Plot fallback no longer used; keeping strict plot_number filtering
      setDocuments(docs);
      const total = parseInt(response.data.total) || docs.length || 0;
      const totalPages = Math.max(1, Math.ceil(total / 12));
      setDocumentsTotalPages(isNaN(totalPages) ? 1 : totalPages);

      console.log('📊 Updated documents state:', {
        documentsCount: docs.length || 0,
        totalPages,
        currentPage: 1
      });
    } catch (error) {
      console.error('❌ Error force refreshing documents:', error);
      setError(`Failed to refresh documents: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      console.log('🏷️ Fetching document categories...');
      const response = await documentsAPI.getCategories();
      console.log('🏷️ Categories response:', response.data);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      // Silently handle category fetch error
    }
  }, []);

  // Fetch documents for a specific plot with robust fallback logic
  // 1) Try property_id + plot_number (preferred, supports both apartments and land plots)
  // 2) If that returns no results, fall back to plot_id (legacy docs without plot_number)
  const fetchPlotDocuments = useCallback(async (plotOrId, plotType = 'plot') => {
    try {
      const isObject = typeof plotOrId === 'object' && plotOrId !== null;
      const plotId = isObject ? plotOrId.id : plotOrId;
      const plotNum = isObject
        ? (plotOrId.plot_number || plotOrId.unit_number || plotOrId.number || '').toString().trim()
        : (selectedPlot?.plot_number || selectedPlot?.unit_number || selectedPlot?.number || '').toString().trim();

      let effectiveDocs = [];

      // Primary: property_id + plot_number
      if (selectedProperty && plotNum) {
        const primaryParams = { property_id: selectedProperty.id.toString(), plot_number: plotNum, limit: '50' };
        console.log(`📄 Fetching documents (primary: plot_number) for ${plotType} ${plotId}:`, primaryParams);
        const primaryRes = await documentsAPI.getAll(primaryParams);
        effectiveDocs = primaryRes.data.documents || [];

        // Fallback: if no docs found by plot_number, try plot_id (legacy records)
        if ((!effectiveDocs || effectiveDocs.length === 0) && plotId) {
          const fallbackParams = { plot_id: plotId.toString(), limit: '50' };
          console.log(`🧭 Fallback to plot_id for ${plotType} ${plotId}:`, fallbackParams);
          const fallbackRes = await documentsAPI.getAll(fallbackParams);
          effectiveDocs = fallbackRes.data.documents || [];
        }
      } else if (plotId) {
        // No plot_number available; use plot_id directly
        const byIdParams = { plot_id: plotId.toString(), limit: '50' };
        console.log(`📄 Fetching documents (by plot_id) for ${plotType} ${plotId}:`, byIdParams);
        const byIdRes = await documentsAPI.getAll(byIdParams);
        effectiveDocs = byIdRes.data.documents || [];
      }

      setPlotDocuments(prev => ({
        ...prev,
        [plotId]: effectiveDocs
      }));

      return effectiveDocs;
    } catch (error) {
      const idKey = (typeof plotOrId === 'object' && plotOrId !== null) ? plotOrId.id : plotOrId;
      console.error(`❌ Error fetching documents for ${plotType} ${idKey}:`, error);

      // On error, try a property-level fallback before giving up
      try {
        if (selectedProperty) {
          const propertyOnlyParams = { property_id: selectedProperty.id.toString(), limit: '200' };
          console.log(`🧭 Error fallback: property-only fetch for ${plotType} ${idKey}:`, propertyOnlyParams);
          const response = await documentsAPI.getAll(propertyOnlyParams);
          const documents = response.data.documents || [];
          setPlotDocuments(prev => ({
            ...prev,
            [idKey]: documents
          }));
          return documents;
        }
      } catch (fallbackErr) {
        console.error('❌ Property-only fallback failed:', fallbackErr);
      }

      setPlotDocuments(prev => ({
        ...prev,
        [idKey]: []
      }));
      return [];
    }
  }, [selectedProperty, selectedPlot]);

  // Fetch documents for all plots when plots view loads
  const fetchAllPlotsDocuments = useCallback(async () => {
    if (!selectedProperty) return;
    
    const allPlots = [...plots, ...landPlots, ...propertyBlocks];
    console.log('📄 Fetching documents for all plots:', allPlots.length);
    
    // Fetch documents for each plot
    const promises = allPlots.map(plot => {
      const plotType = plots.includes(plot) ? 'plot' : 
                      landPlots.includes(plot) ? 'land-plot' : 'block';
      return fetchPlotDocuments(plot, plotType);
    });
    
    await Promise.all(promises);
  }, [selectedProperty, fetchPlotDocuments, plots, landPlots, propertyBlocks]);

  const fetchPlotsAndUnits = useCallback(async () => {
    if (!selectedProperty) return;
    
    try {
      setLoading(true);
      console.log('🏗️ Fetching plots and units for property:', selectedProperty.id);
      
      // Fetch different types of plots/units based on property type
      const promises = [];
      
      // For all property types, try to fetch plots
      promises.push(
        plotsAPI.getByProperty(selectedProperty.id).catch((error) => {
          console.log('📊 Plots API error:', error.response?.status, error.message);
          return { data: [] };
        })
      );
      
      // For land properties, fetch land plots
      promises.push(
        landPlotsAPI.getByProperty(selectedProperty.id).catch((error) => {
          console.log('🏞️ Land plots API error:', error.response?.status, error.message);
          return { data: [] };
        })
      );
      
      // For properties with blocks, fetch property block configurations
      promises.push(
        api.get(`/property-block-config/${selectedProperty.id}`).catch((error) => {
          console.log('🏢 Property blocks API error:', error.response?.status, error.message);
          return [];
        })
      );
      
      const [plotsResponse, landPlotsResponse, blocksResponse] = await Promise.all(promises);
      
      setPlots(plotsResponse?.data || []);
      setLandPlots(landPlotsResponse?.data || []);
      // Property block config API returns data directly, not wrapped in data property
      setPropertyBlocks(blocksResponse?.data || blocksResponse || []);
      
      console.log('🏗️ Plots data:', {
        plots: plotsResponse?.data?.length || 0,
        landPlots: landPlotsResponse?.data?.length || 0,
        blocks: (blocksResponse?.data || blocksResponse)?.length || 0
      });
      
      console.log('🏗️ Raw responses:', {
        plotsResponse,
        landPlotsResponse,
        blocksResponse
      });

      // After setting plots data, fetch documents for each plot
      setTimeout(() => {
        fetchAllPlotsDocuments();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error fetching plots and units:', error);
      setPlots([]);
      setLandPlots([]);
      setPropertyBlocks([]);
      setPlotDocuments({});
    } finally {
      setLoading(false);
    }
  }, [selectedProperty]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure documents for plots/units load once the lists are populated
  useEffect(() => {
    if (currentView === 'plots' && selectedProperty) {
      const hasAny = (plots && plots.length) || (landPlots && landPlots.length) || (propertyBlocks && propertyBlocks.length);
      if (hasAny) fetchAllPlotsDocuments();
    }
  }, [currentView, selectedProperty, plots, landPlots, propertyBlocks, fetchAllPlotsDocuments]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentView === 'properties') {
      fetchProperties();
    } else if (currentView === 'plots' && selectedProperty) {
      fetchPlotsAndUnits();
      fetchCategories();
    } else if (currentView === 'documents' && selectedProperty) {
      fetchDocuments();
      fetchCategories();
    }
  }, [currentView, fetchProperties, fetchPlotsAndUnits, fetchDocuments, fetchCategories, selectedProperty]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewProperty = (property) => {
    setSelectedProperty(property);
    setSelectedPlot(null);
    setCurrentView('plots');
    setDocumentsPage(1);
    setDocumentsSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
  };

  const handleViewPlotDocuments = (plot) => {
    setSelectedPlot(plot);
    setCurrentView('documents');
    setDocumentsPage(1);
    setDocumentsSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
  };

  // Toggle plot card expansion to show/hide documents
  const togglePlotExpansion = (plotId) => {
    setExpandedPlots(prev => ({
      ...prev,
      [plotId]: !prev[plotId]
    }));
  };

  // Handle upload document for specific plot
  const handleUploadForPlot = (plot, event) => {
    event.stopPropagation(); // Prevent card click
    setSelectedPlot(plot);
    resetUploadForm();
    setUploadDialogOpen(true);
  };

  const handleBackToProperties = () => {
    setCurrentView('properties');
    setSelectedProperty(null);
    setDocuments([]);
  };

  const handleUpload = async () => {
    try {
      if (!uploadForm.file || !uploadForm.title || !uploadForm.category_id) {
        setError('Please fill in all required fields and select a file');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category_id', uploadForm.category_id);
      formData.append('property_id', selectedProperty.id); // Always use selected property
      formData.append('tags', uploadForm.tags);
      formData.append('status', uploadForm.status);
      
      // Include plot identification: prefer plot_number (your requirement). Keep plot_id only as optional fallback.
      if (selectedPlot) {
        if (selectedPlot.plot_number) {
          formData.append('plot_number', selectedPlot.plot_number);
        }
        // Optional fallback; backend primarily uses plot_number now
        formData.append('plot_id', selectedPlot.id);
        formData.append('plot_type', uploadForm.plot_type || (selectedPlot.block_id ? 'land_plot' : 'plot'));
      }

      console.log('📤 Uploading document with data:', {
        title: uploadForm.title,
        property_id: selectedProperty.id,
        plot_id: selectedPlot?.id,
        category_id: uploadForm.category_id
      });

      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Document upload response:', response.data);
      setSuccess('Document uploaded successfully');
      setUploadDialogOpen(false);
      resetUploadForm();
      
      // Reset to first page and refresh documents list
      setDocumentsPage(1);
      console.log('🔄 Refreshing documents list...');
      
      // If we're in plots view and have a selected plot, refresh that plot's documents
      if (currentView === 'plots' && selectedPlot) {
        console.log('🔄 Refreshing documents for plot:', selectedPlot.id);
        await fetchPlotDocuments(selectedPlot);
      }
      
      // Force refresh documents immediately
      await forceRefreshDocuments();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      await api.put(`/documents/${selectedDocument.id}`, editForm);
      setSuccess('Document updated successfully');
      setEditDialogOpen(false);
      await forceRefreshDocuments();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/documents/${documentId}`);
      setSuccess('Document deleted successfully');
      await forceRefreshDocuments();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download document');
    }
  };

  const handleViewDocument = (document) => {
    // Placeholder: open edit dialog as a simple 'view' for now, or integrate a dedicated viewer
    setSelectedDocument(document);
    setEditForm({
      title: document.title,
      description: document.description || '',
      category_id: document.category_id,
      property_id: document.property_id || '',
      tags: document.tags || '',
      status: document.status
    });
    setEditDialogOpen(true);
  };

  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setEditForm({
      title: document.title,
      description: document.description || '',
      category_id: document.category_id,
      property_id: document.property_id || '',
      tags: document.tags || '',
      status: document.status
    });
    setEditDialogOpen(true);
  };

  const handleCreateCategory = async () => {
    try {
      if (!categoryForm.name) {
        setError('Category name is required');
        return;
      }

      setLoading(true);
      await documentsAPI.createCategory(categoryForm);
      setSuccess('Category created successfully');
      setCategoryDialogOpen(false);
      setCategoryForm({ name: '', description: '', color: '#007bff' });
      await fetchCategories();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      category_id: '',
      property_id: selectedProperty?.id || '',
      plot_id: selectedPlot?.id || '',
      plot_type: selectedPlot ? (selectedPlot.plot_number ? 'plot' : selectedPlot.name ? 'property_block' : 'land_plot') : '',
      tags: '',
      status: 'active',
      file: null
    });
  };

  const clearPropertiesFilters = () => {
    setPropertiesSearchTerm('');
    setPropertiesPage(1);
  };

  const clearDocumentsFilters = () => {
    setDocumentsSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setDocumentsPage(1);
  };

  // Property utility functions
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    
    if (/[a-zA-Z]/.test(price)) {
      return price;
    }
    
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

  // Utility: human-readable file size
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '—';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getPropertyStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'success';
      case 'pending': return 'warning';
      case 'sold': return 'error';
      case 'inactive': return 'default';
      case 'rented': return 'info';
      default: return 'default';
    }
  };




  if (loading) {
    return <LoadingScreen message="Loading documents..." />;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh'
    }}>
      {/* Header Section */}

      {/* Properties View */}
      {currentView === 'properties' && (
        <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
          {/* Search and Filters */}
          <Card sx={{ 
            mb: 4,
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    placeholder="Search properties by name, location, or type..."
                    value={propertiesSearchTerm}
                    onChange={(e) => setPropertiesSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={clearPropertiesFilters}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Properties Grid */}
          <Grid container spacing={3}>
            {properties.map((property) => (
              <Grid item xs={12} sm={6} md={4} xl={3} key={property.id}>
                <PropertyCard
                  property={property}
                  onViewDocuments={handleViewProperty}
                />
              </Grid>
            ))}
          </Grid>

          {/* Empty State */}
          {properties.length === 0 && !loading && (
            <Card sx={{ 
              mt: 4,
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <HomeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Properties Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {propertiesSearchTerm ? 'Try adjusting your search criteria' : 'No properties available for document management'}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Properties Pagination */}
          {propertiesTotalPages > 1 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: 4,
              mb: 2
            }}>
              <Pagination
                count={propertiesTotalPages}
                page={propertiesPage}
                onChange={(e, value) => setPropertiesPage(value)}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Plots/Units View */}
      {currentView === 'plots' && selectedProperty && (
        <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
          {/* Property Info Card */}
          <Card sx={{ 
            mb: 4,
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBackToProperties}
                    sx={{ 
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Back
                  </Button>
                </Grid>
                <Grid item xs={12} md={10}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {/* Property Image */}
                    <Box sx={{ position: 'relative' }}>
                      {selectedProperty.main_image ? (
                        <Box
                          component="img"
                          src={getPropertyImageUrl(selectedProperty.main_image, selectedProperty.id)}
                          alt={selectedProperty.title}
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: '2px solid rgba(255,255,255,0.3)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 2,
                          border: '2px solid rgba(255,255,255,0.3)',
                          display: selectedProperty.main_image ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        <HomeIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 40 }} />
                      </Box>
                    </Box>

                    {/* Property Details */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 600,
                        mb: 1,
                        color: 'white'
                      }}>
                        {selectedProperty.title}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                        <Chip 
                          icon={<LocationOnIcon />}
                          label={selectedProperty.location}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' }
                          }}
                        />
                        <Chip 
                          label={selectedProperty.property_type}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white'
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Typography variant="body1" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'rgba(255,255,255,0.9)'
                        }}>
                          <AttachMoneyIcon sx={{ mr: 0.5, fontSize: 18 }} />
                          {formatPrice(selectedProperty.price)}
                        </Typography>
                        <Typography variant="body1" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'rgba(255,255,255,0.9)'
                        }}>
                          <SquareFootIcon sx={{ mr: 0.5, fontSize: 18 }} />
                          {formatArea(selectedProperty.area)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Plots/Units Grid */}
          <Grid container spacing={3}>
            {/* Regular Plots */}
            {plots.map((plot) => (
              <Grid item xs={12} sm={6} md={4} xl={3} key={`plot-${plot.id}`}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      borderColor: 'primary.main'
                    }
                  }}
                  onClick={() => handleViewPlotDocuments(plot)}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2,
                      pb: 2,
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <SquareFootIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          color: 'text.primary'
                        }}>
                          Plot {plot.plot_number || plot.name || `#${plot.id}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Regular Plot
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Details */}
                    <Stack spacing={2} sx={{ mb: 3 }}>
                      {plot.area && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SquareFootIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                            {formatArea(plot.area)}
                          </Typography>
                        </Box>
                      )}
                      {plot.price && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AttachMoneyIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                            {formatPrice(plot.price)}
                          </Typography>
                        </Box>
                      )}
                      {plot.status && (
                        <Chip 
                          label={plot.status} 
                          size="small" 
                          color={getPropertyStatusColor(plot.status)}
                          sx={{ alignSelf: 'flex-start' }}
                        />
                      )}
                    </Stack>
                    
                    {/* Documents Section */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Documents ({(plotDocuments[plot.id] || []).length})
                        </Typography>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlotExpansion(plot.id);
                          }}
                          endIcon={expandedPlots[plot.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {expandedPlots[plot.id] ? 'Hide' : 'Show'}
                        </Button>
                      </Box>
                      
                      <Collapse in={expandedPlots[plot.id]}>
                        <Box sx={{ 
                          maxHeight: 200, 
                          overflowY: 'auto',
                          border: '1px solid #f0f0f0',
                          borderRadius: 1,
                          mb: 2
                        }}>
                          {(plotDocuments[plot.id] || []).length > 0 ? (
                            <List dense sx={{ py: 0 }}>
                              {(plotDocuments[plot.id] || []).map((doc, index) => (
                                <React.Fragment key={doc.id}>
                                  <ListItem sx={{ py: 1, px: 2 }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                      <DescriptionIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {doc.title}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography variant="caption" color="text.secondary">
                                          {doc.category_name || 'No category'} • {formatDateDDMMYYYY(doc.created_at)}
                                        </Typography>
                                      }
                                    />
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/backend${doc.file_path}`, '_blank');
                                      }}
                                    >
                                      <DownloadIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </ListItem>
                                  {index < (plotDocuments[plot.id] || []).length - 1 && <Divider />}
                                </React.Fragment>
                              ))}
                            </List>
                          ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                No documents uploaded yet
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                    
                    {/* Action Buttons */}
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={<AddIcon />}
                        onClick={(e) => handleUploadForPlot(plot, e)}
                        sx={{ 
                          width: '100%',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5
                        }}
                      >
                        Upload Document
                      </Button>
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<FolderIcon />}
                        onClick={() => handleViewPlotDocuments(plot)}
                        sx={{ 
                          width: '100%',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                      >
                        Manage All Documents
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Land Plots */}
            {landPlots.map((landPlot) => (
              <Grid item xs={12} sm={6} md={4} xl={3} key={`land-plot-${landPlot.id}`}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      borderColor: 'success.main'
                    }
                  }}
                  onClick={() => handleViewPlotDocuments(landPlot)}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2,
                      pb: 2,
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <LocationOnIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          color: 'text.primary'
                        }}>
                          Land Plot {landPlot.plot_number || landPlot.name || `#${landPlot.id}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Land Plot
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Details */}
                    <Stack spacing={2} sx={{ mb: 3 }}>
                      {landPlot.area && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SquareFootIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                            {formatArea(landPlot.area)}
                          </Typography>
                        </Box>
                      )}
                      {landPlot.price && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AttachMoneyIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                            {formatPrice(landPlot.price)}
                          </Typography>
                        </Box>
                      )}
                      {landPlot.status && (
                        <Chip 
                          label={landPlot.status} 
                          size="small" 
                          color={getPropertyStatusColor(landPlot.status)}
                          sx={{ alignSelf: 'flex-start' }}
                        />
                      )}
                    </Stack>
                    
                    {/* Documents Section */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Documents ({(plotDocuments[landPlot.id] || []).length})
                        </Typography>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlotExpansion(landPlot.id);
                          }}
                          endIcon={expandedPlots[landPlot.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {expandedPlots[landPlot.id] ? 'Hide' : 'Show'}
                        </Button>
                      </Box>
                      
                      <Collapse in={expandedPlots[landPlot.id]}>
                        <Box sx={{ 
                          maxHeight: 200, 
                          overflowY: 'auto',
                          border: '1px solid #f0f0f0',
                          borderRadius: 1,
                          mb: 2
                        }}>
                          {(plotDocuments[landPlot.id] || []).length > 0 ? (
                            <List dense sx={{ py: 0 }}>
                              {(plotDocuments[landPlot.id] || []).map((doc, index) => (
                                <React.Fragment key={doc.id}>
                                  <ListItem sx={{ py: 1, px: 2 }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                      <DescriptionIcon sx={{ fontSize: 18, color: 'success.main' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {doc.title}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography variant="caption" color="text.secondary">
                                          {doc.category_name || 'No category'} • {formatDateDDMMYYYY(doc.created_at)}
                                        </Typography>
                                      }
                                    />
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/backend${doc.file_path}`, '_blank');
                                      }}
                                    >
                                      <DownloadIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </ListItem>
                                  {index < (plotDocuments[landPlot.id] || []).length - 1 && <Divider />}
                                </React.Fragment>
                              ))}
                            </List>
                          ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                No documents uploaded yet
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                    
                    {/* Action Buttons */}
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={<AddIcon />}
                        color="success"
                        onClick={(e) => handleUploadForPlot(landPlot, e)}
                        sx={{ 
                          width: '100%',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5
                        }}
                      >
                        Upload Document
                      </Button>
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<FolderIcon />}
                        onClick={() => handleViewPlotDocuments(landPlot)}
                        sx={{ 
                          width: '100%',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 500,
                          borderColor: 'success.main',
                          color: 'success.main',
                          '&:hover': {
                            borderColor: 'success.dark',
                            backgroundColor: 'success.light'
                          }
                        }}
                      >
                        Manage All Documents
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Property Blocks (for apartments, villas, etc.) */}
            {propertyBlocks.map((block) => (
              <Grid item xs={12} sm={6} md={4} xl={3} key={`block-${block.id}`}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      borderColor: 'info.main'
                    }
                  }}
                  onClick={() => handleViewPlotDocuments(block)}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2,
                      pb: 2,
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: 'info.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <HomeIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          color: 'text.primary'
                        }}>
                          {block.name || `Block ${block.id}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Property Block
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Details */}
                    <Stack spacing={2} sx={{ mb: 3 }}>
                      {block.floors && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <HomeIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                            {block.floors} Floor{block.floors > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                      {block.description && (
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {block.description}
                        </Typography>
                      )}
                    </Stack>
                    
                    {/* Documents Section */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Documents ({(plotDocuments[block.id] || []).length})
                        </Typography>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlotExpansion(block.id);
                          }}
                          endIcon={expandedPlots[block.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          {expandedPlots[block.id] ? 'Hide' : 'Show'}
                        </Button>
                      </Box>
                      
                      <Collapse in={expandedPlots[block.id]}>
                        <Box sx={{ 
                          maxHeight: 200, 
                          overflowY: 'auto',
                          border: '1px solid #f0f0f0',
                          borderRadius: 1,
                          mb: 2
                        }}>
                          {(plotDocuments[block.id] || []).length > 0 ? (
                            <List dense sx={{ py: 0 }}>
                              {(plotDocuments[block.id] || []).map((doc, index) => (
                                <React.Fragment key={doc.id}>
                                  <ListItem sx={{ py: 1, px: 2 }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                      <DescriptionIcon sx={{ fontSize: 18, color: 'info.main' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {doc.title}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography variant="caption" color="text.secondary">
                                          {doc.category_name || 'No category'} • {formatDateDDMMYYYY(doc.created_at)}
                                        </Typography>
                                      }
                                    />
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/backend${doc.file_path}`, '_blank');
                                      }}
                                    >
                                      <DownloadIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </ListItem>
                                  {index < (plotDocuments[block.id] || []).length - 1 && <Divider />}
                                </React.Fragment>
                              ))}
                            </List>
                          ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                No documents uploaded yet
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                    
                    {/* Action Buttons */}
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={<AddIcon />}
                        color="info"
                        onClick={(e) => handleUploadForPlot(block, e)}
                        sx={{ 
                          width: '100%',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5
                        }}
                      >
                        Upload Document
                      </Button>
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<FolderIcon />}
                        onClick={() => handleViewPlotDocuments(block)}
                        sx={{ 
                          width: '100%',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 500,
                          borderColor: 'info.main',
                          color: 'info.main',
                          '&:hover': {
                            borderColor: 'info.dark',
                            backgroundColor: 'info.light'
                          }
                        }}
                      >
                        Manage All Documents
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* No Plots/Units Message */}
          {plots.length === 0 && landPlots.length === 0 && propertyBlocks.length === 0 && !loading && (
            <Card sx={{ 
              mt: 4,
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '2px dashed #e0e0e0'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <SquareFootIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  No Plots or Units Found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                  This property doesn't have any plots or units configured yet. You can still manage documents at the property level.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setCurrentView('documents')}
                  startIcon={<FolderIcon />}
                  size="large"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5
                  }}
                >
                  View Property Documents
                </Button>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Documents View */}
      {currentView === 'documents' && selectedProperty && (
        <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
          {/* Documents Action Bar */}
          <Card sx={{ 
            mb: 4,
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={selectedPlot ? () => setCurrentView('plots') : handleBackToProperties}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      width: '100%'
                    }}
                  >
                    {selectedPlot ? 'Back to Plots' : 'Back'}
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search documents by title, description, or filename..."
                    value={documentsSearchTerm}
                    onChange={(e) => setDocumentsSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="Category"
                      sx={{
                        borderRadius: 2
                      }}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      label="Status"
                      sx={{
                        borderRadius: 2
                      }}
                    >
                      <MenuItem value="">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearDocumentsFilters}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Property Info Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  {selectedProperty.image_url ? (
                    <Box
                      component="img"
                      src={getPropertyImageUrl(selectedProperty.image_url, selectedProperty.id)}
                      alt={selectedProperty.title}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'grey.100',
                        borderRadius: 1,
                        color: 'text.secondary'
                      }}
                    >
                      <HomeIcon sx={{ fontSize: 32 }} />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={9}>
                  <Typography variant="h6" gutterBottom>
                    {selectedProperty.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedProperty.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<LocationOnIcon />}
                      label={selectedProperty.location}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label={formatPrice(selectedProperty.price)}
                      size="small"
                      color="success"
                    />
                    <Chip
                      icon={<SquareFootIcon />}
                      label={formatArea(selectedProperty.area)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={selectedProperty.status}
                      size="small"
                      color={getPropertyStatusColor(selectedProperty.status)}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Documents Table (always visible) */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Property</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell align="right">Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">No documents found</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {documents.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{doc.original_filename}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={doc.category_name || '—'} sx={{ bgcolor: doc.category_color || '#607d8b', color: '#fff' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{doc.property_title || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{formatDateDDMMYYYY(doc.created_at)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">{formatFileSize(doc.file_size)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={doc.status} color={doc.status === 'active' ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small" color="primary" onClick={() => handleViewDocument(doc)}>
                          <DescriptionIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="info" onClick={() => handleDownload(doc.id, doc.original_filename)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="warning" onClick={() => handleEditDocument(doc)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Documents Pagination */}
          {documents.length > 0 && documentsTotalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={documentsTotalPages}
                page={documentsPage}
                onChange={(e, value) => setDocumentsPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Upload Document for {selectedProperty?.title}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title *"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={uploadForm.category_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, category_id: e.target.value })}
                  label="Category *"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={uploadForm.status}
                  onChange={(e) => setUploadForm({ ...uploadForm, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                placeholder="e.g. contract, legal, important"
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
                {uploadForm.file ? uploadForm.file.name : 'Select File *'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={loading}>
            Upload Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={loading}>
            Update Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Category</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name *"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCategory} variant="contained" disabled={loading}>
            Create Category
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

export default DocumentsManager;