import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  SquareFoot as SquareFootIcon,
  Folder as FolderIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { getPropertyImageUrl } from '../../utils/imageUtils';

const PropertyCard = ({ property, onViewDocuments }) => {
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    
    if (/[a-zA-Z]/.test(price)) {
      return price;
    }
    
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
      case 'available': return 'success';
      case 'pending': return 'warning';
      case 'sold': return 'error';
      case 'inactive': return 'default';
      case 'rented': return 'info';
      default: return 'default';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardMedia
        sx={{ 
          height: 200, 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100'
        }}
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
            onError={(e) => {
              // Replace with placeholder on error
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBIMTMwVjEzMEgxMDBWNzBaIiBmaWxsPSIjQzRDNEM0Ii8+CjxwYXRoIGQ9Ik03MCA3MEgxMDBWMTMwSDcwVjcwWiIgZmlsbD0iI0U1RTVFNSIvPgo8L3N2Zz4K';
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}
          >
            <HomeIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2">No Image</Typography>
          </Box>
        )}
      </CardMedia>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {truncateText(property.title, 50)}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {truncateText(property.location, 30)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoneyIcon sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
            <Typography variant="body2" color="success.main" fontWeight="bold">
              {formatPrice(property.price)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SquareFootIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatArea(property.area)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={property.status}
            size="small"
            color={getStatusColor(property.status)}
          />
          <Chip
            label={property.type}
            size="small"
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {truncateText(property.description, 80)}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<FolderIcon />}
          onClick={() => onViewDocuments(property)}
        >
          View Documents
        </Button>
      </CardActions>
    </Card>
  );
};

export default PropertyCard;