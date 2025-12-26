import React, { useState, useEffect } from 'react';
import { formatDateDDMMYYYY } from '../../../loans/utils/dateFormatter';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Button,
  Avatar,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Home,
  Favorite,
  FavoriteBorder,
  Visibility,
  LocationOn,
  Business,
  Apartment,
} from '@mui/icons-material';

const CustomerPropertiesCard = ({ customerId, onViewProperty, onToggleFavorite }) => {
  const [favoriteProperties, setFavoriteProperties] = useState([]);
  const [viewedProperties, setViewedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerProperties();
  }, [customerId]);

  const fetchCustomerProperties = async () => {
    try {
      setLoading(true);
      // TODO: Implement API calls to fetch customer's favorite and viewed properties
      // const [favoritesResponse, viewedResponse] = await Promise.all([
      //   propertiesAPI.getFavoritesByCustomerId(customerId),
      //   propertiesAPI.getViewedByCustomerId(customerId)
      // ]);
      
      // Mock data for now
      setTimeout(() => {
        setFavoriteProperties([
          {
            id: 1,
            title: 'Luxury Villa in Whitefield',
            price: '2.5 Crores',
            location: 'Whitefield, Bangalore',
            property_type: 'villa',
            image_url: null,
            is_featured: true,
            status: 'available'
          },
          {
            id: 2,
            title: 'Modern Apartment',
            price: '85 Lakhs',
            location: 'Kondapur, Hyderabad',
            property_type: 'apartment',
            image_url: null,
            is_featured: false,
            status: 'available'
          }
        ]);
        
        setViewedProperties([
          {
            id: 3,
            title: 'Commercial Space',
            price: '1.2 Crores',
            location: 'Gachibowli, Hyderabad',
            property_type: 'commercial',
            viewed_at: '2024-01-15T10:30:00Z'
          },
          {
            id: 4,
            title: 'Plot in IT Corridor',
            price: '45 Lakhs',
            location: 'Electronic City, Bangalore',
            property_type: 'land',
            viewed_at: '2024-01-12T14:20:00Z'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError('Failed to load properties');
      setLoading(false);
    }
  };

  const getPropertyTypeIcon = (type) => {
    switch (type) {
      case 'apartment': return <Apartment />;
      case 'villa': return <Home />;
      case 'commercial': return <Business />;
      case 'land': return <LocationOn />;
      default: return <Home />;
    }
  };

  const getPropertyTypeColor = (type) => {
    switch (type) {
      case 'apartment': return 'primary';
      case 'villa': return 'secondary';
      case 'commercial': return 'info';
      case 'land': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    // Return short format (MMM DD)
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader
          title="Properties"
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Grid container spacing={2}>
            {[1, 2].map((item) => (
              <Grid item xs={12} key={item}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rectangular" width={80} height={60} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader
          title="Properties"
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Properties"
        titleTypographyProps={{ variant: 'h6' }}
        subheader={`${favoriteProperties.length} favorites • ${viewedProperties.length} viewed`}
      />
      <CardContent>
        {/* Favorite Properties */}
        {favoriteProperties.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Favorite color="error" fontSize="small" />
              Favorite Properties
            </Typography>
            <Grid container spacing={2}>
              {favoriteProperties.map((property) => (
                <Grid item xs={12} key={property.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => onViewProperty(property.id)}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}
                    >
                      {getPropertyTypeIcon(property.property_type)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" noWrap>
                          {property.title}
                        </Typography>
                        {property.is_featured && (
                          <Chip size="small" label="Featured" color="warning" variant="outlined" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                        {property.location}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Typography variant="subtitle2" color="primary">
                          ₹{property.price}
                        </Typography>
                        <Chip
                          size="small"
                          label={property.property_type}
                          color={getPropertyTypeColor(property.property_type)}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Tooltip title="Remove from favorites">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(property.id, false);
                          }}
                        >
                          <Favorite color="error" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Recently Viewed Properties */}
        {viewedProperties.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility color="action" fontSize="small" />
              Recently Viewed
            </Typography>
            <Grid container spacing={2}>
              {viewedProperties.map((property) => (
                <Grid item xs={12} key={property.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => onViewProperty(property.id)}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{ width: 60, height: 60, bgcolor: 'grey.300' }}
                    >
                      {getPropertyTypeIcon(property.property_type)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap gutterBottom>
                        {property.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                        {property.location}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Typography variant="subtitle2" color="primary">
                          ₹{property.price}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Viewed {formatDate(property.viewed_at)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Tooltip title="Add to favorites">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(property.id, true);
                          }}
                        >
                          <FavoriteBorder />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Empty State */}
        {favoriteProperties.length === 0 && viewedProperties.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Home sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No properties found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This customer hasn't viewed or favorited any properties yet.
            </Typography>
          </Box>
        )}

        {/* View All Button */}
        {(favoriteProperties.length > 0 || viewedProperties.length > 0) && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="text"
              size="small"
              onClick={() => {/* Navigate to customer's property activity */}}
            >
              View All Property Activity
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerPropertiesCard;