import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home,
  LocationOn,
  AttachMoney,
  SquareFoot,
  Info,
  Image,
  Star,
  Settings,
  Map,
  Landscape,
  Phone,
  Email,
} from '@mui/icons-material';
import AmenitiesEditor from './AmenitiesEditor';
import SpecificationsEditor from './SpecificationsEditor';
import EnhancedPlansEditor from './EnhancedPlansEditor';
import EnhancedPlotsEditor from './EnhancedPlotsEditor';
import PropertyImagesEditor from './PropertyImagesEditor';

const PropertyForm = forwardRef(({
  open,
  onClose,
  property = null,
  onSave,
  onCancel,
  loading = false,
  standalone = true // New prop to control if it renders its own dialog
}, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Form state - moved before usage
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clone_url: '',
    property_type: 'apartment',
    status: 'available',
    is_featured: false,
    price: '',
    area: '',
    built_year: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    unit_number: '',
    outstanding_amount: '',
  });
  
  const [errors, setErrors] = useState({});
  const [propertyId, setPropertyId] = useState(null);
  
  // Dynamic tabs based on property type
  const getTabsForPropertyType = (propertyType) => {
    const baseTabs = [
      { label: 'Basic Info', icon: <Info /> },
      { label: 'Images', icon: <Image /> },
      { label: 'Amenities', icon: <Star /> },
      { label: 'Specifications', icon: <Settings /> },
    ];

    // Add Plans tab with property-type specific label
    if (propertyType === 'land') {
      baseTabs.push({ label: 'Plans & Layouts', icon: <Map /> });
      baseTabs.push({ label: 'Land Plots', icon: <Landscape /> });
    } else {
      baseTabs.push({ label: 'Floor Plans', icon: <Map /> });
      baseTabs.push({ label: 'Units/Plots', icon: <Landscape /> });
    }

    return baseTabs;
  };

  const tabs = getTabsForPropertyType(formData.property_type);

  // Initialize form with property data
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        clone_url: property.clone_url || '',
        property_type: property.property_type || 'apartment',
        status: property.status || 'available',
        is_featured: Boolean(property.is_featured),
        price: property.price || '',
        area: property.area || '',
        built_year: property.built_year || '',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        zip_code: property.zip_code || '',
        location: property.location || '',
        contact_email: property.contact_email || '',
        contact_phone: property.contact_phone || '',
        unit_number: property.unit_number || '',
        outstanding_amount: property.outstanding_amount || '',
      });
      setPropertyId(property.id);
    } else {
      // Reset form for new property
      setFormData({
        title: '',
        description: '',
        clone_url: '',
        property_type: 'apartment',
        status: 'available',
        is_featured: false,
        price: '',
        area: '',
        built_year: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        location: '',
        contact_email: '',
        contact_phone: '',
        unit_number: '',
        outstanding_amount: '',
      });
      setPropertyId(null);
    }
    setErrors({});
    setActiveTab(0);
  }, [property, open]);

  // Expose submit function to parent component
  useImperativeHandle(ref, () => ({
    submit: handleSubmit
  }));

  // Handle input changes
  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
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

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    if (formData.contact_phone && !/^\d{10}$/.test(formData.contact_phone.replace(/\D/g, ''))) {
      newErrors.contact_phone = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    // eslint-disable-next-line no-console
    console.log('🔍 PropertyForm handleSubmit called');
    // eslint-disable-next-line no-console
    console.log('🔍 Form data:', formData);

    if (!validateForm()) {
      // eslint-disable-next-line no-console
      console.log('🔍 Form validation failed');
      setActiveTab(0); // Switch to basic info tab to show errors
      return;
    }

    // eslint-disable-next-line no-console
    console.log('🔍 Form validation passed, calling onSave');
    // For now, pass empty arrays for images since image handling is done after property creation
    onSave(formData, [], []);
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      if (onCancel) {
        onCancel();
      } else if (onClose) {
        onClose();
      }
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Land' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'office', label: 'Office' },
  ];

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
    { value: 'pending', label: 'Pending' },
    { value: 'off_market', label: 'Off Market' },
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
    'Lakshadweep'
  ];

  const formContent = (
    <>
      {standalone && (
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Home sx={{ mr: 1 }} />
            {property ? 'Edit Property' : 'Add New Property'}
          </Box>
        </DialogTitle>
      )}

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Tabs Navigation */}
        <Paper square sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: isMobile ? 1 : 2,
              '& .MuiTab-root': {
                minHeight: isMobile ? 48 : 64,
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                minWidth: isMobile ? 80 : 120,
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={isMobile ? '' : tab.label}
                iconPosition="start"
                sx={{
                  minHeight: isMobile ? 48 : 64,
                  '& .MuiTab-iconWrapper': {
                    fontSize: isMobile ? 18 : 20,
                  }
                }}
                title={isMobile ? tab.label : undefined}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{
          p: isMobile ? 2 : 3,
          height: isMobile ? 'calc(100vh - 200px)' : 'calc(90vh - 200px)',
          overflow: 'auto'
        }}>
          {/* Basic Info Tab */}
          {activeTab === 0 && (
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                  Property Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Property Title *"
                  value={formData.title}
                  onChange={handleChange('title')}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="Enter property title"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Property Type</InputLabel>
                  <Select
                    value={formData.property_type}
                    onChange={handleChange('property_type')}
                    label="Property Type"
                  >
                    {propertyTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={isMobile ? 3 : 4}
                  value={formData.description}
                  onChange={handleChange('description')}
                  placeholder="Enter property description"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Clone URL"
                  value={formData.clone_url}
                  onChange={handleChange('clone_url')}
                  placeholder="https://example.com/clone"
                  helperText="URL to redirect users when they click the clone button"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Price *"
                  value={formData.price}
                  onChange={handleChange('price')}
                  error={!!errors.price}
                  helperText={errors.price}
                  placeholder="e.g., 5000000 or 50 Lakhs"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label={`Area (${formData.property_type === 'land' ? 'sq ft / acres' : 'sq ft'})`}
                  value={formData.area}
                  onChange={handleChange('area')}
                  placeholder={formData.property_type === 'land' ? 'e.g., 5000 sq ft or 2 acres' : 'e.g., 1200'}
                  helperText={formData.property_type === 'land' ? 'Enter land area in square feet or acres' : 'Enter built-up area in square feet'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SquareFoot />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Built Year"
                  value={formData.built_year}
                  onChange={handleChange('built_year')}
                  placeholder="e.g., 2020"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ mt: isMobile ? 1 : 2 }}>
                  Location Details
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={isMobile ? 2 : 2}
                  value={formData.address}
                  onChange={handleChange('address')}
                  placeholder="Enter full address"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="City *"
                  value={formData.city}
                  onChange={handleChange('city')}
                  error={!!errors.city}
                  helperText={errors.city}
                  placeholder="e.g., Mumbai"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>State</InputLabel>
                  <Select
                    value={formData.state}
                    onChange={handleChange('state')}
                    label="State"
                  >
                    {indianStates.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={formData.zip_code}
                  onChange={handleChange('zip_code')}
                  placeholder="e.g., 400001"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location/Area"
                  value={formData.location}
                  onChange={handleChange('location')}
                  placeholder="e.g., Andheri West, Bandra"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit Number"
                  value={formData.unit_number}
                  onChange={handleChange('unit_number')}
                  placeholder="e.g., A-1201, Shop-15"
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ mt: isMobile ? 1 : 2 }}>
                  Contact Information
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange('contact_email')}
                  error={!!errors.contact_email}
                  helperText={errors.contact_email}
                  placeholder="contact@example.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={formData.contact_phone}
                  onChange={handleChange('contact_phone')}
                  error={!!errors.contact_phone}
                  helperText={errors.contact_phone}
                  placeholder="9876543210"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ mt: isMobile ? 1 : 2 }}>
                  Property Status
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={handleChange('status')}
                    label="Status"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Outstanding Amount"
                  value={formData.outstanding_amount}
                  onChange={handleChange('outstanding_amount')}
                  placeholder="e.g., 500000"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_featured}
                      onChange={handleChange('is_featured')}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="Featured Property"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}

          {/* Images Tab */}
          {activeTab === 1 && (
            <Box>
              {propertyId ? (
                <PropertyImagesEditor 
                  propertyId={propertyId} 
                  propertyType={formData.property_type} 
                />
              ) : (
                <Alert severity="info">
                  Save the property first to upload and manage images.
                </Alert>
              )}
            </Box>
          )}

          {/* Amenities Tab */}
          {activeTab === 2 && (
            <Box>
              {propertyId ? (
                <AmenitiesEditor propertyId={propertyId} />
              ) : (
                <Alert severity="info">
                  Save the property first to manage amenities.
                </Alert>
              )}
            </Box>
          )}

          {/* Specifications Tab */}
          {activeTab === 3 && (
            <Box>
              {propertyId ? (
                <SpecificationsEditor 
                  propertyId={propertyId} 
                  propertyType={formData.property_type} 
                />
              ) : (
                <Alert severity="info">
                  Save the property first to manage specifications.
                </Alert>
              )}
            </Box>
          )}

          {/* Plans Tab */}
          {activeTab === 4 && (
            <Box>
              {propertyId ? (
                <EnhancedPlansEditor 
                  propertyId={propertyId} 
                  propertyType={formData.property_type} 
                />
              ) : (
                <Alert severity="info">
                  Save the property first to manage {formData.property_type === 'land' ? 'land plans and layouts' : 'floor plans'} with image uploads.
                </Alert>
              )}
            </Box>
          )}

          {/* Plots Tab */}
          {activeTab === 5 && (
            <Box>
              {propertyId ? (
                <EnhancedPlotsEditor 
                  propertyId={propertyId} 
                  propertyType={formData.property_type} 
                />
              ) : (
                <Alert severity="info">
                  Save the property first to manage {formData.property_type === 'land' ? 'land plots and block configuration' : 'property units and plots'}.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      {standalone && (
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            {loading ? 'Saving...' : (property ? 'Update Property' : 'Create Property')}
          </Button>
        </DialogActions>
      )}
    </>
  );

  if (standalone) {
    return (
      <Dialog
        open={open || false}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            minHeight: isMobile ? '100vh' : '90vh',
            maxHeight: isMobile ? '100vh' : '90vh',
            m: isMobile ? 0 : 2
          }
        }}
      >
        {formContent}
      </Dialog>
    );
  }

  return formContent;
});

PropertyForm.displayName = 'PropertyForm';

export default PropertyForm;