import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Autocomplete,
  Card,
  CardContent,
} from '@mui/material';
import {
  ContactMail,
  Person,
  Email,
  Phone,
  Subject,
  Message,
  Home,
  AttachMoney,
  LocationOn,
  Business,
  SquareFoot,
  MonetizationOn,
} from '@mui/icons-material';
import { propertiesAPI, plotsAPI } from '../../../main-dashboard/services/api';

const EnquiryForm = ({
  open,
  onClose,
  enquiry = null,
  onSave,
  loading = false
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    property_id: '',
    plot_id: '',
    status: 'new',
    priority: 'medium',
    source: 'website',
    budget_min: '',
    budget_max: '',
    preferred_location: '',
    property_type: '',
    requirements: '',
    follow_up_date: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Property and plot selection state
  const [properties, setProperties] = useState([]);
  const [plots, setPlots] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [plotsLoading, setPlotsLoading] = useState(false);

  // Initialize form with enquiry data
  useEffect(() => {
    if (enquiry) {
      setFormData({
        name: enquiry.name || '',
        email: enquiry.email || '',
        phone: enquiry.phone || '',
        subject: enquiry.subject || '',
        message: enquiry.message || '',
        property_id: enquiry.property_id || '',
        plot_id: enquiry.plot_id || '',
        status: enquiry.status || 'new',
        priority: enquiry.priority || 'medium',
        source: enquiry.source || 'website',
        budget_min: enquiry.budget_min || '',
        budget_max: enquiry.budget_max || '',
        preferred_location: enquiry.preferred_location || '',
        property_type: enquiry.property_type || '',
        requirements: enquiry.requirements || '',
        follow_up_date: enquiry.follow_up_date ? enquiry.follow_up_date.split('T')[0] : '',
        notes: enquiry.notes || '',
      });
    } else {
      // Reset form for new enquiry
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        property_id: '',
        plot_id: '',
        status: 'new',
        priority: 'medium',
        source: 'website',
        budget_min: '',
        budget_max: '',
        preferred_location: '',
        property_type: '',
        requirements: '',
        follow_up_date: '',
        notes: '',
      });
    }
    setErrors({});
    setSelectedProperty(null);
    setSelectedPlot(null);
    setPlots([]);
  }, [enquiry, open]);

  // Load properties on component mount
  useEffect(() => {
    if (open) {
      loadProperties();
    }
  }, [open]);

  // Load plots when property is selected
  useEffect(() => {
    if (formData.property_id) {
      loadPlots(formData.property_id);
    } else {
      setPlots([]);
      setSelectedPlot(null);
    }
  }, [formData.property_id]);

  // Load properties function
  const loadProperties = async () => {
    try {
      setPropertiesLoading(true);
      const response = await propertiesAPI.getAll();
      // eslint-disable-next-line no-console
      console.log('Properties loaded:', response.data?.length || 0, 'properties');
      setProperties(response.data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load properties:', error);
      setProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  };

  // Load plots function
  const loadPlots = async (propertyId) => {
    try {
      setPlotsLoading(true);
      const response = await plotsAPI.getByProperty(propertyId);
      // eslint-disable-next-line no-console
      console.log('Plots loaded for property', propertyId, ':', response.data?.length || 0, 'plots');
      setPlots(response.data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load plots:', error);
      setPlots([]);
    } finally {
      setPlotsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle property selection
  const handlePropertyChange = (event, newValue) => {
    const propertyId = newValue ? newValue.id : '';
    // eslint-disable-next-line no-console
    console.log('Property selected:', newValue, 'ID:', propertyId);
    setFormData(prev => ({
      ...prev,
      property_id: propertyId,
      plot_id: '' // Reset plot when property changes
    }));
    setSelectedProperty(newValue);
    setSelectedPlot(null);
  };

  // Handle plot selection
  const handlePlotChange = (event, newValue) => {
    const plotId = newValue ? newValue.id : '';
    // eslint-disable-next-line no-console
    console.log('Plot selected:', newValue, 'ID:', plotId);
    setFormData(prev => ({
      ...prev,
      plot_id: plotId
    }));
    setSelectedPlot(newValue);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    // Validate budget range if both are provided
    if (formData.budget_min && formData.budget_max) {
      const min = parseFloat(formData.budget_min);
      const max = parseFloat(formData.budget_max);
      if (min >= max) {
        newErrors.budget_min = 'Minimum budget must be less than maximum budget';
      }
    }

    // Validate follow-up date is not in the past
    if (formData.follow_up_date) {
      const followUpDate = new Date(formData.follow_up_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (followUpDate < today) {
        newErrors.follow_up_date = 'Follow-up date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission - ensure property_id is a number
    const submissionData = {
      ...formData,
      propertyId: formData.property_id ? parseInt(formData.property_id, 10) : null,
      plotId: formData.plot_id ? parseInt(formData.plot_id, 10) : null,
      // Add submission ID for duplicate prevention
      submissionId: `enquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // eslint-disable-next-line no-console
    console.log('Submitting enquiry data:', submissionData);
    // eslint-disable-next-line no-console
    console.log('Form data keys:', Object.keys(formData));
    // eslint-disable-next-line no-console
    console.log('Property ID:', formData.property_id, typeof formData.property_id);
    // eslint-disable-next-line no-console
    console.log('Plot ID:', formData.plot_id, typeof formData.plot_id);

    // Force property_id to be a valid number or null
    const finalData = {
      ...submissionData,
      propertyId: submissionData.propertyId && !isNaN(parseInt(submissionData.propertyId, 10))
        ? parseInt(submissionData.propertyId, 10)
        : null,
      plotId: submissionData.plotId && !isNaN(parseInt(submissionData.plotId, 10))
        ? parseInt(submissionData.plotId, 10)
        : null,
    };

    // eslint-disable-next-line no-console
    console.log('Final data propertyId:', finalData.propertyId, typeof finalData.propertyId);

    // eslint-disable-next-line no-console
    console.log('Final processed data:', finalData);
    onSave(finalData);
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'responded', label: 'Responded' },
    { value: 'closed', label: 'Closed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const sourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'walk_in', label: 'Walk-in' },
    { value: 'referral', label: 'Referral' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'advertisement', label: 'Advertisement' },
  ];

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'office', label: 'Office' },
  ];

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
    'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
    'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
    'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad',
    'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
    'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad'
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ContactMail sx={{ mr: 1 }} />
          {enquiry ? 'Edit Enquiry' : 'Add New Enquiry'}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 1 }} />
              Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name *"
              value={formData.name}
              onChange={handleChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone *"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              fullWidth
              options={properties}
              loading={propertiesLoading}
              getOptionLabel={(option) => `${option.title} (${option.id})`}
              value={selectedProperty}
              onChange={handlePropertyChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Property"
                  placeholder="Search and select a property..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <Home sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {option.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {option.id} • {option.city}, {option.state}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
          </Grid>

          {/* Plot Selection */}
          {formData.property_id && (
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={plots}
                loading={plotsLoading}
                getOptionLabel={(option) => `${option.plot_number} - ${option.area} sq ft`}
                value={selectedPlot}
                onChange={handlePlotChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Plot (Optional)"
                    placeholder="Search and select a plot..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Plot {option.plot_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Area: {option.area || 'N/A'} sq ft • Price: {option.price || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
          )}

          {/* Property Details Preview */}
          {selectedProperty && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Selected Property Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Home sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{selectedProperty.title}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{selectedProperty.city}, {selectedProperty.state}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SquareFoot sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{selectedProperty.area} sq ft</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MonetizationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{selectedProperty.price}</Typography>
                    </Box>
                  </Box>
                  {selectedProperty.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {selectedProperty.description.length > 100
                        ? `${selectedProperty.description.substring(0, 100)}...`
                        : selectedProperty.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Enquiry Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Message sx={{ mr: 1 }} />
              Enquiry Details
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Subject *"
              value={formData.subject}
              onChange={handleChange('subject')}
              error={!!errors.subject}
              helperText={errors.subject}
              InputProps={{
                startAdornment: <Subject sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message *"
              multiline
              rows={4}
              value={formData.message}
              onChange={handleChange('message')}
              error={!!errors.message}
              helperText={errors.message}
              placeholder="Describe your enquiry in detail..."
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
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

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                onChange={handleChange('priority')}
                label="Priority"
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={formData.source}
                onChange={handleChange('source')}
                label="Source"
              >
                {sourceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Property Requirements */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Home sx={{ mr: 1 }} />
              Property Requirements
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Property Type</InputLabel>
              <Select
                value={formData.property_type}
                onChange={handleChange('property_type')}
                label="Property Type"
              >
                {propertyTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={indianCities}
              value={formData.preferred_location}
              onChange={(event, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  preferred_location: newValue || ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Preferred Location"
                  placeholder="Enter city or area"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Budget Min"
              type="number"
              value={formData.budget_min}
              onChange={handleChange('budget_min')}
              placeholder="e.g., 5000000"
              error={!!errors.budget_min}
              helperText={errors.budget_min}
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Budget Max"
              type="number"
              value={formData.budget_max}
              onChange={handleChange('budget_max')}
              placeholder="e.g., 10000000"
              error={!!errors.budget_max}
              helperText={errors.budget_max}
              InputProps={{
                startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Requirements"
              multiline
              rows={3}
              value={formData.requirements}
              onChange={handleChange('requirements')}
              placeholder="Specific requirements like number of bedrooms, amenities, etc."
            />
          </Grid>

          {/* Follow-up and Notes */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Follow-up Date"
              type="date"
              value={formData.follow_up_date}
              onChange={handleChange('follow_up_date')}
              error={!!errors.follow_up_date}
              helperText={errors.follow_up_date}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Internal Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleChange('notes')}
              placeholder="Internal notes for team members..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : (enquiry ? 'Update Enquiry' : 'Create Enquiry')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnquiryForm;
