import React from 'react';
import { formatDateDDMMYYYY } from '../../../loans/utils/dateFormatter';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Button,
  Tooltip,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Star,
  StarBorder,
  LocationOn,
  Home,
  AttachMoney,
  SquareFoot,
  Phone,
  Email,
  CalendarToday,
} from '@mui/icons-material';
import { getPropertyImageUrl } from '../../../main-dashboard/utils/imageUtils';

const PropertyGridView = ({ 
  properties, 
  onView, 
  onEdit, 
  onDelete, 
  onToggleFeatured,
  loading = false 
}) => {
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    
    // If price is already formatted (contains letters), return as is
    if (/[a-zA-Z]/.test(price)) {
      return price;
    }
    
    // If price is numeric, format it
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'success';
      case 'pending':
        return 'warning';
      case 'sold':
        return 'error';
      case 'inactive':
        return 'default';
      case 'rented':
        return 'info';
      default:
        return 'default';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ height: 200, bgcolor: 'grey.200', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ height: 20, bgcolor: 'grey.200', mb: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <Box sx={{ height: 16, bgcolor: 'grey.200', mb: 1, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <Box sx={{ height: 16, bgcolor: 'grey.200', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (properties.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Home sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No properties found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search criteria or add a new property
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {properties.map((property) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={property.id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              }
            }}
          >
            {/* Featured Badge */}
            {property.is_featured && (
              <Badge
                badgeContent={<Star sx={{ fontSize: 16 }} />}
                color="warning"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 1,
                }}
              />
            )}

            {/* Property Image */}
            <CardMedia
              sx={{ 
                height: 200, 
                position: 'relative',
                cursor: 'pointer',
                '&:hover': {
                  '& .overlay': {
                    opacity: 1,
                  }
                }
              }}
              onClick={() => onView(property)}
            >
              {property.image_url ? (
                <img
                  src={getPropertyImageUrl(property.image_url, property.id)}
                  alt={property.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200',
                  }}
                >
                  <Home sx={{ fontSize: 48, color: 'grey.500' }} />
                </Box>
              )}
              
              {/* Hover Overlay */}
              <Box
                className="overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<Visibility />}
                  onClick={() => onView(property)}
                  sx={{ mr: 1 }}
                >
                  View
                </Button>
                <IconButton
                  color="primary"
                  sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(property);
                  }}
                >
                  <Edit />
                </IconButton>
              </Box>

              {/* Status Chip */}
              <Chip
                label={property.status || 'available'}
                color={getStatusColor(property.status)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                }}
              />
            </CardMedia>

            {/* Property Details */}
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              {/* Title and Type */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="h6" component="h3" fontWeight="bold" noWrap>
                  {property.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {property.property_type} • ID: {property.id}
                </Typography>
              </Box>

              {/* Location */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {property.city}, {property.state}
                </Typography>
              </Box>

              {/* Price and Area */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {formatPrice(property.price)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SquareFoot sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatArea(property.area)}
                  </Typography>
                </Box>
              </Box>

              {/* Description */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {truncateText(property.description, 80)}
              </Typography>

              {/* Additional Details */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {property.built_year && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarToday sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {property.built_year}
                    </Typography>
                  </Box>
                )}
                
                {property.unit_number && (
                  <Typography variant="caption" color="text.secondary">
                    Unit: {property.unit_number}
                  </Typography>
                )}
              </Box>
            </CardContent>

            {/* Contact Info */}
            {(property.contact_phone || property.contact_email) && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {property.contact_phone && (
                    <Tooltip title={property.contact_phone}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <Phone sx={{ fontSize: 14 }} />
                      </Avatar>
                    </Tooltip>
                  )}
                  {property.contact_email && (
                    <Tooltip title={property.contact_email}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                        <Email sx={{ fontSize: 14 }} />
                      </Avatar>
                    </Tooltip>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {formatDateDDMMYYYY(property.created_at)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Action Buttons */}
            <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
              <Box>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => onView(property)}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Property">
                  <IconButton size="small" onClick={() => onEdit(property)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title={property.is_featured ? 'Remove from Featured' : 'Mark as Featured'}>
                  <IconButton 
                    size="small" 
                    onClick={() => onToggleFeatured(property)}
                    color={property.is_featured ? 'warning' : 'default'}
                  >
                    {property.is_featured ? <Star /> : <StarBorder />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Tooltip title="Delete Property">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onDelete(property)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default PropertyGridView;
