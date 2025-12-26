import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Cancel,
} from '@mui/icons-material';
import { amenitiesAPI } from '../../../main-dashboard/services/api';

const AmenitiesEditor = ({ propertyId }) => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState(null);

  const fetchAmenities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await amenitiesAPI.getByProperty(propertyId);
      setAmenities(response.data || []);
    } catch (error) {
      console.error('Failed to fetch amenities:', error); // eslint-disable-line no-console
      setError('Failed to load amenities');
      setAmenities([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  // eslint-disable-next-line no-use-before-define
  useEffect(() => {
    if (propertyId) {
      fetchAmenities();
    }
  }, [propertyId, fetchAmenities]);

  const handleAddAmenity = async () => {
    if (!newAmenity.trim()) return;

    try {
      setSaving(true);
      const response = await amenitiesAPI.create({
        propertyId: propertyId,
        name: newAmenity.trim()
      });
      
      setAmenities([...amenities, response.data]);
      setNewAmenity('');
      setError(null);
    } catch (error) {
      console.error('Failed to add amenity:', error); // eslint-disable-line no-console
      setError('Failed to add amenity');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAmenity = (amenity) => {
    setEditingId(amenity.id);
    setEditingValue(amenity.name);
  };

  const handleSaveEdit = async () => {
    if (!editingValue.trim()) return;

    try {
      setSaving(true);
      await amenitiesAPI.update(editingId, {
        name: editingValue.trim()
      });

      setAmenities(amenities.map(a =>
        a.id === editingId ? { ...a, name: editingValue.trim() } : a
      ));
      setEditingId(null);
      setEditingValue('');
      setError(null);
    } catch (error) {
      console.error('Failed to update amenity:', error); // eslint-disable-line no-console
      setError('Failed to update amenity');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleDeleteAmenity = async (amenityId) => {
    if (!window.confirm('Are you sure you want to delete this amenity?')) {
      return;
    }

    try {
      setSaving(true);
      await amenitiesAPI.delete(amenityId);
      setAmenities(amenities.filter(a => a.id !== amenityId));
      setError(null);
    } catch (error) {
      console.error('Failed to delete amenity:', error); // eslint-disable-line no-console
      setError('Failed to delete amenity');
    } finally {
      setSaving(false);
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Property Amenities
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add New Amenity */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Add New Amenity"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              placeholder="e.g., Swimming Pool, Gym, Parking"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddAmenity();
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Add />}
              onClick={handleAddAmenity}
              disabled={!newAmenity.trim() || saving}
              fullWidth
            >
              Add Amenity
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Amenities List */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Current Amenities ({amenities.length})
        </Typography>
        
        {amenities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No amenities added yet. Add some amenities to make your property more attractive.
          </Typography>
        ) : (
          <Grid container spacing={1}>
            {amenities.map((amenity) => (
              <Grid item key={amenity.id}>
                {editingId === amenity.id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <IconButton
                      size="small"
                      onClick={handleSaveEdit}
                      disabled={!editingValue.trim() || saving}
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
                  <Chip
                    label={amenity.name}
                    variant="outlined"
                    sx={{ mb: 1 }}
                    onDelete={() => handleDeleteAmenity(amenity.id)}
                    deleteIcon={<Delete />}
                    onClick={() => handleEditAmenity(amenity)}
                    clickable
                  />
                )}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Common Amenities Suggestions */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Common Amenities (Click to add):
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {[
            'Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden', 'Playground',
            'Elevator', 'Power Backup', 'Water Supply', 'Internet', 'Air Conditioning',
            'Balcony', 'Terrace', 'Club House', 'Jogging Track', 'CCTV'
          ].map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              size="small"
              variant="outlined"
              onClick={() => {
                if (!amenities.some(a => a.name.toLowerCase() === suggestion.toLowerCase())) {
                  setNewAmenity(suggestion);
                }
              }}
              sx={{ 
                cursor: 'pointer',
                opacity: amenities.some(a => a.name.toLowerCase() === suggestion.toLowerCase()) ? 0.5 : 1
              }}
              disabled={amenities.some(a => a.name.toLowerCase() === suggestion.toLowerCase())}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default AmenitiesEditor;
