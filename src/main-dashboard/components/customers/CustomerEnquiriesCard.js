import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  Box,
  Divider,
  IconButton,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Assignment,
  Visibility,
  Add,
  DateRange,
} from '@mui/icons-material';

const CustomerEnquiriesCard = ({ customerId, onViewEnquiry, onCreateEnquiry }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerEnquiries();
  }, [customerId]);

  const fetchCustomerEnquiries = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch customer enquiries
      // const response = await enquiriesAPI.getByCustomerId(customerId);
      // setEnquiries(response.data.enquiries || []);
      
      // Mock data for now
      setTimeout(() => {
        setEnquiries([
          {
            id: 1,
            property_title: 'Luxury Villa in Bangalore',
            status: 'pending',
            created_at: '2024-01-15T10:30:00Z',
            enquiry_type: 'purchase',
            priority: 'high'
          },
          {
            id: 2,
            property_title: 'Commercial Space in Hyderabad',
            status: 'responded',
            created_at: '2024-01-10T14:20:00Z',
            enquiry_type: 'rental',
            priority: 'medium'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError('Failed to load enquiries');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'responded': return 'info';
      case 'closed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader
          title="Customer Enquiries"
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader
          title="Customer Enquiries"
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
        title="Customer Enquiries"
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <Button
            size="small"
            startIcon={<Add />}
            onClick={onCreateEnquiry}
            variant="outlined"
          >
            New Enquiry
          </Button>
        }
      />
      <CardContent>
        {enquiries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No enquiries found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This customer hasn't made any enquiries yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onCreateEnquiry}
              sx={{ mt: 2 }}
            >
              Create First Enquiry
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total: {enquiries.length} enquiries
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  size="small"
                  label={`${enquiries.filter(e => e.status === 'pending').length} Pending`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`${enquiries.filter(e => e.status === 'responded').length} Responded`}
                  color="info"
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <List dense>
              {enquiries.map((enquiry, index) => (
                <React.Fragment key={enquiry.id}>
                  <ListItem
                    sx={{
                      px: 0,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderRadius: 1,
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" noWrap>
                            {enquiry.property_title}
                          </Typography>
                          <Chip
                            size="small"
                            label={enquiry.status}
                            color={getStatusColor(enquiry.status)}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={enquiry.priority}
                            color={getPriorityColor(enquiry.priority)}
                            variant="filled"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DateRange sx={{ fontSize: 14 }} />
                            <Typography variant="caption">
                              {formatDate(enquiry.created_at)}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="primary">
                            {enquiry.enquiry_type}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => onViewEnquiry(enquiry.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < enquiries.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {/* Navigate to full enquiries list */}}
              >
                View All Enquiries
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerEnquiriesCard;