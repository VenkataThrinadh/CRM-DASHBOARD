import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Box,
  Chip,
  Button,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  History,
  Login,
  Visibility,
  Favorite,
  Assignment,
  Phone,
  Email,
  Edit,
  PersonAdd,
} from '@mui/icons-material';

const CustomerActivityCard = ({ customerId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerActivity();
  }, [customerId]);

  const fetchCustomerActivity = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch customer activity
      // const response = await customerAPI.getActivity(customerId);
      // setActivities(response.data.activities || []);
      
      // Mock data for now
      setTimeout(() => {
        setActivities([
          {
            id: 1,
            type: 'enquiry_created',
            title: 'Created enquiry for Luxury Villa',
            description: 'Interested in purchasing a 3BHK villa in Whitefield',
            timestamp: '2024-01-15T10:30:00Z',
            metadata: { property_id: 1, enquiry_id: 1 }
          },
          {
            id: 2,
            type: 'property_viewed',
            title: 'Viewed property details',
            description: 'Modern Apartment in Kondapur',
            timestamp: '2024-01-14T16:45:00Z',
            metadata: { property_id: 2 }
          },
          {
            id: 3,
            type: 'property_favorited',
            title: 'Added to favorites',
            description: 'Commercial Space in Gachibowli',
            timestamp: '2024-01-14T14:20:00Z',
            metadata: { property_id: 3 }
          },
          {
            id: 4,
            type: 'profile_updated',
            title: 'Updated profile information',
            description: 'Changed contact number and address',
            timestamp: '2024-01-12T09:15:00Z',
            metadata: {}
          },
          {
            id: 5,
            type: 'login',
            title: 'Logged into customer portal',
            description: 'Accessed account dashboard',
            timestamp: '2024-01-10T11:30:00Z',
            metadata: {}
          },
          {
            id: 6,
            type: 'account_created',
            title: 'Account created',
            description: 'Registered as a new customer',
            timestamp: '2024-01-05T14:00:00Z',
            metadata: {}
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError('Failed to load activity');
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'enquiry_created': return <Assignment />;
      case 'property_viewed': return <Visibility />;
      case 'property_favorited': return <Favorite />;
      case 'profile_updated': return <Edit />;
      case 'login': return <Login />;
      case 'account_created': return <PersonAdd />;
      case 'phone_call': return <Phone />;
      case 'email_sent': return <Email />;
      default: return <History />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'enquiry_created': return 'primary';
      case 'property_viewed': return 'info';
      case 'property_favorited': return 'error';
      case 'profile_updated': return 'warning';
      case 'login': return 'success';
      case 'account_created': return 'secondary';
      case 'phone_call': return 'info';
      case 'email_sent': return 'primary';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader
          title="Recent Activity"
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          {[1, 2, 3, 4].map((item) => (
            <Box key={item} sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
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
          title="Recent Activity"
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
        title="Recent Activity"
        titleTypographyProps={{ variant: 'h6' }}
        subheader={`${activities.length} activities recorded`}
      />
      <CardContent>
        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No activity found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer activity will appear here once they start using the platform.
            </Typography>
          </Box>
        ) : (
          <Timeline sx={{ p: 0 }}>
            {activities.map((activity, index) => (
              <TimelineItem key={activity.id}>
                <TimelineSeparator>
                  <TimelineDot color={getActivityColor(activity.type)}>
                    {getActivityIcon(activity.type)}
                  </TimelineDot>
                  {index < activities.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="subtitle2" component="h6">
                      {activity.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(activity.timestamp)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {activity.description}
                  </Typography>
                  
                  {/* Activity-specific metadata */}
                  {activity.type === 'enquiry_created' && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label="View Enquiry"
                        variant="outlined"
                        clickable
                        onClick={() => {/* Navigate to enquiry */}}
                      />
                    </Box>
                  )}
                  
                  {(activity.type === 'property_viewed' || activity.type === 'property_favorited') && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label="View Property"
                        variant="outlined"
                        clickable
                        onClick={() => {/* Navigate to property */}}
                      />
                    </Box>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
        
        {activities.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="text"
              size="small"
              onClick={() => {/* Navigate to full activity log */}}
            >
              View Full Activity Log
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerActivityCard;