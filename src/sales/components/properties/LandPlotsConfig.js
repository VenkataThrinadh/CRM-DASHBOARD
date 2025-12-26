import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Cancel,
  Business,
  Landscape,
  CheckCircle,
  Schedule,
  Sell,
  Home,
} from '@mui/icons-material';
import { landPlotsAPI } from '../../../main-dashboard/services/api';

const LandPlotsConfig = forwardRef(({ propertyId, open, onClose, onConfigChange }, ref) => {
  const [activeTab, setActiveTab] = useState(0);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Block form states
  const [showAddBlockForm, setShowAddBlockForm] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    name: '',
    description: '',
  });
  const [editingBlock, setEditingBlock] = useState(null);

  // Plot form states
  const [showAddPlotForm, setShowAddPlotForm] = useState(false);
  const [plotFormData, setPlotFormData] = useState({
    plot_number: '',
    area: '',
    price: '',
    status: 'available',
    description: '',
    dimensions: '',
    facing: '',
  });
  const [editingPlot, setEditingPlot] = useState(null);

  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await landPlotsAPI.getPropertyBlocks(propertyId);
      const blocksData = Array.isArray(response.data) ? response.data : [];
      setBlocks(blocksData);
      
      // Select first block if available
      if (blocksData.length > 0 && !selectedBlock) {
        setSelectedBlock(blocksData[0]);
      }
    } catch (error) {
      setError('Failed to load blocks. Please try again.');
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId, selectedBlock]);

  const fetchBlockPlots = async (blockId) => {
    try {
      setLoading(true);
      const response = await landPlotsAPI.getBlockPlots(blockId);
      const plotsData = Array.isArray(response.data) ? response.data : [];
      setPlots(plotsData);
    } catch (error) {
      setError('Failed to load plots for this block.');
      setPlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && propertyId) {
      fetchBlocks();
    }
  }, [open, propertyId, fetchBlocks]);

  useEffect(() => {
    if (selectedBlock) {
      fetchBlockPlots(selectedBlock.id);
    }
  }, [selectedBlock]);

  const handleSaveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare configuration data
      const configData = {
        blocks: blocks.map(block => ({
          id: block.id,
          name: block.name,
          description: block.description,
          plots: plots.filter(plot => plot.block_id === block.id),
        })),
      };

      // Call the bulk update API
      await landPlotsAPI.bulkUpdatePropertyBlocks(propertyId, configData.blocks);

      if (onConfigChange) {
        onConfigChange(configData);
      }

      setSuccess('Configuration saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleSaveAndClose: async () => {
      await handleSaveConfiguration();
      onClose();
    },
    refreshData: () => {
      fetchBlocks();
    },
  }));

  const handleAddBlock = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!blockFormData.name.trim()) {
        setError('Please enter a block name');
        return;
      }

      const response = await landPlotsAPI.addBlock(
        propertyId,
        blockFormData.name.trim(),
        blockFormData.description.trim()
      );

      if (response.data) {
        setBlocks(prev => [...prev, response.data]);
        setBlockFormData({ name: '', description: '' });
        setShowAddBlockForm(false);
        setSuccess('Block added successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add block. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBlock = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await landPlotsAPI.updateBlock(
        editingBlock.id,
        blockFormData.name.trim(),
        blockFormData.description.trim()
      );

      if (response.data) {
        setBlocks(prev => prev.map(block => 
          block.id === editingBlock.id ? { ...block, ...response.data } : block
        ));
        setBlockFormData({ name: '', description: '' });
        setEditingBlock(null);
        setSuccess('Block updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update block. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm('Are you sure you want to delete this block? All plots in this block will also be deleted.')) {
      return;
    }

    try {
      setSaving(true);
      await landPlotsAPI.deleteBlock(blockId);
      setBlocks(prev => prev.filter(block => block.id !== blockId));
      
      // If deleted block was selected, select another one
      if (selectedBlock && selectedBlock.id === blockId) {
        const remainingBlocks = blocks.filter(block => block.id !== blockId);
        setSelectedBlock(remainingBlocks.length > 0 ? remainingBlocks[0] : null);
        setPlots([]);
      }
      
      setSuccess('Block deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to delete block. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlot = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!selectedBlock) {
        setError('Please select a block first');
        return;
      }

      if (!plotFormData.plot_number.trim() || !plotFormData.area.trim() || !plotFormData.price.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      const plotData = {
        block_id: selectedBlock.id,
        plot_number: plotFormData.plot_number.trim(),
        area: parseFloat(plotFormData.area) || 0,
        price: plotFormData.price.trim(),
        status: plotFormData.status,
        description: plotFormData.description.trim(),
        dimensions: plotFormData.dimensions.trim(),
        facing: plotFormData.facing.trim(),
      };

      const response = await landPlotsAPI.create(plotData);

      if (response.data) {
        setPlots(prev => [...prev, response.data]);
        setPlotFormData({
          plot_number: '',
          area: '',
          price: '',
          status: 'available',
          description: '',
          dimensions: '',
          facing: '',
        });
        setShowAddPlotForm(false);
        setSuccess('Plot added successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add plot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlot = async () => {
    try {
      setSaving(true);
      setError(null);

      const plotData = {
        plot_number: plotFormData.plot_number.trim(),
        area: parseFloat(plotFormData.area) || 0,
        price: plotFormData.price.trim(),
        status: plotFormData.status,
        description: plotFormData.description.trim(),
        dimensions: plotFormData.dimensions.trim(),
        facing: plotFormData.facing.trim(),
      };

      const response = await landPlotsAPI.update(editingPlot.id, plotData);

      if (response.data) {
        setPlots(prev => prev.map(plot => 
          plot.id === editingPlot.id ? { ...plot, ...response.data } : plot
        ));
        setPlotFormData({
          plot_number: '',
          area: '',
          price: '',
          status: 'available',
          description: '',
          dimensions: '',
          facing: '',
        });
        setEditingPlot(null);
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
    if (!window.confirm('Are you sure you want to delete this plot?')) {
      return;
    }

    try {
      setSaving(true);
      await landPlotsAPI.delete(plotId);
      setPlots(prev => prev.filter(plot => plot.id !== plotId));
      setSuccess('Plot deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to delete plot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEditBlock = (block) => {
    setEditingBlock(block);
    setBlockFormData({
      name: block.name || '',
      description: block.description || '',
    });
    setShowAddBlockForm(true);
  };

  const startEditPlot = (plot) => {
    setEditingPlot(plot);
    setPlotFormData({
      plot_number: plot.plot_number || '',
      area: plot.area || '',
      price: plot.price || '',
      status: plot.status || 'available',
      description: plot.description || '',
      dimensions: plot.dimensions || '',
      facing: plot.facing || '',
    });
    setShowAddPlotForm(true);
  };

  const cancelBlockForm = () => {
    setShowAddBlockForm(false);
    setEditingBlock(null);
    setBlockFormData({ name: '', description: '' });
  };

  const cancelPlotForm = () => {
    setShowAddPlotForm(false);
    setEditingPlot(null);
    setPlotFormData({
      plot_number: '',
      area: '',
      price: '',
      status: 'available',
      description: '',
      dimensions: '',
      facing: '',
    });
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

  const getPlotCounts = () => {
    return {
      total: plots.length,
      available: plots.filter(p => p.status === 'available').length,
      booked: plots.filter(p => p.status === 'booked').length,
      sold: plots.filter(p => p.status === 'sold').length,
    };
  };

  const plotCounts = getPlotCounts();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Landscape />
          <Typography variant="h6">Land Plots Configuration</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
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
              label={`Blocks (${blocks.length})`} 
              icon={<Badge badgeContent={blocks.length} color="primary"><Business /></Badge>}
            />
            <Tab 
              label={`Plots (${plotCounts.total})`}
              icon={<Badge badgeContent={plotCounts.total} color="secondary"><Landscape /></Badge>}
            />
          </Tabs>
        </Paper>

        {/* Blocks Tab */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Manage Blocks</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowAddBlockForm(true)}
                disabled={saving}
              >
                Add Block
              </Button>
            </Box>

            {/* Add/Edit Block Form */}
            {showAddBlockForm && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {editingBlock ? 'Edit Block' : 'Add New Block'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Block Name"
                      value={blockFormData.name}
                      onChange={(e) => setBlockFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="e.g., Block A, Phase 1"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={blockFormData.description}
                      onChange={(e) => setBlockFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                        onClick={editingBlock ? handleUpdateBlock : handleAddBlock}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : (editingBlock ? 'Update Block' : 'Add Block')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={cancelBlockForm}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Blocks List */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : blocks.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No blocks configured yet. Add your first block above.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {blocks.map((block) => (
                  <Grid item xs={12} sm={6} md={4} key={block.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedBlock?.id === block.id ? 2 : 1,
                        borderColor: selectedBlock?.id === block.id ? 'primary.main' : 'divider',
                      }}
                      onClick={() => setSelectedBlock(block)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Business />
                          </Avatar>
                          <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {block.name}
                          </Typography>
                          {selectedBlock?.id === block.id && (
                            <Chip label="Selected" color="primary" size="small" />
                          )}
                        </Box>
                        
                        {block.description && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {block.description}
                          </Typography>
                        )}
                        
                        <Typography variant="caption" color="text.secondary">
                          {plots.filter(p => p.block_id === block.id).length} plots
                        </Typography>
                      </CardContent>
                      
                      <CardActions>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditBlock(block);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(block.id);
                          }}
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
          </Box>
        )}

        {/* Plots Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Manage Plots {selectedBlock && `- ${selectedBlock.name}`}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowAddPlotForm(true)}
                disabled={saving || !selectedBlock}
              >
                Add Plot
              </Button>
            </Box>

            {!selectedBlock && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Please select a block from the Blocks tab to manage its plots.
              </Alert>
            )}

            {/* Plot Statistics */}
            {selectedBlock && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">{plotCounts.total}</Typography>
                      <Typography variant="caption">Total Plots</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">{plotCounts.available}</Typography>
                      <Typography variant="caption">Available</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">{plotCounts.booked}</Typography>
                      <Typography variant="caption">Booked</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">{plotCounts.sold}</Typography>
                      <Typography variant="caption">Sold</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Add/Edit Plot Form */}
            {showAddPlotForm && selectedBlock && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {editingPlot ? 'Edit Plot' : 'Add New Plot'} - {selectedBlock.name}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Plot Number"
                      value={plotFormData.plot_number}
                      onChange={(e) => setPlotFormData(prev => ({ ...prev, plot_number: e.target.value }))}
                      required
                      placeholder="e.g., P001, Plot-1"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Area (sq ft)"
                      type="number"
                      value={plotFormData.area}
                      onChange={(e) => setPlotFormData(prev => ({ ...prev, area: e.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Price"
                      value={plotFormData.price}
                      onChange={(e) => setPlotFormData(prev => ({ ...prev, price: e.target.value }))}
                      required
                      placeholder="e.g., 15 Lakhs, 1.5 Crores"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={plotFormData.status}
                        label="Status"
                        onChange={(e) => setPlotFormData(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="booked">Booked</MenuItem>
                        <MenuItem value="sold">Sold</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Dimensions"
                      value={plotFormData.dimensions}
                      onChange={(e) => setPlotFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                      placeholder="e.g., 30x40 ft"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Facing</InputLabel>
                      <Select
                        value={plotFormData.facing}
                        label="Facing"
                        onChange={(e) => setPlotFormData(prev => ({ ...prev, facing: e.target.value }))}
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
                      value={plotFormData.description}
                      onChange={(e) => setPlotFormData(prev => ({ ...prev, description: e.target.value }))}
                      multiline
                      rows={2}
                      placeholder="Additional details about the plot..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                        onClick={editingPlot ? handleUpdatePlot : handleAddPlot}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : (editingPlot ? 'Update Plot' : 'Add Plot')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={cancelPlotForm}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Plots List */}
            {selectedBlock && (
              <>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : plots.filter(p => p.block_id === selectedBlock.id).length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No plots added to this block yet. Add your first plot above.
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {plots.filter(p => p.block_id === selectedBlock.id).map((plot) => (
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
                          
                          <CardActions>
                            <IconButton
                              size="small"
                              onClick={() => startEditPlot(plot)}
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
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSaveConfiguration}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
        <Button onClick={onClose} disabled={saving}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default LandPlotsConfig;
