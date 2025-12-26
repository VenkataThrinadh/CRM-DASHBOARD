import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Add,
  Delete,
  Cancel,
  CloudUpload,
  Image as ImageIcon,
  Star,
  StarBorder,
  Settings,
  Home,
  Business,
  Landscape,
  LocationCity,
  Edit,
} from '@mui/icons-material';
import { plansAPI, landPlotsAPI, propertyBlocksAPI } from '../../../main-dashboard/services/api';
import LandPlotsConfig from './LandPlotsConfig';

const EnhancedPlansEditor = ({ propertyId, propertyType = 'apartment' }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    block: '',
    floor: '',
    relatedBlock: '',
    selectedImage: null,
    imagePreview: null,
  });

  // Edit mode states
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    title: '',
    description: '',
    block: '',
    floor: '',
    relatedBlock: '',
    selectedImage: null,
    imagePreview: null,
  });
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Configuration states
  const [blockConfig, setBlockConfig] = useState([]);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showLandPlotsConfig, setShowLandPlotsConfig] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockFloors, setNewBlockFloors] = useState(1);
  
  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [blockIndexToDelete, setBlockIndexToDelete] = useState(null);
  
  // Land plots states
  const [blockPlots, setBlockPlots] = useState({}); // Store plots by block ID
  const [loadingPlots, setLoadingPlots] = useState(false);

  const fileInputRef = useRef(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await plansAPI.getByProperty(propertyId);
      const plansData = Array.isArray(response.data) ? response.data : [];
      setPlans(plansData);
    } catch (error) {
      setError('Failed to load plans. Please try again.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const loadBlockConfiguration = useCallback(async () => {
    try {
      let response;
      
      if (propertyType === 'land') {
        // For land properties, use the existing land plots API
        response = await landPlotsAPI.getPropertyBlocks(propertyId);
      } else {
        // For other property types, try the new property blocks API first
        try {
          response = await propertyBlocksAPI.getPropertyBlocks(propertyId);
        } catch (apiError) {
          // If the new API doesn't exist yet, fallback to land plots API
          // eslint-disable-next-line no-console
          console.log('Property blocks API not available, falling back to land plots API');
          response = await landPlotsAPI.getPropertyBlocks(propertyId);
        }
      }
      
      const blocksData = Array.isArray(response.data) ? response.data : [];
      // Transform blocks data to include floors info if needed
      const blockConfig = blocksData.map(block => ({
        name: block.name,
        floors: block.floors || 1, // Default to 1 floor if not specified
        id: block.id
      }));
      setBlockConfig(blockConfig);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading block configuration:', error);
      setBlockConfig([]); // Set empty array if no blocks configured
    }
  }, [propertyId, propertyType]);

  // Function to fetch plots for a specific block
  const fetchBlockPlots = useCallback(async (blockId) => {
    if (!blockId || propertyType !== 'land') {
      return [];
    }

    try {
      setLoadingPlots(true);
      const response = await landPlotsAPI.getBlockPlots(blockId);
      const plotsData = Array.isArray(response.data) ? response.data : [];
      
      // Update the blockPlots state with plots for this block
      setBlockPlots(prev => ({
        ...prev,
        [blockId]: plotsData
      }));
      
      return plotsData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching block plots:', error);
      return [];
    } finally {
      setLoadingPlots(false);
    }
  }, [propertyType]);

  useEffect(() => {
    if (propertyId) {
      fetchPlans();
      loadBlockConfiguration();
    }
  }, [propertyId, fetchPlans, loadBlockConfiguration]);

  // Reset form when switching tabs
  useEffect(() => {
    resetForm();
  }, [activeTab]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          selectedImage: file,
          imagePreview: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };
      
      // Clear floor selection when related block changes
      if (field === 'relatedBlock') {
        newData.floor = '';
        
        // For land properties, fetch plots for the selected block
        if (propertyType === 'land' && value) {
          const selectedBlock = blockConfig.find(block => block.name === value);
          if (selectedBlock && selectedBlock.id) {
            // Fetch plots for this block if not already cached
            if (!blockPlots[selectedBlock.id]) {
              fetchBlockPlots(selectedBlock.id);
            }
          }
        }
      }
      
      return newData;
    });
  };

  const handleAddPlan = async () => {
    try {
      setSaving(true);
      setError(null);

      // Determine plan type based on active tab
      const planType = activeTab === 0 ? 'master_plan' : 'floor_plan';

      // Validation
      if (!formData.title.trim()) {
        setError('Please enter a title for the plan');
        return;
      }

      if (!formData.selectedImage) {
        setError('Please select an image for the plan');
        return;
      }

      // Tab-specific validation
      if (activeTab === 1) { // Floor Plan tab
        if (!formData.relatedBlock.trim()) {
          setError(`Please specify a related block for ${propertyType === 'land' ? 'plot' : 'floor'} plans`);
          return;
        }
      }

      // Create multipart form data with file and plan data
      const planFormData = new FormData();
      planFormData.append('file', formData.selectedImage);
      planFormData.append('propertyId', propertyId);
      planFormData.append('title', formData.title.trim());
      planFormData.append('description', formData.description.trim());
      planFormData.append('planType', planType);
      planFormData.append('block', planType === 'floor_plan' ? formData.relatedBlock.trim() : formData.block.trim());
      planFormData.append('floor', formData.floor.trim() || '');
      planFormData.append('relatedBlock', formData.relatedBlock.trim() || '');

      const response = await plansAPI.create(planFormData);
      
      if (response.data) {
        setPlans(prev => [...prev, response.data]);
        resetForm();
        setSuccess('Plan added successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Edit functionality
  const handleEditPlan = (plan) => {
    setEditingId(plan.id);
    setEditingData({
      title: plan.title || '',
      description: plan.description || '',
      block: plan.block || '',
      floor: plan.floor || '',
      relatedBlock: plan.related_block || '',
      selectedImage: null,
      imagePreview: plan.image_url || null,
    });
    setShowEditDialog(true);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      setSaving(true);
      await plansAPI.delete(planId);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      setSuccess('Plan deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to delete plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (planId) => {
    try {
      setSaving(true);
      // Mock API call - in real app, this would set the plan as primary
      setPlans(prev => prev.map(plan => ({
        ...plan,
        is_primary: plan.id === planId,
      })));
      setSuccess('Primary plan updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to set primary plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingData.title.trim()) {
      setError('Please enter a title for the plan');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Create FormData for file upload if image is changed
      const formData = new FormData();
      formData.append('title', editingData.title.trim());
      formData.append('description', editingData.description.trim());
      formData.append('block', editingData.block.trim());
      formData.append('floor', editingData.floor.trim());
      formData.append('relatedBlock', editingData.relatedBlock.trim());

      if (editingData.selectedImage) {
        formData.append('file', editingData.selectedImage);
      }

      const response = await plansAPI.update(editingId, formData);

      if (response.data) {
        setPlans(prev => prev.map(plan =>
          plan.id === editingId ? { ...plan, ...response.data } : plan
        ));
        setSuccess('Plan updated successfully');
        setTimeout(() => setSuccess(null), 3000);
        handleCloseEditDialog();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingId(null);
    setEditingData({
      title: '',
      description: '',
      block: '',
      floor: '',
      relatedBlock: '',
      selectedImage: null,
      imagePreview: null,
    });
  };

  const handleEditImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setEditingData(prev => ({
          ...prev,
          selectedImage: file,
          imagePreview: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      block: '',
      floor: '',
      relatedBlock: '',
      selectedImage: null,
      imagePreview: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddBlock = async () => {
    if (!newBlockName.trim()) {
      setError('Please enter a block name');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Save block to database via appropriate API
      let response;
      
      if (propertyType === 'land') {
        response = await landPlotsAPI.addBlock(
          propertyId,
          newBlockName.trim(),
          `Block with ${newBlockFloors} floors` // description
        );
      } else {
        // Try the new property blocks API first
        try {
          response = await propertyBlocksAPI.addBlock(
            propertyId,
            newBlockName.trim(),
            newBlockFloors,
            `Block with ${newBlockFloors} floors` // description
          );
        } catch (apiError) {
          // Fallback to land plots API if new API doesn't exist
          // eslint-disable-next-line no-console
          console.log('Property blocks API not available, falling back to land plots API');
          response = await landPlotsAPI.addBlock(
            propertyId,
            newBlockName.trim(),
            `Block with ${newBlockFloors} floors` // description
          );
        }
      }

      if (response.data) {
        // Add the new block to local state with floors info
        const newBlock = {
          ...response.data,
          floors: newBlockFloors,
        };
        
        setBlockConfig(prev => [...prev, newBlock]);
        setNewBlockName('');
        setNewBlockFloors(1);
        setSuccess('Block added successfully and saved to database');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add block. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Function to delete a block
  const handleDeleteBlock = async (block, index) => {
    try {
      setSaving(true);
      setError(null);

      // If the block has an ID, delete it from the database using appropriate API
      if (block.id) {
        if (propertyType === 'land') {
          await landPlotsAPI.deleteBlock(block.id);
        } else {
          // Try the new property blocks API first
          try {
            await propertyBlocksAPI.deleteBlock(block.id);
          } catch (apiError) {
            // Fallback to land plots API if new API doesn't exist
            // eslint-disable-next-line no-console
            console.log('Property blocks API not available, falling back to land plots API');
            await landPlotsAPI.deleteBlock(block.id);
          }
        }
      }

      // Remove the block from local state
      setBlockConfig(prev => prev.filter((_, i) => i !== index));
      
      // Clear any cached plots for this block
      setBlockPlots(prev => {
        const updated = { ...prev };
        delete updated[block.id];
        return updated;
      });
      
      // If the deleted block was selected in the form, clear the selection
      if (formData.relatedBlock === block.name) {
        setFormData(prev => ({ ...prev, relatedBlock: '' }));
      }
      
      setSuccess('Block deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh the block configuration to ensure consistency
      setTimeout(() => {
        loadBlockConfiguration();
      }, 1000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete block. Please try again.');
    } finally {
      setSaving(false);
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

  const getPropertyTypeLabel = () => {
    switch (propertyType) {
      case 'land':
        return 'Land/Plot';
      case 'commercial':
        return 'Commercial';
      case 'office':
        return 'Office';
      case 'apartment':
        return 'Apartment';
      case 'villa':
        return 'Villa';
      case 'house':
        return 'House';
      default:
        return 'Property';
    }
  };



  const getFloorOptions = () => {
    // If no related block is selected, return empty array
    if (!formData.relatedBlock) {
      return [];
    }

    // Find the selected block in blockConfig
    const selectedBlock = blockConfig.find(block => block.name === formData.relatedBlock);
    
    if (!selectedBlock) {
      return [];
    }

    if (propertyType === 'land') {
      // For land, use actual configured plots from the selected block
      const plots = blockPlots[selectedBlock.id] || [];
      
      if (plots.length === 0) {
        return [{
          value: '',
          label: 'No plots configured for this block',
          disabled: true
        }];
      }
      
      return plots.map(plot => ({
        value: plot.plot_number,
        label: `${plot.plot_number} (${plot.area} sq ft, ${plot.status})`,
        plotId: plot.id,
        plotData: plot
      }));
    } else {
      // For other properties, generate floors based on the selected block's floor count
      const floorCount = selectedBlock.floors || 1;
      return Array.from({ length: floorCount }, (_, i) => ({
        value: `Floor ${i + 1}`,
        label: `Floor ${i + 1}`,
      }));
    }
  };

  const masterPlans = plans.filter(plan => plan.plan_type === 'master_plan');
  const floorPlans = plans.filter(plan => plan.plan_type === 'floor_plan');

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

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
          Plans Editor - {getPropertyTypeLabel()}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {propertyType === 'land' ? (
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setShowLandPlotsConfig(true)}
              size="small"
            >
              Configure Land Plots
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setShowConfigDialog(true)}
              size="small"
            >
              Configure {propertyType === 'apartment' ? 'Blocks' : 
                        propertyType === 'house' ? 'Sections' :
                        propertyType === 'villa' ? 'Wings' :
                        propertyType === 'commercial' ? 'Blocks' :
                        propertyType === 'office' ? 'Blocks' :
                        'Blocks'}
            </Button>
          )}
        </Box>
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

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab 
            label={`Master Plans (${masterPlans.length})`} 
            icon={<Badge badgeContent={masterPlans.length} color="primary"><Home /></Badge>}
          />
          <Tab 
            label={`${propertyType === 'land' ? 'Plot' : 'Floor'} Plans (${floorPlans.length})`}
            icon={<Badge badgeContent={floorPlans.length} color="secondary"><Business /></Badge>}
          />
        </Tabs>
      </Paper>

      {/* Master Plan Form - Tab 0 */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New Master Plan
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plan Title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Block (Optional)</InputLabel>
                <Select
                  value={formData.block}
                  label="Block (Optional)"
                  onChange={(e) => handleFormChange('block', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {blockConfig.map(block => (
                    <MenuItem key={block.name} value={block.name}>
                      {block.name}
                    </MenuItem>
                  ))}
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
              />
            </Grid>

            {/* Image Upload */}
            <Grid item xs={12}>
              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                
                {formData.imagePreview ? (
                  <Box>
                    <img
                      src={formData.imagePreview}
                      alt="Plan preview"
                      style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                    />
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={<CloudUpload />}
                      >
                        Change Image
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Click to select plan image
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => fileInputRef.current?.click()}
                      startIcon={<CloudUpload />}
                    >
                      Select Image
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleAddPlan}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <Add />}
                >
                  {saving ? 'Adding...' : 'Add Master Plan'}
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

      {/* Floor Plan Form - Tab 1 */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New {propertyType === 'land' ? 'Plot Plan' : 'Floor Plan'}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plan Title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Related Block</InputLabel>
                <Select
                  value={formData.relatedBlock}
                  label="Related Block"
                  onChange={(e) => handleFormChange('relatedBlock', e.target.value)}
                >
                  {blockConfig.map(block => (
                    <MenuItem key={block.name} value={block.name}>
                      {block.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{propertyType === 'land' ? 'Plot' : 'Floor'}</InputLabel>
                <Select
                  value={formData.floor}
                  label={propertyType === 'land' ? 'Plot' : 'Floor'}
                  onChange={(e) => handleFormChange('floor', e.target.value)}
                  disabled={!formData.relatedBlock || loadingPlots}
                >
                  {!formData.relatedBlock ? (
                    <MenuItem disabled>
                      Please select a Related Block first
                    </MenuItem>
                  ) : loadingPlots ? (
                    <MenuItem disabled>
                      Loading plots...
                    </MenuItem>
                  ) : getFloorOptions().length === 0 ? (
                    <MenuItem disabled>
                      {propertyType === 'land' ? 'No plots configured for this block' : 'No floors available for selected block'}
                    </MenuItem>
                  ) : (
                    getFloorOptions().map(option => (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </MenuItem>
                    ))
                  )}
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
              />
            </Grid>

            {/* Image Upload */}
            <Grid item xs={12}>
              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                
                {formData.imagePreview ? (
                  <Box>
                    <img
                      src={formData.imagePreview}
                      alt="Plan preview"
                      style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                    />
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={<CloudUpload />}
                      >
                        Change Image
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Click to select plan image
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => fileInputRef.current?.click()}
                      startIcon={<CloudUpload />}
                    >
                      Select Image
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleAddPlan}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <Add />}
                >
                  {saving ? 'Adding...' : `Add ${propertyType === 'land' ? 'Plot' : 'Floor'} Plan`}
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

      {/* Plans Display */}
      <TabPanel value={activeTab} index={0}>
        <Typography variant="h6" gutterBottom>
          Master Plans ({masterPlans.length})
        </Typography>
        {masterPlans.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No master plans added yet. Add your first master plan above.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {masterPlans.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card>
                  {plan.image_url && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={plan.image_url}
                      alt={plan.title}
                    />
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {plan.title}
                      </Typography>
                      {plan.is_primary && (
                        <Chip label="Primary" color="primary" size="small" />
                      )}
                    </Box>
                    
                    {plan.description && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {plan.description}
                      </Typography>
                    )}
                    
                    {plan.block && (
                      <Chip label={`Block: ${plan.block}`} size="small" sx={{ mr: 1 }} />
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => handleSetPrimary(plan.id)}
                      color={plan.is_primary ? "primary" : "default"}
                    >
                      {plan.is_primary ? <Star /> : <StarBorder />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditPlan(plan)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePlan(plan.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h6" gutterBottom>
          {propertyType === 'land' ? 'Plot' : 'Floor'} Plans ({floorPlans.length})
        </Typography>
        {floorPlans.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No {propertyType === 'land' ? 'plot' : 'floor'} plans added yet. Add your first {propertyType === 'land' ? 'plot' : 'floor'} plan above.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {floorPlans.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card>
                  {plan.image_url && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={plan.image_url}
                      alt={plan.title}
                    />
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {plan.title}
                      </Typography>
                      {plan.is_primary && (
                        <Chip label="Primary" color="primary" size="small" />
                      )}
                    </Box>
                    
                    {plan.description && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {plan.description}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {plan.floor && (
                        <Chip 
                          label={propertyType === 'land' ? `Plot: ${plan.floor}` : `Floor: ${plan.floor}`} 
                          size="small" 
                        />
                      )}
                      {plan.related_block && (
                        <Chip label={`Block: ${plan.related_block}`} size="small" />
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => handleSetPrimary(plan.id)}
                      color={plan.is_primary ? "primary" : "default"}
                    >
                      {plan.is_primary ? <Star /> : <StarBorder />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditPlan(plan)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePlan(plan.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Block Configuration Dialog */}
      <Dialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure {propertyType === 'apartment' ? 'Blocks & Floors' : 
                    propertyType === 'house' ? 'Sections & Floors' :
                    propertyType === 'villa' ? 'Wings & Floors' :
                    propertyType === 'commercial' ? 'Blocks & Floors' :
                    propertyType === 'office' ? 'Blocks & Floors' :
                    'Blocks & Floors'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New {propertyType === 'apartment' ? 'Block' : 
                      propertyType === 'house' ? 'Section' :
                      propertyType === 'villa' ? 'Wing' :
                      propertyType === 'commercial' ? 'Block' :
                      propertyType === 'office' ? 'Block' :
                      'Block'}
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`${propertyType === 'apartment' ? 'Block' : 
                          propertyType === 'house' ? 'Section' :
                          propertyType === 'villa' ? 'Wing' :
                          propertyType === 'commercial' ? 'Block' :
                          propertyType === 'office' ? 'Block' :
                          'Block'} Name`}
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  placeholder={propertyType === 'apartment' ? 'e.g., Block A, Tower 1' :
                              propertyType === 'house' ? 'e.g., Main Section, East Wing' :
                              propertyType === 'villa' ? 'e.g., Main Wing, Guest Wing' :
                              propertyType === 'commercial' ? 'e.g., Block A, Building 1' :
                              propertyType === 'office' ? 'e.g., Block A, Tower 1' :
                              'e.g., Block A, Tower 1'}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Number of Floors"
                  type="number"
                  value={newBlockFloors}
                  onChange={(e) => setNewBlockFloors(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="contained"
                  onClick={handleAddBlock}
                  fullWidth
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Existing {propertyType === 'apartment' ? 'Blocks' : 
                     propertyType === 'house' ? 'Sections' :
                     propertyType === 'villa' ? 'Wings' :
                     propertyType === 'commercial' ? 'Blocks' :
                     propertyType === 'office' ? 'Blocks' :
                     'Blocks'}
          </Typography>
          <List>
            {blockConfig.map((block, index) => (
              <ListItem key={index}>
                <Avatar sx={{ mr: 2 }}>
                  <Business />
                </Avatar>
                <ListItemText
                  primary={block.name}
                  secondary={`${block.floors} floors`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => {
                      setBlockToDelete(block);
                      setBlockIndexToDelete(index);
                      setDeleteConfirmOpen(true);
                    }}
                    disabled={saving}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          
          {blockConfig.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No {propertyType === 'apartment' ? 'blocks' : 
                  propertyType === 'house' ? 'sections' :
                  propertyType === 'villa' ? 'wings' :
                  propertyType === 'commercial' ? 'blocks' :
                  propertyType === 'office' ? 'blocks' :
                  'blocks'} configured yet. Add your first {propertyType === 'apartment' ? 'block' : 
                                                           propertyType === 'house' ? 'section' :
                                                           propertyType === 'villa' ? 'wing' :
                                                           propertyType === 'commercial' ? 'block' :
                                                           propertyType === 'office' ? 'block' :
                                                           'block'} above.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Land Plots Configuration Dialog */}
      {propertyType === 'land' && (
        <LandPlotsConfig
          propertyId={propertyId}
          open={showLandPlotsConfig}
          onClose={() => setShowLandPlotsConfig(false)}
          onConfigChange={(config) => {
            // Land plots configuration updated
            // Refresh block configuration and clear cached plots
            loadBlockConfiguration();
            setBlockPlots({}); // Clear cached plots so they get refetched
            
            // If a block is currently selected, refetch its plots
            if (formData.relatedBlock) {
              const selectedBlock = blockConfig.find(block => block.name === formData.relatedBlock);
              if (selectedBlock && selectedBlock.id) {
                fetchBlockPlots(selectedBlock.id);
              }
            }
          }}
        />
      )}

      {/* Edit Plan Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Plan
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Plan Title"
                  value={editingData.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Block (Optional)</InputLabel>
                  <Select
                    value={editingData.block}
                    label="Block (Optional)"
                    onChange={(e) => handleEditFormChange('block', e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {blockConfig.map(block => (
                      <MenuItem key={block.name} value={block.name}>
                        {block.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editingData.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Show floor/block fields only for floor plans */}
              {plans.find(p => p.id === editingId)?.plan_type === 'floor_plan' && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Related Block</InputLabel>
                      <Select
                        value={editingData.relatedBlock}
                        label="Related Block"
                        onChange={(e) => handleEditFormChange('relatedBlock', e.target.value)}
                      >
                        {blockConfig.map(block => (
                          <MenuItem key={block.name} value={block.name}>
                            {block.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>{propertyType === 'land' ? 'Plot' : 'Floor'}</InputLabel>
                      <Select
                        value={editingData.floor}
                        label={propertyType === 'land' ? 'Plot' : 'Floor'}
                        onChange={(e) => handleEditFormChange('floor', e.target.value)}
                        disabled={!editingData.relatedBlock}
                      >
                        {!editingData.relatedBlock ? (
                          <MenuItem disabled>
                            Please select a Related Block first
                          </MenuItem>
                        ) : getFloorOptions().length === 0 ? (
                          <MenuItem disabled>
                            {propertyType === 'land' ? 'No plots configured for this block' : 'No floors available for selected block'}
                          </MenuItem>
                        ) : (
                          getFloorOptions().map(option => (
                            <MenuItem
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}
                            >
                              {option.label}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              {/* Image Upload */}
              <Grid item xs={12}>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageSelect}
                    style={{ display: 'none' }}
                    id="edit-image-input"
                  />

                  {editingData.imagePreview ? (
                    <Box>
                      <img
                        src={editingData.imagePreview}
                        alt="Plan preview"
                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                      />
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => document.getElementById('edit-image-input').click()}
                          startIcon={<CloudUpload />}
                        >
                          Change Image
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        Click to select new plan image
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => document.getElementById('edit-image-input').click()}
                        startIcon={<CloudUpload />}
                      >
                        Select Image
                      </Button>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={saving || !editingData.title.trim()}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Updating...' : 'Update Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete {propertyType === 'apartment' ? 'Block' : 
                         propertyType === 'house' ? 'Section' :
                         propertyType === 'villa' ? 'Wing' :
                         propertyType === 'commercial' ? 'Block' :
                         propertyType === 'office' ? 'Block' :
                         'Block'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the {propertyType === 'apartment' ? 'block' : 
                                                 propertyType === 'house' ? 'section' :
                                                 propertyType === 'villa' ? 'wing' :
                                                 propertyType === 'commercial' ? 'block' :
                                                 propertyType === 'office' ? 'block' :
                                                 'block'} "{blockToDelete?.name}"? 
            This action cannot be undone and will also delete all floor plans associated with this {propertyType === 'apartment' ? 'block' : 
                                                                                                    propertyType === 'house' ? 'section' :
                                                                                                    propertyType === 'villa' ? 'wing' :
                                                                                                    propertyType === 'commercial' ? 'block' :
                                                                                                    propertyType === 'office' ? 'block' :
                                                                                                    'block'}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              setBlockToDelete(null);
              setBlockIndexToDelete(null);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={async () => {
              if (blockToDelete && blockIndexToDelete !== null) {
                await handleDeleteBlock(blockToDelete, blockIndexToDelete);
                setDeleteConfirmOpen(false);
                setBlockToDelete(null);
                setBlockIndexToDelete(null);
              }
            }}
            variant="contained"
            color="error"
            disabled={saving}
          >
            {saving ? 'Deleting...' : `Delete ${propertyType === 'apartment' ? 'Block' : 
                                                    propertyType === 'house' ? 'Section' :
                                                    propertyType === 'villa' ? 'Wing' :
                                                    propertyType === 'commercial' ? 'Block' :
                                                    propertyType === 'office' ? 'Block' :
                                                    'Block'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedPlansEditor;
