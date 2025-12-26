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
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import { specificationsAPI } from '../../../main-dashboard/services/api';

const SpecificationsEditor = ({ propertyId, propertyType }) => {
  const [specifications, setSpecifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSpec, setNewSpec] = useState({ name: '', value: '' });
  const [editingId, setEditingId] = useState(null);
  const [editingSpec, setEditingSpec] = useState({ name: '', value: '' });
  const [error, setError] = useState(null);

  const fetchSpecifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await specificationsAPI.getByProperty(propertyId);
      setSpecifications(response.data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch specifications:', error);
      setError('Failed to load specifications');
      setSpecifications([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchSpecifications();
    }
  }, [propertyId, fetchSpecifications]);

  const handleAddSpecification = async () => {
    if (!newSpec.name.trim() || !newSpec.value.trim()) return;

    try {
      setSaving(true);
      const response = await specificationsAPI.create({
        propertyId: propertyId,
        name: newSpec.name.trim(),
        value: newSpec.value.trim()
      });
      
      setSpecifications([...specifications, response.data]);
      setNewSpec({ name: '', value: '' });
      setError(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add specification:', error);
      setError('Failed to add specification');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSpecification = (spec) => {
    setEditingId(spec.id);
    setEditingSpec({ name: spec.name, value: spec.value });
  };

  const handleSaveEdit = async () => {
    if (!editingSpec.name.trim() || !editingSpec.value.trim()) return;

    try {
      setSaving(true);
      await specificationsAPI.update(editingId, {
        name: editingSpec.name.trim(),
        value: editingSpec.value.trim()
      });
      
      setSpecifications(specifications.map(s => 
        s.id === editingId ? { ...s, ...editingSpec } : s
      ));
      setEditingId(null);
      setEditingSpec({ name: '', value: '' });
      setError(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update specification:', error);
      setError('Failed to update specification');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingSpec({ name: '', value: '' });
  };

  const handleDeleteSpecification = async (specId) => {
    if (!window.confirm('Are you sure you want to delete this specification?')) {
      return;
    }

    try {
      setSaving(true);
      await specificationsAPI.delete(specId);
      setSpecifications(specifications.filter(s => s.id !== specId));
      setError(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete specification:', error);
      setError('Failed to delete specification');
    } finally {
      setSaving(false);
    }
  };

  // Get common specifications based on property type
  const getCommonSpecifications = () => {
    const common = [
      { name: 'Total Area', value: 'sq ft' },
      { name: 'Built-up Area', value: 'sq ft' },
      { name: 'Carpet Area', value: 'sq ft' },
      { name: 'Floor', value: '' },
      { name: 'Total Floors', value: '' },
      { name: 'Facing', value: '' },
      { name: 'Age of Property', value: 'years' },
    ];

    if (propertyType === 'apartment' || propertyType === 'house' || propertyType === 'villa') {
      return [
        ...common,
        { name: 'Bedrooms', value: '' },
        { name: 'Bathrooms', value: '' },
        { name: 'Balconies', value: '' },
        { name: 'Kitchen', value: '' },
        { name: 'Parking', value: 'spaces' },
      ];
    } else if (propertyType === 'plot' || propertyType === 'land') {
      return [
        { name: 'Plot Area', value: 'sq ft' },
        { name: 'Width', value: 'ft' },
        { name: 'Length', value: 'ft' },
        { name: 'Boundary Wall', value: '' },
        { name: 'Corner Plot', value: 'Yes/No' },
      ];
    } else if (propertyType === 'commercial' || propertyType === 'office') {
      return [
        ...common,
        { name: 'Cabin Rooms', value: '' },
        { name: 'Meeting Rooms', value: '' },
        { name: 'Washrooms', value: '' },
        { name: 'Parking Spaces', value: '' },
        { name: 'Lift Access', value: 'Yes/No' },
      ];
    }

    return common;
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
        Property Specifications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add New Specification */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add New Specification
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Specification Name"
              value={newSpec.name}
              onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
              placeholder="e.g., Bedrooms"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Value"
              value={newSpec.value}
              onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
              placeholder="e.g., 3"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Add />}
              onClick={handleAddSpecification}
              disabled={!newSpec.name.trim() || !newSpec.value.trim() || saving}
              fullWidth
            >
              Add Specification
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Specifications List */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Current Specifications ({specifications.length})
        </Typography>
        
        {specifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No specifications added yet. Add specifications to provide detailed information about your property.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {specifications.map((spec) => (
              <Grid item xs={12} sm={6} md={4} key={spec.id}>
                <Card variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    {editingId === spec.id ? (
                      <Box>
                        <TextField
                          fullWidth
                          size="small"
                          label="Name"
                          value={editingSpec.name}
                          onChange={(e) => setEditingSpec({ ...editingSpec, name: e.target.value })}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Value"
                          value={editingSpec.value}
                          onChange={(e) => setEditingSpec({ ...editingSpec, value: e.target.value })}
                        />
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="subtitle2" color="primary">
                          {spec.name}
                        </Typography>
                        <Typography variant="body1">
                          {spec.value}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    {editingId === spec.id ? (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={handleSaveEdit}
                          disabled={!editingSpec.name.trim() || !editingSpec.value.trim() || saving}
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
                          onClick={() => handleEditSpecification(spec)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSpecification(spec.id)}
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

      {/* Common Specifications Suggestions */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Common Specifications for {propertyType} (Click to add):
        </Typography>
        <Grid container spacing={1}>
          {getCommonSpecifications().map((suggestion, index) => (
            <Grid item key={index}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (!specifications.some(s => s.name.toLowerCase() === suggestion.name.toLowerCase())) {
                    setNewSpec(suggestion);
                  }
                }}
                disabled={specifications.some(s => s.name.toLowerCase() === suggestion.name.toLowerCase())}
                sx={{ mb: 1 }}
              >
                {suggestion.name}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default SpecificationsEditor;
