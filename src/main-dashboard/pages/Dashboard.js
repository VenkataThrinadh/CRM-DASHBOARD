import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Home,
  People,
  ContactMail,
  Visibility,
  Add,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminAPI, propertiesAPI, usersAPI, enquiriesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, change, icon, color = 'primary' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isPositive = change >= 0;

  return (
    <Card sx={{
      height: '100%',
      minHeight: isMobile ? 120 : 140,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
      },
    }}>
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left',
          gap: isMobile ? 1 : 0,
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="overline"
              sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
            >
              {title}
            </Typography>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              component="div"
              fontWeight="bold"
              sx={{ mb: 1 }}
            >
              {value}
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              mt: 1
            }}>
              {isPositive ? (
                <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: isMobile ? 16 : 20 }} />
              ) : (
                <TrendingDown sx={{ color: 'error.main', mr: 0.5, fontSize: isMobile ? 16 : 20 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: isPositive ? 'success.main' : 'error.main',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                }}
              >
                {Math.abs(change)}% from last month
              </Typography>
            </Box>
          </Box>
          <Avatar
            sx={{
              backgroundColor: `${color}.main`,
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56,
              mt: isMobile ? 1 : 0,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isPortrait = useMediaQuery('(orientation: portrait)');

  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalEnquiries: 0,
    activeProperties: 0,
  });
  const [changes, setChanges] = useState({
    properties: 0,
    users: 0,
    enquiries: 0,
    activeProperties: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [propertyTypeData, setPropertyTypeData] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        dashboardRes,
        statsWithChangesRes,
        monthlyTrendsRes,
        propertyTypesRes,
        propertiesRes,
        usersRes,
        enquiriesRes
      ] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getStatsWithChanges(),
        adminAPI.getMonthlyTrends(),
        adminAPI.getPropertyTypes(),
        propertiesAPI.getAll({ limit: 5 }),
        usersAPI.getAll({ limit: 5, sort: 'created_at', order: 'desc' }),
        enquiriesAPI.getAll({ limit: 5, sort: 'created_at', order: 'desc' })
      ]);
      


      // Set main stats from dashboard endpoint
      setStats({
        totalProperties: dashboardRes.data.totalProperties || 0,
        totalUsers: dashboardRes.data.totalUsers || 0,
        totalEnquiries: dashboardRes.data.totalEnquiries || 0,
        activeProperties: dashboardRes.data.activeProperties || 0,
      });

      // Set percentage changes with normalization
      const rawChanges = statsWithChangesRes.data.changes || {
        properties: 0,
        users: 0,
        enquiries: 0,
        activeProperties: 0,
      };

      setChanges({
        properties: normalizePercentageChange(rawChanges.properties),
        users: normalizePercentageChange(rawChanges.users, 'users'),
        enquiries: normalizePercentageChange(rawChanges.enquiries, 'enquiries'),
        activeProperties: normalizePercentageChange(rawChanges.activeProperties, 'activeProperties'),
      });

      // Set chart data
      setMonthlyData(monthlyTrendsRes.data || []);
      setPropertyTypeData(propertyTypesRes.data || []);

      // Set recent data
      // Properties API returns data directly as array, not wrapped in 'properties' field
      const recentPropsData = Array.isArray(propertiesRes.data) ? propertiesRes.data : propertiesRes.data.properties || [];
      
      setRecentProperties(recentPropsData);
      setRecentUsers(usersRes.data.users || []);
      setRecentEnquiries(enquiriesRes.data.enquiries || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error); // eslint-disable-line no-console

      // Set fallback data on error
      setMonthlyData([]);
      setPropertyTypeData([{ name: 'No Data', value: 100, color: '#1976d2' }]);
      setRecentProperties([]);
      setRecentUsers([]);
      setRecentEnquiries([]);
      
      // Try to fetch recent properties separately if main fetch failed
      try {
        const propertiesRes = await propertiesAPI.getAll({ limit: 5 });
        setRecentProperties(Array.isArray(propertiesRes.data) ? propertiesRes.data : []);
      } catch (propertiesError) {
        console.error('Failed to fetch recent properties separately:', propertiesError); // eslint-disable-line no-console
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return 'success';
      case 'pending':
        return 'warning';
      case 'sold':
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  // Normalize percentage changes to prevent unrealistic values
  const normalizePercentageChange = (change, type = 'default') => {
    if (typeof change !== 'number' || isNaN(change)) return 0;

    // Special handling for users - cap at 100%
    if (type === 'users') {
      const maxChange = 100;
      const minChange = -100;

      if (change > maxChange) return maxChange;
      if (change < minChange) return minChange;

      return Math.round(change * 100) / 100; // Round to 2 decimal places
    }

    // Special handling for enquiries - cap at 100%
    if (type === 'enquiries') {
      const maxChange = 100;
      const minChange = -100;

      if (change > maxChange) return maxChange;
      if (change < minChange) return minChange;

      return Math.round(change * 100) / 100; // Round to 2 decimal places
    }

    // Special handling for active properties - cap at 100%
    if (type === 'activeProperties') {
      const maxChange = 100;
      const minChange = -100;

      if (change > maxChange) return maxChange;
      if (change < minChange) return minChange;

      return Math.round(change * 100) / 100; // Round to 2 decimal places
    }

    // For other stats, cap at reasonable bounds (±500% max)
    const maxChange = 500;
    const minChange = -500;

    if (change > maxChange) return maxChange;
    if (change < minChange) return minChange;

    return Math.round(change * 100) / 100; // Round to 2 decimal places
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Page Header */}
      <Box sx={{
        mb: isMobile ? 3 : 4,
        textAlign: isSmallScreen ? 'center' : 'left'
      }}>
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h1"
          gutterBottom
          fontWeight="bold"
          sx={{ fontSize: isSmallScreen ? '1.5rem' : isMobile ? '1.75rem' : '2.125rem' }}
        >
          Dashboard Overview
        </Typography>
        <Typography
          variant={isMobile ? "body2" : "body1"}
          color="text.secondary"
          sx={{ maxWidth: isSmallScreen ? '100%' : '600px' }}
        >
          Welcome back! Here's what's happening with your real estate business.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 3 : 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Properties"
            value={stats.totalProperties}
            change={changes.properties}
            icon={<Home />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            change={changes.users}
            icon={<People />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Enquiries"
            value={stats.totalEnquiries}
            change={changes.enquiries}
            icon={<ContactMail />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Properties"
            value={stats.activeProperties}
            change={changes.activeProperties}
            icon={<Visibility />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 3 : 4 }}>
        {/* Monthly Trends */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{
            p: isMobile ? 2 : 3,
            height: isMobile ? 300 : isTablet ? 350 : 400,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              gutterBottom
              fontWeight="bold"
              sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
            >
              Monthly Trends
            </Typography>
            {loading ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
              }}>
                <Typography variant="body2" color="text.secondary">Loading trends...</Typography>
              </Box>
            ) : monthlyData.length === 0 ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
              }}>
                <Typography variant="body2" color="text.secondary">No trend data available</Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, minHeight: isMobile ? 200 : 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={isMobile ? { top: 5, right: 5, left: 5, bottom: 5 } : {}}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      fontSize={isMobile ? 10 : 12}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <YAxis
                      fontSize={isMobile ? 10 : 12}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: isMobile ? '12px' : '14px',
                        padding: isMobile ? '8px' : '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="properties"
                      stroke="#1976d2"
                      strokeWidth={isMobile ? 2 : 3}
                      name="Properties"
                      dot={{ r: isMobile ? 3 : 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#dc004e"
                      strokeWidth={isMobile ? 2 : 3}
                      name="Users"
                      dot={{ r: isMobile ? 3 : 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="enquiries"
                      stroke="#2e7d32"
                      strokeWidth={isMobile ? 2 : 3}
                      name="Enquiries"
                      dot={{ r: isMobile ? 3 : 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Property Types */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{
            p: isMobile ? 2 : 3,
            height: isMobile ? (isPortrait ? 350 : 300) : isTablet ? 350 : 400,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              gutterBottom
              fontWeight="bold"
              sx={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                textAlign: isMobile && isPortrait ? 'center' : 'left'
              }}
            >
              Property Types
            </Typography>
            {loading ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
              }}>
                <Typography variant="body2" color="text.secondary">Loading property types...</Typography>
              </Box>
            ) : propertyTypeData.length === 0 ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1
              }}>
                <Typography variant="body2" color="text.secondary">No property type data available</Typography>
              </Box>
            ) : (
              <Box sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Pie Chart Container */}
                <Box sx={{
                  flex: 1,
                  width: '100%',
                  maxWidth: isMobile ? 240 : 280,
                  minHeight: isMobile ? (isPortrait ? 160 : 140) : 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'visible'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? (isPortrait ? 25 : 30) : 40}
                        outerRadius={isMobile ? (isPortrait ? 55 : 65) : 85}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {propertyTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value}%`, name]}
                        contentStyle={{
                          fontSize: isMobile ? '12px' : '14px',
                          padding: isMobile ? '6px 8px' : '8px 12px',
                          borderRadius: '4px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                {/* Legend */}
                <Box sx={{
                  width: '100%',
                  mt: isMobile ? 1 : 2,
                  px: isMobile ? 1 : 0
                }}>
                  {propertyTypeData.map((item, index) => (
                    <Box key={index} sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: isMobile ? 0.75 : 1,
                      py: isMobile ? 0.5 : 0.25,
                      px: isMobile ? 1 : 0.5,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 0,
                        flex: 1,
                        mr: 1
                      }}>
                        <Box
                          sx={{
                            width: isMobile ? 10 : 12,
                            height: isMobile ? 10 : 12,
                            backgroundColor: item.color,
                            borderRadius: '50%',
                            mr: isMobile ? 1 : 1.5,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            fontWeight: 'medium',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: 'text.primary',
                          flexShrink: 0
                        }}
                      >
                        {item.value}% ({item.count || 0})
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Recent Properties */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{
            p: isMobile ? 2 : 3,
            height: isMobile ? 'auto' : 400,
            minHeight: isMobile ? (isPortrait ? 320 : 300) : 400,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: isMobile ? 1.5 : 2,
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight="bold"
                sx={{
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  textAlign: isMobile && isPortrait ? 'center' : 'left',
                  flex: 1
                }}
              >
                Recent Properties
              </Typography>
              <Button
                size={isMobile ? "small" : "small"}
                onClick={() => navigate('/properties')}
                endIcon={<Add />}
                sx={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  minWidth: 'auto',
                  px: isMobile ? 1.5 : 2
                }}
              >
                {isMobile ? 'View All' : 'View All'}
              </Button>
            </Box>
            {loading ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                minHeight: 200
              }}>
                <Typography variant="body2" color="text.secondary">Loading recent properties...</Typography>
              </Box>
            ) : recentProperties.length === 0 ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                minHeight: 200
              }}>
                <Typography variant="body2" color="text.secondary">No recent properties found</Typography>
              </Box>
            ) : (
              <List sx={{
                flex: 1,
                overflow: 'auto',
                p: 0,
                '& .MuiListItem-root': {
                  alignItems: 'flex-start',
                }
              }}>
                {recentProperties.slice(0, isMobile ? 3 : 5).map((property) => (
                  <ListItem
                    key={property.id}
                    sx={{
                      px: 0,
                      cursor: 'pointer',
                      borderRadius: 1,
                      mb: isMobile ? 0.5 : 0.25,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      py: isMobile ? (isPortrait ? 1.25 : 1.5) : 1,
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      mb: 0.5
                    }}>
                      <ListItemAvatar sx={{
                        minWidth: isMobile ? (isPortrait ? 36 : 40) : 56,
                        mr: isMobile ? (isPortrait ? 1 : 1.5) : 2
                      }}>
                        <Avatar sx={{
                          backgroundColor: 'primary.main',
                          width: isMobile ? (isPortrait ? 32 : 36) : 40,
                          height: isMobile ? (isPortrait ? 32 : 36) : 40
                        }}>
                          <Home sx={{ fontSize: isMobile ? (isPortrait ? 16 : 18) : 20 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        sx={{ flex: 1, minWidth: 0 }}
                        primary={
                          <Typography
                            variant="body1"
                            fontWeight="medium"
                            sx={{
                              fontSize: isMobile ? (isPortrait ? '0.8rem' : '0.875rem') : '1rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.2
                            }}
                          >
                            {property.title || 'Untitled Property'}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: isMobile ? (isPortrait ? '0.7rem' : '0.75rem') : '0.875rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.3,
                              mt: 0.25
                            }}
                          >
                            {property.city || 'Unknown City'}
                          </Typography>
                        }
                      />
                      <Chip
                        label={property.status || 'active'}
                        color={getStatusColor(property.status)}
                        size={isMobile ? "small" : "small"}
                        sx={{
                          fontSize: isMobile ? (isPortrait ? '0.65rem' : '0.7rem') : '0.75rem',
                          height: isMobile ? (isPortrait ? 20 : 22) : 24,
                          ml: 1,
                          flexShrink: 0
                        }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{
            p: isMobile ? 2 : 3,
            height: isMobile ? 'auto' : 400,
            minHeight: isMobile ? (isPortrait ? 320 : 300) : 400,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: isMobile ? 1.5 : 2,
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight="bold"
                sx={{
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  textAlign: isMobile && isPortrait ? 'center' : 'left',
                  flex: 1
                }}
              >
                Recent Users
              </Typography>
              <Button
                size={isMobile ? "small" : "small"}
                onClick={() => navigate('/users')}
                endIcon={<Add />}
                sx={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  minWidth: 'auto',
                  px: isMobile ? 1.5 : 2
                }}
              >
                View All
              </Button>
            </Box>
            <List sx={{
              flex: 1,
              overflow: 'auto',
              p: 0,
              '& .MuiListItem-root': {
                alignItems: 'flex-start',
              }
            }}>
              {recentUsers.slice(0, isMobile ? 3 : 5).map((user) => (
                <ListItem key={user.id} sx={{
                  px: 0,
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: isMobile ? 0.5 : 0.25,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  py: isMobile ? (isPortrait ? 1.25 : 1.5) : 1,
                  flexDirection: 'column',
                  alignItems: 'stretch'
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <ListItemAvatar sx={{
                      minWidth: isMobile ? (isPortrait ? 36 : 40) : 56,
                      mr: isMobile ? (isPortrait ? 1 : 1.5) : 2
                    }}>
                      <Avatar sx={{
                        backgroundColor: 'secondary.main',
                        width: isMobile ? (isPortrait ? 32 : 36) : 40,
                        height: isMobile ? (isPortrait ? 32 : 36) : 40
                      }}>
                        <Typography sx={{
                          fontSize: isMobile ? (isPortrait ? '0.75rem' : '0.875rem') : '1rem',
                          fontWeight: 'bold'
                        }}>
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </Typography>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ flex: 1, minWidth: 0 }}
                      primary={
                        <Typography
                          variant="body1"
                          fontWeight="medium"
                          sx={{
                            fontSize: isMobile ? (isPortrait ? '0.8rem' : '0.875rem') : '1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2
                          }}
                        >
                          {user.full_name || user.email}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: isMobile ? (isPortrait ? '0.7rem' : '0.75rem') : '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.3,
                            mt: 0.25
                          }}
                        >
                          {user.email} • {user.role}
                        </Typography>
                      }
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Enquiries */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{
            p: isMobile ? 2 : 3,
            height: isMobile ? 'auto' : 400,
            minHeight: isMobile ? (isPortrait ? 320 : 300) : 400,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: isMobile ? 1.5 : 2,
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight="bold"
                sx={{
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  textAlign: isMobile && isPortrait ? 'center' : 'left',
                  flex: 1
                }}
              >
                Recent Enquiries
              </Typography>
              <Button
                size={isMobile ? "small" : "small"}
                onClick={() => navigate('/enquiries')}
                endIcon={<Add />}
                sx={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  minWidth: 'auto',
                  px: isMobile ? 1.5 : 2
                }}
              >
                View All
              </Button>
            </Box>
            <List sx={{
              flex: 1,
              overflow: 'auto',
              p: 0,
              '& .MuiListItem-root': {
                alignItems: 'flex-start',
              }
            }}>
              {recentEnquiries.slice(0, isMobile ? 3 : 5).map((enquiry) => (
                <ListItem key={enquiry.id} sx={{
                  px: 0,
                  cursor: 'pointer',
                  borderRadius: 1,
                  mb: isMobile ? 0.5 : 0.25,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  py: isMobile ? (isPortrait ? 1.25 : 1.5) : 1,
                  flexDirection: 'column',
                  alignItems: 'stretch'
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <ListItemAvatar sx={{
                      minWidth: isMobile ? (isPortrait ? 36 : 40) : 56,
                      mr: isMobile ? (isPortrait ? 1 : 1.5) : 2
                    }}>
                      <Avatar sx={{
                        backgroundColor: 'success.main',
                        width: isMobile ? (isPortrait ? 32 : 36) : 40,
                        height: isMobile ? (isPortrait ? 32 : 36) : 40
                      }}>
                        <ContactMail sx={{ fontSize: isMobile ? (isPortrait ? 16 : 18) : 20 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ flex: 1, minWidth: 0 }}
                      primary={
                        <Typography
                          variant="body1"
                          fontWeight="medium"
                          sx={{
                            fontSize: isMobile ? (isPortrait ? '0.8rem' : '0.875rem') : '1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2
                          }}
                        >
                          {enquiry.name}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: isMobile ? (isPortrait ? '0.7rem' : '0.75rem') : '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.3,
                            mt: 0.25
                          }}
                        >
                          {enquiry.email} • {enquiry.phone} • {enquiry.status || 'pending'}
                        </Typography>
                      }
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;