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
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Cancel,
  Home,
  AttachMoney,
  SquareFoot,
} from '@mui/icons-material';
import { plansAPI } from '../../../main-dashboard/services/api';

const PlansEditor = ({ propertyId, propertyType }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', area: '', price: '' });
  const [editingId, setEditingId] = useState(null);
  const [editingPlan, setEditingPlan] = useState({ name: '', area: '', price: '' });
  const [error, setError] = useState(null);

  // Helper function to validate plan objects
  const isValidPlan = (plan) => {
    return plan &&
           typeof plan === 'object' &&
           plan.id !== undefined &&
           plan.name !== undefined &&
           plan.name !== null;
  };

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await plansAPI.getByProperty(propertyId);
      // Filter out invalid plans and ensure required properties exist
      const validPlans = (response.data || []).filter(isValidPlan);
      setPlans(validPlans);
    } catch (error) {
      setError('Failed to load floor plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchPlans();
    }
  }, [propertyId, fetchPlans]);

  const handleAddPlan = async () => {
    if (!newPlan.name.trim() || !newPlan.area.trim()) return;

    try {
      setSaving(true);
      const response = await plansAPI.create({
        propertyId: propertyId,
        name: newPlan.name.trim(),
        area: newPlan.area.trim(),
        price: newPlan.price.trim() || null
      });
      
      if (response.data && response.data.id) {
        setPlans([...plans, response.data]);
      }
      setNewPlan({ name: '', area: '', price: '' });
      setError(null);
    } catch (error) {
      setError('Failed to add floor plan');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingId(plan.id);
    setEditingPlan({ 
      name: plan.name || '', 
      area: plan.area || '', 
      price: plan.price || '' 
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPlan.name.trim() || !editingPlan.area.trim()) return;

    try {
      setSaving(true);
      await plansAPI.update(editingId, {
        name: editingPlan.name.trim(),
        area: editingPlan.area.trim(),
        price: editingPlan.price.trim() || null
      });
      
      setPlans(plans.map(p => 
        p && p.id === editingId ? { ...p, ...editingPlan } : p
      ));
      setEditingId(null);
      setEditingPlan({ name: '', area: '', price: '' });
      setError(null);
    } catch (error) {
      setError('Failed to update floor plan');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingPlan({ name: '', area: '', price: '' });
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this floor plan?')) {
      return;
    }

    try {
      setSaving(true);
      await plansAPI.delete(planId);
      setPlans(plans.filter(p => p && p.id !== planId));
      setError(null);
    } catch (error) {
      setError('Failed to delete floor plan');
    } finally {
      setSaving(false);
    }
  };

  // Get common plan types based on property type
  const getCommonPlans = () => {
    if (propertyType === 'apartment' || propertyType === 'house' || propertyType === 'villa') {
      return [
        { name: '1BHK', area: '500', price: '' },
        { name: '2BHK', area: '800', price: '' },
        { name: '3BHK', area: '1200', price: '' },
        { name: '4BHK', area: '1600', price: '' },
        { name: 'Penthouse', area: '2000', price: '' },
      ];
    } else if (propertyType === 'commercial' || propertyType === 'office') {
      return [
        { name: 'Ground Floor', area: '1000', price: '' },
        { name: 'First Floor', area: '1000', price: '' },
        { name: 'Second Floor', area: '1000', price: '' },
        { name: 'Basement', area: '800', price: '' },
      ];
    } else if (propertyType === 'plot' || propertyType === 'land') {
      return [
        { name: 'Plot A', area: '1000', price: '' },
        { name: 'Plot B', area: '1500', price: '' },
        { name: 'Plot C', area: '2000', price: '' },
        { name: 'Corner Plot', area: '1200', price: '' },
      ];
    }

    return [
      { name: 'Floor Plan 1', area: '1000', price: '' },
      { name: 'Floor Plan 2', area: '1200', price: '' },
    ];
  };

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
        Floor Plans & Layouts
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add New Plan */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add New Floor Plan
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Plan Name"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              placeholder="e.g., 2BHK, Ground Floor"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Home />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Area (sq ft)"
              value={newPlan.area}
              onChange={(e) => setNewPlan({ ...newPlan, area: e.target.value })}
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
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Price (Optional)"
              value={newPlan.price}
              onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
              placeholder="e.g., 5000000"
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
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Add />}
              onClick={handleAddPlan}
              disabled={!newPlan.name.trim() || !newPlan.area.trim() || saving}
              fullWidth
            >
              Add Plan
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Plans List */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Current Floor Plans ({plans.length})
        </Typography>
        
        {plans.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No floor plans added yet. Add floor plans to show different layout options for your property.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {plans.filter(isValidPlan).map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    {editingId === plan.id ? (
                      <Box>
                        <TextField
                          fullWidth
                          size="small"
                          label="Plan Name"
                          value={editingPlan.name}
                          onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Area (sq ft)"
                          value={editingPlan.area}
                          onChange={(e) => setEditingPlan({ ...editingPlan, area: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Price (Optional)"
                          value={editingPlan.price}
                          onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                        />
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="h6" color="primary" gutterBottom>
                          {plan.name || 'Unnamed Plan'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <SquareFoot sx={{ fontSize: 16, mr: 0.5 }} />
                          {plan.area || 'N/A'} sq ft
                        </Typography>
                        {plan.price && (
                          <Typography variant="body1" color="success.main" sx={{ mt: 1 }}>
                            <AttachMoney sx={{ fontSize: 16, mr: 0.5 }} />
                            {formatPrice(plan.price)}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    {editingId === plan.id ? (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={handleSaveEdit}
                          disabled={!editingPlan.name.trim() || !editingPlan.area.trim() || saving}
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
                      </Box>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Common Plans Suggestions */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Common Floor Plans for {propertyType} (Click to add):
        </Typography>
        <Grid container spacing={1}>
          {getCommonPlans().map((suggestion, index) => (
            <Grid item key={index}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (!plans.some(p => p.name && p.name.toLowerCase() === suggestion.name.toLowerCase())) {
                    setNewPlan(suggestion);
                  }
                }}
                disabled={plans.some(p => p.name && p.name.toLowerCase() === suggestion.name.toLowerCase())}
                sx={{ mb: 1 }}
              >
                {suggestion.name} ({suggestion.area} sq ft)
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default PlansEditor;
