import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Cancel,
  Landscape,
  AttachMoney,
  SquareFoot,
  Numbers,
  Home,
  Business,
  CheckCircle,
  Schedule,
  Sell,
  Settings,
  LocationCity,
} from '@mui/icons-material';
import { plotsAPI, landPlotsAPI } from '../../../main-dashboard/services/api';

const EnhancedPlotsEditor = ({ propertyId, propertyType = 'apartment', showTabs = true, initialTab, showAddForm = true, readOnly = false, activeTab: controlledActiveTab }) => {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const defaultTab = initialTab || (propertyType === 'land' ? 'available' : 'all');
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab);
  const isControlled = typeof controlledActiveTab !== 'undefined';
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    plot_number: '',
    area: '',
    price: '',
    status: 'available',
    dimensions: '',
    facing: '',
    block: '',
    floor: '',
    unit_type: '',
    amenities: '',
    description: '',
  });

  // Edit mode states
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

  // Land-specific states
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [showBlockConfig, setShowBlockConfig] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');

  // Property type specific configurations
  const isLandProperty = propertyType === 'land';
  const alphanumericPriceTypes = ['apartment', 'villa', 'commercial', 'house', 'land'];
  const isAlphanumericPriceType = alphanumericPriceTypes.includes(propertyType?.toLowerCase());

  const fetchPlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (isLandProperty) {
        // Use landPlotsAPI for land properties
        response = await landPlotsAPI.getByProperty(propertyId);
      } else {
        // Use regular plotsAPI for other property types
        response = await plotsAPI.getByProperty(propertyId);
      }

      const plotsData = Array.isArray(response.data) ? response.data : [];
      setPlots(plotsData);
    } catch (error) {
      setError('Failed to load plots. Please try again.');
      setPlots([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId, isLandProperty]);

  const fetchBlocks = useCallback(async () => {
    try {
      // Fetch real blocks data from API
      const response = await landPlotsAPI.getPropertyBlocks(propertyId);
      const blocksData = Array.isArray(response.data) ? response.data : [];
      setBlocks(blocksData);
    } catch (error) {
      setBlocks([]); // Set empty array if no blocks configured
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchPlots();
      if (isLandProperty) {
        fetchBlocks();
      }
    }
  }, [propertyId, propertyType, fetchPlots, fetchBlocks, isLandProperty]);

  const validatePriceFormat = (priceInput) => {
    if (!priceInput || priceInput.trim() === '') {
      return { isValid: false, message: 'Price is required' };
    }
    
    const trimmedPrice = priceInput.trim();
    
    // Allow pure numbers (e.g., "150000")
    if (/^\d+$/.test(trimmedPrice)) {
      return { isValid: true };
    }
    
    // Allow Indian currency formats (e.g., "2.5 lakhs", "1.2 crores", "50 L", "2 Cr")
    const indianCurrencyPattern = /^(\d+(?:\.\d+)?)\s*(lakhs?|crores?|l|cr|lakh|crore)$/i;
    if (indianCurrencyPattern.test(trimmedPrice)) {
      return { isValid: true };
    }
    
    // Allow decimal numbers (e.g., "150000.50")
    if (/^\d+\.\d+$/.test(trimmedPrice)) {
      return { isValid: true };
    }
    
    return { 
      isValid: false, 
      message: 'Please enter a valid price format (e.g., "150000", "2.5 lakhs", "1.2 crores")' 
    };
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddPlot = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.plot_number.trim() || !formData.area.trim() || !formData.price.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate price format
      const priceValidation = validatePriceFormat(formData.price);
      if (!priceValidation.isValid) {
        setError(priceValidation.message);
        return;
      }

      // For land properties, check if block is selected
      if (isLandProperty && !selectedBlock) {
        setError('Please select a block for land plots');
        return;
      }

      let plotData;
      let response;
      
      if (isLandProperty) {
        // For land properties, use block_id instead of propertyId
        plotData = {
          block_id: selectedBlock,
          plot_number: formData.plot_number.trim(),
          area: parseFloat(formData.area) || 0,
          price: formData.price.trim(),
          status: formData.status,
          description: formData.description.trim(),
          dimensions: formData.dimensions.trim(),
          facing: formData.facing.trim(),
        };
        response = await landPlotsAPI.create(plotData);
      } else {
        // For regular properties, use propertyId
        plotData = {
          propertyId: propertyId,
          plot_number: formData.plot_number.trim(),
          area: parseFloat(formData.area) || 0,
          price: formData.price.trim(),
          status: formData.status,
          dimensions: formData.dimensions.trim(),
          facing: formData.facing.trim(),
          block: formData.block.trim(),
          floor: formData.floor.trim(),
          unit_type: formData.unit_type.trim(),
          amenities: formData.amenities.trim(),
          description: formData.description.trim(),
        };
        response = await plotsAPI.create(plotData);
      }

      if (response.data) {
        setPlots(prev => [...prev, response.data]);
        resetForm();
        setSuccess('Plot added successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add plot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPlot = (plot) => {
    if (readOnly) return;

    setEditingId(plot.id);
    setEditingData({
      plot_number: plot.plot_number || '',
      area: plot.area || '',
      price: plot.price || '',
      status: plot.status || 'available',
      dimensions: plot.dimensions || '',
      facing: plot.facing || '',
      block: plot.block || '',
      floor: plot.floor || '',
      unit_type: plot.unit_type || '',
      amenities: plot.amenities || '',
      description: plot.description || '',
    });
  };

  const handleUpdatePlot = async (plotId) => {
    try {
      setSaving(true);
      setError(null);

      const plotData = {
        plot_number: editingData.plot_number.trim(),
        area: parseFloat(editingData.area) || 0,
        price: editingData.price.trim(),
        status: editingData.status,
        dimensions: editingData.dimensions.trim(),
        facing: editingData.facing.trim(),
        block: editingData.block.trim(),
        floor: editingData.floor.trim(),
        unit_type: editingData.unit_type.trim(),
        amenities: editingData.amenities.trim(),
        description: editingData.description.trim(),
      };

      let response;
      if (isLandProperty) {
        response = await landPlotsAPI.update(plotId, plotData);
      } else {
        response = await plotsAPI.update(plotId, plotData);
      }

      if (response.data) {
        setPlots(prev => prev.map(plot => 
          plot.id === plotId ? { ...plot, ...response.data } : plot
        ));
        setEditingId(null);
        setEditingData({});
        setSuccess('Plot updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update plot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlot = async (plotId) => {
    if (readOnly) return;

    if (!window.confirm('Are you sure you want to delete this plot?')) {
      return;
    }

    try {
      setSaving(true);
      
      if (isLandProperty) {
        await landPlotsAPI.delete(plotId);
      } else {
        await plotsAPI.delete(plotId);
      }
      
      setPlots(prev => prev.filter(plot => plot.id !== plotId));
      setSuccess('Plot deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to delete plot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      plot_number: '',
      area: '',
      price: '',
      status: 'available',
      dimensions: '',
      facing: '',
      block: '',
      floor: '',
      unit_type: '',
      amenities: '',
      description: '',
    });
    setSelectedBlock('');
  };

  const handleAddBlock = async () => {
    if (!newBlockName.trim()) {
      setError('Please enter a block name');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Save block to database via API
      const response = await landPlotsAPI.addBlock(
        propertyId,
        newBlockName.trim(),
        '' // description (optional)
      );

      if (response.data) {
        // Add the new block to local state
        const newBlock = {
          ...response.data,
          total_plots: 0,
          available_plots: 0,
        };
        
        setBlocks(prev => [...prev, newBlock]);
        setNewBlockName('');
        setSuccess('Block added successfully and saved to database');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add block. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'booked':
        return 'warning';
      case 'sold':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle />;
      case 'booked':
        return <Schedule />;
      case 'sold':
        return <Sell />;
      default:
        return <Home />;
    }
  };

  const getPropertyTypeIcon = () => {
    switch (propertyType) {
      case 'land':
        return <Landscape />;
      case 'commercial':
      case 'office':
        return <Business />;
      case 'apartment':
        return <LocationCity />;
      default:
        return <Home />;
    }
  };

  const getFilteredPlots = () => {
    if (activeTab === 'all') return plots;
    return plots.filter(plot => plot.status === activeTab);
  };

  const getTabCounts = () => {
    const counts = {
      all: plots.length,
      available: plots.filter(p => p.status === 'available').length,
      booked: plots.filter(p => p.status === 'booked').length,
      sold: plots.filter(p => p.status === 'sold').length,
    };
    return counts;
  };

  const tabCounts = getTabCounts();
  const filteredPlots = getFilteredPlots();

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
        {getPropertyTypeIcon()}
        <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
          {isLandProperty ? 'Land Plots' : 'Property Plots'} {readOnly ? '' : 'Editor'}
        </Typography>
        {isLandProperty && !readOnly && (
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setShowBlockConfig(true)}
            size="small"
          >
            Configure Blocks
          </Button>
        )}
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

      {/* Status Tabs (optional) */}
      {showTabs !== false && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => { if (!isControlled) setInternalActiveTab(newValue); }}
            variant="fullWidth"
          >
            <Tab 
              label={`All (${tabCounts.all})`} 
              value="all"
              icon={<Badge badgeContent={tabCounts.all} color="primary"><Home /></Badge>}
            />
            <Tab 
              label={`Available (${tabCounts.available})`} 
              value="available"
              icon={<Badge badgeContent={tabCounts.available} color="success"><CheckCircle /></Badge>}
            />
            <Tab 
              label={`Booked (${tabCounts.booked})`} 
              value="booked"
              icon={<Badge badgeContent={tabCounts.booked} color="warning"><Schedule /></Badge>}
            />
            <Tab 
              label={`Sold (${tabCounts.sold})`} 
              value="sold"
              icon={<Badge badgeContent={tabCounts.sold} color="error"><Sell /></Badge>}
            />
          </Tabs>
        </Paper>
      )}

      {/* Add New Plot Form */}
      {showAddForm !== false && (
        <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add New {isLandProperty ? 'Land Plot' : 'Plot'}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Plot Number"
              value={formData.plot_number}
              onChange={(e) => handleFormChange('plot_number', e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Numbers />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Area (sq ft)"
              type="number"
              value={formData.area}
              onChange={(e) => handleFormChange('area', e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SquareFoot />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Price"
              value={formData.price}
              onChange={(e) => handleFormChange('price', e.target.value)}
              required
              placeholder={isAlphanumericPriceType ? "e.g., 2.5 lakhs, 1.2 crores" : "e.g., 5000000"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="booked">Booked</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Land-specific block selection */}
          {isLandProperty && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Block</InputLabel>
                <Select
                  value={selectedBlock}
                  label="Block"
                  onChange={(e) => setSelectedBlock(e.target.value)}
                >
                  {blocks.map(block => (
                    <MenuItem key={block.id} value={block.id}>
                      {block.name} ({block.available_plots}/{block.total_plots} available)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Additional fields for non-land properties */}
          {!isLandProperty && (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Block/Building"
                  value={formData.block}
                  onChange={(e) => handleFormChange('block', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Floor"
                  value={formData.floor}
                  onChange={(e) => handleFormChange('floor', e.target.value)}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Dimensions"
              value={formData.dimensions}
              onChange={(e) => handleFormChange('dimensions', e.target.value)}
              placeholder="e.g., 30x40 ft"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Facing</InputLabel>
              <Select
                value={formData.facing}
                label="Facing"
                onChange={(e) => handleFormChange('facing', e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="north">North</MenuItem>
                <MenuItem value="south">South</MenuItem>
                <MenuItem value="east">East</MenuItem>
                <MenuItem value="west">West</MenuItem>
                <MenuItem value="north-east">North-East</MenuItem>
                <MenuItem value="north-west">North-West</MenuItem>
                <MenuItem value="south-east">South-East</MenuItem>
                <MenuItem value="south-west">South-West</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              multiline
              rows={2}
              placeholder="Additional details about the plot..."
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddPlot}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Add />}
              >
                {saving ? 'Adding...' : 'Add Plot'}
              </Button>
              <Button
                variant="outlined"
                onClick={resetForm}
                disabled={saving}
                startIcon={<Cancel />}
              >
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
        </Paper>
      )}

      {/* Plots Display */}
      <Typography variant="h6" gutterBottom>
        {activeTab === 'all' ? 'All Plots' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Plots`} ({filteredPlots.length})
      </Typography>
      
      {filteredPlots.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No {activeTab === 'all' ? '' : activeTab} plots found. Add your first plot above.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredPlots.map((plot) => (
            <Grid item xs={12} sm={6} md={4} key={plot.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      Plot {plot.plot_number}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(plot.status)}
                      label={plot.status}
                      color={getStatusColor(plot.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={`${plot.area} sq ft`} size="small" />
                    <Chip label={plot.price} size="small" color="primary" />
                    {plot.block && <Chip label={`Block: ${plot.block}`} size="small" />}
                    {plot.facing && <Chip label={`${plot.facing} facing`} size="small" />}
                  </Box>
                  
                  {plot.dimensions && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Dimensions: {plot.dimensions}
                    </Typography>
                  )}
                  
                  {plot.description && (
                    <Typography variant="body2" color="text.secondary">
                      {plot.description}
                    </Typography>
                  )}
                </CardContent>
                
                {!readOnly && (
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => handleEditPlot(plot)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePlot(plot.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Block Configuration Dialog */}
      {isLandProperty && !readOnly && (
        <Dialog
          open={showBlockConfig}
          onClose={() => setShowBlockConfig(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Configure Blocks</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add New Block
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Block Name"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    placeholder="e.g., Block A, Phase 1"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    onClick={handleAddBlock}
                    fullWidth
                  >
                    Add Block
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Existing Blocks
            </Typography>
            <List>
              {blocks.map((block) => (
                <ListItem key={block.id}>
                  <Avatar sx={{ mr: 2 }}>
                    <Business />
                  </Avatar>
                  <ListItemText
                    primary={block.name}
                    secondary={`${block.available_plots}/${block.total_plots} plots available`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setBlocks(prev => prev.filter(b => b.id !== block.id));
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            
            {blocks.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No blocks configured yet. Add your first block above.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBlockConfig(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Plot Dialog */}
      {!readOnly && (
        <Dialog
          open={editingId !== null}
          onClose={() => {
            setEditingId(null);
            setEditingData({});
          }}
          maxWidth="md"
          fullWidth
        >
        <DialogTitle>Edit Plot</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plot Number"
                value={editingData.plot_number || ''}
                onChange={(e) => setEditingData(prev => ({ ...prev, plot_number: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Area (sq ft)"
                value={editingData.area || ''}
                onChange={(e) => setEditingData(prev => ({ ...prev, area: e.target.value }))}
                required
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price"
                value={editingData.price || ''}
                onChange={(e) => setEditingData(prev => ({ ...prev, price: e.target.value }))}
                required
                placeholder="e.g., 15 Lakhs, ₹1,50,000"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingData.status || 'available'}
                  label="Status"
                  onChange={(e) => setEditingData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="booked">Booked</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dimensions"
                value={editingData.dimensions || ''}
                onChange={(e) => setEditingData(prev => ({ ...prev, dimensions: e.target.value }))}
                placeholder="e.g., 30x40 ft"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Facing</InputLabel>
                <Select
                  value={editingData.facing || ''}
                  label="Facing"
                  onChange={(e) => setEditingData(prev => ({ ...prev, facing: e.target.value }))}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="north">North</MenuItem>
                  <MenuItem value="south">South</MenuItem>
                  <MenuItem value="east">East</MenuItem>
                  <MenuItem value="west">West</MenuItem>
                  <MenuItem value="north-east">North-East</MenuItem>
                  <MenuItem value="north-west">North-West</MenuItem>
                  <MenuItem value="south-east">South-East</MenuItem>
                  <MenuItem value="south-west">South-West</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {!isLandProperty && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Block"
                    value={editingData.block || ''}
                    onChange={(e) => setEditingData(prev => ({ ...prev, block: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Floor"
                    value={editingData.floor || ''}
                    onChange={(e) => setEditingData(prev => ({ ...prev, floor: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Unit Type"
                    value={editingData.unit_type || ''}
                    onChange={(e) => setEditingData(prev => ({ ...prev, unit_type: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Amenities"
                    value={editingData.amenities || ''}
                    onChange={(e) => setEditingData(prev => ({ ...prev, amenities: e.target.value }))}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editingData.description || ''}
                onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                placeholder="Additional details about the plot..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setEditingId(null);
              setEditingData({});
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleUpdatePlot(editingId)}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Updating...' : 'Update Plot'}
          </Button>
        </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default EnhancedPlotsEditor;
