import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Card, CardContent, Typography, Paper, Avatar, Button, useTheme, useMediaQuery, Tabs, Tab, List, ListItem, ListItemAvatar, ListItemText, Chip } from '@mui/material';
import { Home, People, ContactMail, Visibility, Add } from '@mui/icons-material';
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
import { adminAPI, propertiesAPI, usersAPI, enquiriesAPI, customersAPI } from '../../main-dashboard/services/api';
import AdvancedReports from '../components/reports/AdvancedReports';
import PropertyAnalytics from '../components/analytics/PropertyAnalytics';
import CustomerAnalytics from '../components/analytics/CustomerAnalytics';
import { useNavigate, useLocation } from 'react-router-dom';

const SalesStatCard = ({ title, value, change, icon, color = 'primary' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isPositive = change >= 0;
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" color="text.secondary" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
            <Typography variant="body2" sx={{ color: isPositive ? 'success.main' : 'error.main' }}>{Math.abs(change)}% from last month</Typography>
          </Box>
          <Avatar sx={{ backgroundColor: `${color}.main` }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const SalesDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const [salesTab, setSalesTab] = useState(0);
  const [openCustomerAnalytics, setOpenCustomerAnalytics] = useState(false);
  const [customerAnalyticsData, setCustomerAnalyticsData] = useState(null);
  const [stats, setStats] = useState({ totalProperties: 0, totalUsers: 0, totalEnquiries: 0, activeProperties: 0 });
  const [changes, setChanges] = useState({ properties: 0, users: 0, enquiries: 0, activeProperties: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [propertyTypeData, setPropertyTypeData] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
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

      setStats({
        totalProperties: dashboardRes.data.totalProperties || 0,
        totalUsers: dashboardRes.data.totalUsers || 0,
        totalEnquiries: dashboardRes.data.totalEnquiries || 0,
        activeProperties: dashboardRes.data.activeProperties || 0,
      });

      const rawChanges = statsWithChangesRes?.data?.changes || { properties: 0, users: 0, enquiries: 0, activeProperties: 0 };
      setChanges({
        properties: normalizePercentageChange(rawChanges.properties),
        users: normalizePercentageChange(rawChanges.users, 'users'),
        enquiries: normalizePercentageChange(rawChanges.enquiries, 'enquiries'),
        activeProperties: normalizePercentageChange(rawChanges.activeProperties, 'activeProperties'),
      });

      setMonthlyData(monthlyTrendsRes.data || []);
      setPropertyTypeData(propertyTypesRes.data || []);
      const recentProps = Array.isArray(propertiesRes.data) ? propertiesRes.data : propertiesRes.data?.properties || [];
      setRecentProperties(recentProps);
      setRecentUsers(usersRes.data?.users || []);
      setRecentEnquiries(enquiriesRes.data?.enquiries || []);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setMonthlyData([]);
      setPropertyTypeData([{ name: 'No Data', value: 100, color: '#1976d2' }]);
      setRecentProperties([]);
      setRecentUsers([]);
      setRecentEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (location.pathname.endsWith('/analytics') || tab === 'analytics') setSalesTab(1);
    else if (location.pathname.endsWith('/reports') || tab === 'reports') setSalesTab(2);
    else setSalesTab(0);
  }, [location.pathname, location.search]);

  const fetchCustomerAnalytics = async () => {
    try {
      const res = await customersAPI.getAnalytics();
      setCustomerAnalyticsData(res.data || {});
      setOpenCustomerAnalytics(true);
    } catch (err) {
      console.error('Failed to fetch customer analytics', err);
    }
  };

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

  const normalizePercentageChange = (change, type = 'default') => {
    if (typeof change !== 'number' || isNaN(change)) return 0;
    if (type === 'users' || type === 'enquiries' || type === 'activeProperties') {
      const maxChange = 100;
      const minChange = -100;
      if (change > maxChange) return maxChange;
      if (change < minChange) return minChange;
      return Math.round(change * 100) / 100;
    }
    const maxChange = 500;
    const minChange = -500;
    if (change > maxChange) return maxChange;
    if (change < minChange) return minChange;
    return Math.round(change * 100) / 100;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: isMobile ? 3 : 4, textAlign: isSmallScreen ? 'center' : 'left' }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom fontWeight="bold">Sales Dashboard</Typography>
        <Typography color="text.secondary">Welcome back! Here's what's happening with your real estate business.</Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ p: 1, mb: 3 }}>
        <Tabs
          value={salesTab}
          onChange={(e, val) => {
            setSalesTab(val);
            if (val === 1) navigate('/sales-dashboard/analytics');
            else if (val === 2) navigate('/sales-dashboard/reports');
            else navigate('/dashboard');
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Reports" />
        </Tabs>
      </Paper>

      <Box>
        {salesTab === 0 && (
          <>
            <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 3 : 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <SalesStatCard title="Total Properties" value={stats.totalProperties} change={changes.properties} icon={<Home />} color="primary" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <SalesStatCard title="Total Users" value={stats.totalUsers} change={changes.users} icon={<People />} color="secondary" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <SalesStatCard title="Total Enquiries" value={stats.totalEnquiries} change={changes.enquiries} icon={<ContactMail />} color="success" />
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <SalesStatCard title="Active Properties" value={stats.activeProperties} change={changes.activeProperties} icon={<Visibility />} color="info" />
              </Grid>
            </Grid>

            {/* Additional Overview content (charts, recent activity) would be here */}
          </>
        )}

        {salesTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="outlined" onClick={() => fetchCustomerAnalytics()}>Open Customer Analytics</Button>
            </Box>
            <PropertyAnalytics />
            {/* Leads mini analytics */}
            <Box sx={{ mt: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">Leads</Typography>
                      <Typography color="text.secondary">Total: {leadsStats.total}</Typography>
                    </Box>
                    <Box sx={{ width: 200, height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={leadsStats.statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={50} innerRadius={20}>
                            {leadsStats.statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={["#1976d2","#00C49F","#FFBB28","#FF7043","#9C27B0","#90A4AE"][index % 6]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {salesTab === 2 && (
          <Box>
            <AdvancedReports />
          </Box>
        )}

        <CustomerAnalytics open={openCustomerAnalytics} onClose={() => setOpenCustomerAnalytics(false)} analytics={customerAnalyticsData || {}} />
      </Box>
    </Box>
  );
};

export default SalesDashboard;