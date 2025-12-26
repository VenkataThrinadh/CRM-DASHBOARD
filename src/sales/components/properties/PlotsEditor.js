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
} from '@mui/icons-material';
import { plotsAPI } from '../../../main-dashboard/services/api';

const PlotsEditor = ({ propertyId, propertyType }) => {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPlot, setNewPlot] = useState({ 
    plot_number: '', 
    area: '', 
    price: '', 
    status: 'available',
    dimensions: '',
    facing: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editingPlot, setEditingPlot] = useState({ 
    plot_number: '', 
    area: '', 
    price: '', 
    status: 'available',
    dimensions: '',
    facing: ''
  });
  const [error, setError] = useState(null);

  const fetchPlots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await plotsAPI.getByProperty(propertyId);
      setPlots(response.data || []);
    } catch (error) {
      setError('Failed to load plots');
      setPlots([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchPlots();
    }
  }, [propertyId, fetchPlots]);

  const handleAddPlot = async () => {
    if (!newPlot.plot_number.trim() || !newPlot.area.trim()) return;

    try {
      setSaving(true);
      const response = await plotsAPI.create({
        propertyId: propertyId,
        plot_number: newPlot.plot_number.trim(),
        area: newPlot.area.trim(),
        price: newPlot.price.trim() || null,
        status: newPlot.status,
        dimensions: newPlot.dimensions.trim() || null,
        facing: newPlot.facing.trim() || null
      });
      
      setPlots([...plots, response.data]);
      setNewPlot({ 
        plot_number: '', 
        area: '', 
        price: '', 
        status: 'available',
        dimensions: '',
        facing: ''
      });
      setError(null);
    } catch (error) {
      setError('Failed to add plot');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPlot = (plot) => {
    setEditingId(plot.id);
    setEditingPlot({ 
      plot_number: plot.plot_number, 
      area: plot.area, 
      price: plot.price || '',
      status: plot.status || 'available',
      dimensions: plot.dimensions || '',
      facing: plot.facing || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPlot.plot_number.trim() || !editingPlot.area.trim()) return;

    try {
      setSaving(true);
      await plotsAPI.update(editingId, {
        plot_number: editingPlot.plot_number.trim(),
        area: editingPlot.area.trim(),
        price: editingPlot.price.trim() || null,
        status: editingPlot.status,
        dimensions: editingPlot.dimensions.trim() || null,
        facing: editingPlot.facing.trim() || null
      });
      
      setPlots(plots.map(p => 
        p.id === editingId ? { ...p, ...editingPlot } : p
      ));
      setEditingId(null);
      setEditingPlot({ 
        plot_number: '', 
        area: '', 
        price: '', 
        status: 'available',
        dimensions: '',
        facing: ''
      });
      setError(null);
    } catch (error) {
      setError('Failed to update plot');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingPlot({ 
      plot_number: '', 
      area: '', 
      price: '', 
      status: 'available',
      dimensions: '',
      facing: ''
    });
  };

  const handleDeletePlot = async (plotId) => {
    if (!window.confirm('Are you sure you want to delete this plot?')) {
      return;
    }

    try {
      setSaving(true);
      await plotsAPI.delete(plotId);
      setPlots(plots.filter(p => p.id !== plotId));
      setError(null);
    } catch (error) {
      setError('Failed to delete plot');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'available', label: 'Available', color: 'success' },
    { value: 'sold', label: 'Sold', color: 'error' },
    { value: 'reserved', label: 'Reserved', color: 'warning' },
    { value: 'blocked', label: 'Blocked', color: 'default' },
  ];

  const facingOptions = [
    'North', 'South', 'East', 'West', 
    'North-East', 'North-West', 'South-East', 'South-West'
  ];

  const formatPrice = (price) => {
    if (!price) return '';
    const numPrice = parseFloat(price);
    if (numPrice >= 10000000) {
      return `₹${(numPrice / 10000000).toFixed(1)} Cr`;
    } else if (numPrice >= 100000) {
      return `₹${(numPrice / 100000).toFixed(1)} L`;
    }
    return `₹${numPrice.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Plot Details & Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add New Plot */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add New Plot
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Plot Number"
              value={newPlot.plot_number}
              onChange={(e) => setNewPlot({ ...newPlot, plot_number: e.target.value })}
              placeholder="e.g., A-101"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Numbers />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Area (sq ft)"
              value={newPlot.area}
              onChange={(e) => setNewPlot({ ...newPlot, area: e.target.value })}
              placeholder="e.g., 1200"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SquareFoot />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Price"
              value={newPlot.price}
              onChange={(e) => setNewPlot({ ...newPlot, price: e.target.value })}
              placeholder="e.g., 2400000"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Dimensions"
              value={newPlot.dimensions}
              onChange={(e) => setNewPlot({ ...newPlot, dimensions: e.target.value })}
              placeholder="e.g., 30x40"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newPlot.status}
                onChange={(e) => setNewPlot({ ...newPlot, status: e.target.value })}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Add />}
              onClick={handleAddPlot}
              disabled={!newPlot.plot_number.trim() || !newPlot.area.trim() || saving}
              fullWidth
            >
              Add Plot
            </Button>
          </Grid>
        </Grid>
        
        {/* Additional fields row */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Facing</InputLabel>
              <Select
                value={newPlot.facing}
                onChange={(e) => setNewPlot({ ...newPlot, facing: e.target.value })}
                label="Facing"
              >
                <MenuItem value="">
                  <em>Select Facing</em>
                </MenuItem>
                {facingOptions.map((facing) => (
                  <MenuItem key={facing} value={facing}>
                    {facing}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Plots List */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Current Plots ({plots.length})
        </Typography>
        
        {plots.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No plots added yet. Add plot details to manage individual plot sales and availability.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {plots.map((plot) => (
              <Grid item xs={12} sm={6} md={4} key={plot.id}>
                <Card variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    {editingId === plot.id ? (
                      <Box>
                        <TextField
                          fullWidth
                          size="small"
                          label="Plot Number"
                          value={editingPlot.plot_number}
                          onChange={(e) => setEditingPlot({ ...editingPlot, plot_number: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Area (sq ft)"
                          value={editingPlot.area}
                          onChange={(e) => setEditingPlot({ ...editingPlot, area: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Price"
                          value={editingPlot.price}
                          onChange={(e) => setEditingPlot({ ...editingPlot, price: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Dimensions"
                          value={editingPlot.dimensions}
                          onChange={(e) => setEditingPlot({ ...editingPlot, dimensions: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={editingPlot.status}
                            onChange={(e) => setEditingPlot({ ...editingPlot, status: e.target.value })}
                            label="Status"
                          >
                            {statusOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel>Facing</InputLabel>
                          <Select
                            value={editingPlot.facing}
                            onChange={(e) => setEditingPlot({ ...editingPlot, facing: e.target.value })}
                            label="Facing"
                          >
                            <MenuItem value="">
                              <em>Select Facing</em>
                            </MenuItem>
                            {facingOptions.map((facing) => (
                              <MenuItem key={facing} value={facing}>
                                {facing}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    ) : (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" color="primary">
                            Plot {plot.plot_number}
                          </Typography>
                          <Chip 
                            label={statusOptions.find(opt => opt.value === plot.status)?.label || plot.status}
                            color={getStatusColor(plot.status)}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <SquareFoot sx={{ fontSize: 16, mr: 0.5 }} />
                          {plot.area} sq ft
                        </Typography>
                        
                        {plot.dimensions && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <Landscape sx={{ fontSize: 16, mr: 0.5 }} />
                            {plot.dimensions}
                          </Typography>
                        )}
                        
                        {plot.facing && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Facing: {plot.facing}
                          </Typography>
                        )}
                        
                        {plot.price && (
                          <Typography variant="body1" color="success.main" sx={{ mt: 1 }}>
                            <AttachMoney sx={{ fontSize: 16, mr: 0.5 }} />
                            {formatPrice(plot.price)}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    {editingId === plot.id ? (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={handleSaveEdit}
                          disabled={!editingPlot.plot_number.trim() || !editingPlot.area.trim() || saving}
                          color="primary"
                        >
                          <Save />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          <Cancel />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPlot(plot)}
                          color="primary"
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
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Plot Statistics */}
      {plots.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Plot Statistics:
          </Typography>
          <Grid container spacing={2}>
            {statusOptions.map((status) => {
              const count = plots.filter(p => p.status === status.value).length;
              return count > 0 ? (
                <Grid item key={status.value}>
                  <Chip 
                    label={`${status.label}: ${count}`}
                    color={status.color}
                    variant="outlined"
                  />
                </Grid>
              ) : null;
            })}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default PlotsEditor;
