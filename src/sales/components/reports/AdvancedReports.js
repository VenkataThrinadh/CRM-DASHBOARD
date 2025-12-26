/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
} from 'recharts';
import {
  Download,
  Refresh,
  TrendingUp,
  TrendingDown,
  Home,
  People,
  Email,
  AttachMoney,
  Schedule,
  Visibility,
  Star,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { reportsAPI } from '../../../main-dashboard/services/api';
import * as XLSX from 'xlsx';

const AdvancedReports = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    endDate: new Date(),
  });
  const [reportData, setReportData] = useState({
    overview: {},
    properties: {},
    users: {},
    enquiries: {},
    revenue: {},
  });
  const [filters, setFilters] = useState({
    propertyType: 'all',
    city: 'all',
    userRole: 'all',
    status: 'all',
  });

  const generateReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      };

      const [overviewRes, propertiesRes, usersRes, enquiriesRes, revenueRes] = await Promise.all([
        reportsAPI.getOverviewReport(params, filters),
        reportsAPI.getPropertiesReport(params, filters),
        reportsAPI.getUsersReport(params, filters),
        reportsAPI.getEnquiriesReport(params, filters),
        reportsAPI.getRevenueReport(params, filters),
      ]);

      setReportData({
        overview: overviewRes.data || {},
        properties: propertiesRes.data || {},
        users: usersRes.data || {},
        enquiries: enquiriesRes.data || {},
        revenue: revenueRes.data || {},
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating reports:', error);
      setReportData({
        overview: { dailyData: [], totalProperties: 0, totalUsers: 0, totalEnquiries: 0, totalRevenue: 0, totalViews: 0, conversionRate: 0 },
        properties: { byType: [], byCity: [], topPerformers: [] },
        users: { activity: [], topAgents: [], demographics: [] },
        enquiries: { bySource: [], trends: [] },
        revenue: { trends: [], byPropertyType: [] },
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters]);

  useEffect(() => {
    generateReports();
  }, [generateReports]);

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const exportReport = () => {
    const wb = XLSX.utils.book_new();
    let fileName = `advanced_report_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Overview tab data
    const overviewData = reportData.overview.dailyData || [];
    const overview_ws = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, overview_ws, "Overview Trends");

    // Properties tab data
    const propertiesByType_ws = XLSX.utils.json_to_sheet(reportData.properties.byType || []);
    XLSX.utils.book_append_sheet(wb, propertiesByType_ws, "Properties by Type");
    const cityPerformance_ws = XLSX.utils.json_to_sheet(reportData.properties.byCity || []);
    XLSX.utils.book_append_sheet(wb, cityPerformance_ws, "City Performance");

    // Users tab data
    const userActivity_ws = XLSX.utils.json_to_sheet(reportData.users.activity || []);
    XLSX.utils.book_append_sheet(wb, userActivity_ws, "User Activity");
    const topAgents_ws = XLSX.utils.json_to_sheet(reportData.users.topAgents || []);
    XLSX.utils.book_append_sheet(wb, topAgents_ws, "Top Agents");

    // Enquiries tab data
    const enquiriesBySource_ws = XLSX.utils.json_to_sheet(reportData.enquiries.bySource || []);
    XLSX.utils.book_append_sheet(wb, enquiriesBySource_ws, "Enquiries by Source");
    const enquiryTrends_ws = XLSX.utils.json_to_sheet(reportData.enquiries.trends || []);
    XLSX.utils.book_append_sheet(wb, enquiryTrends_ws, "Enquiry Trends");

    XLSX.writeFile(wb, fileName);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  const OverviewTab = () => (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Home sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {reportData.overview.totalProperties || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Properties Listed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {reportData.overview.totalUsers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Email sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {reportData.overview.totalEnquiries || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enquiries Received
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {formatCurrency(reportData.overview.totalRevenue || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h4" color="secondary.main">
                  {reportData.overview.conversionRate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conversion Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Trends Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Daily Trends" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={reportData.overview.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="properties" fill="#1976d2" name="Properties" />
                <Bar yAxisId="left" dataKey="enquiries" fill="#dc004e" name="Enquiries" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#2e7d32" name="Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Stats */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Quick Statistics" />
          <CardContent>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Visibility />
                </ListItemIcon>
                <ListItemText
                  primary="Total Views"
                  secondary={formatNumber(reportData.overview.totalViews || 0)}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Star />
                </ListItemIcon>
                <ListItemText
                  primary="Featured Properties"
                  secondary={`${reportData.overview.featuredProperties || 0} Active`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Schedule />
                </ListItemIcon>
                <ListItemText
                  primary="Avg Response Time"
                  secondary="2.5 hours"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const PropertiesTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Properties by Type" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.properties.byType || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ type, count }) => `${type}: ${count}`}
                >
                  {(reportData.properties.byType || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 50%)`} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Revenue by Property Type" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.properties.byType || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="City Performance" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>City</TableCell>
                    <TableCell align="right">Properties</TableCell>
                    <TableCell align="right">Enquiries</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Growth</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.properties.byCity || []).map((city) => (
                    <TableRow key={city.city}>
                      <TableCell>{city.city}</TableCell>
                      <TableCell align="right">{city.properties}</TableCell>
                      <TableCell align="right">{city.enquiries}</TableCell>
                      <TableCell align="right">{formatCurrency(city.revenue)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${city.growth}%`}
                          color={city.growth >= 0 ? 'success' : 'error'}
                          size="small"
                          icon={city.growth >= 0 ? <TrendingUp /> : <TrendingDown />}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const UsersTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="User Activity Trends" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.users.activity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#1976d2" fill="#1976d2" />
                <Area type="monotone" dataKey="activeUsers" stackId="2" stroke="#dc004e" fill="#dc004e" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="User Demographics" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.users.demographics || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ ageGroup, percentage }) => `${ageGroup}: ${percentage}%`}
                >
                  {(reportData.users.demographics || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 50%)`} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Top Performing Agents" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Agent Name</TableCell>
                    <TableCell align="right">Properties</TableCell>
                    <TableCell align="right">Enquiries</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.users.topAgents || []).map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>{agent.name}</TableCell>
                      <TableCell align="right">{agent.properties}</TableCell>
                      <TableCell align="right">{agent.enquiries}</TableCell>
                      <TableCell align="right">{formatCurrency(agent.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const EnquiriesTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Enquiries by Source" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.enquiries.bySource || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Conversion Rates by Source" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Enquiries</TableCell>
                    <TableCell align="right">Conversions</TableCell>
                    <TableCell align="right">Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(reportData.enquiries.bySource || []).map((source) => (
                    <TableRow key={source.source}>
                      <TableCell>{source.source}</TableCell>
                      <TableCell align="right">{source.count}</TableCell>
                      <TableCell align="right">{source.conversion}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${source.conversionRate}%`}
                          color={source.conversionRate > 20 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Enquiry Trends" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.enquiries.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="enquiries" stroke="#1976d2" name="Enquiries" />
                <Line type="monotone" dataKey="conversions" stroke="#dc004e" name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Advanced Reports
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={generateReports}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => exportReport()}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(newValue) => setDateRange({ ...dateRange, startDate: newValue })}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(newValue) => setDateRange({ ...dateRange, endDate: newValue })}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={filters.propertyType}
                  label="Property Type"
                  onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="apartment">Apartment</MenuItem>
                  <MenuItem value="house">House</MenuItem>
                  <MenuItem value="villa">Villa</MenuItem>
                  <MenuItem value="plot">Plot</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>City</InputLabel>
                <Select
                  value={filters.city}
                  label="City"
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                >
                  <MenuItem value="all">All Cities</MenuItem>
                  <MenuItem value="mumbai">Mumbai</MenuItem>
                  <MenuItem value="delhi">Delhi</MenuItem>
                  <MenuItem value="bangalore">Bangalore</MenuItem>
                  <MenuItem value="chennai">Chennai</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="sold">Sold</MenuItem>
                      <MenuItem value="rented">Rented</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" />
            <Tab label="Properties" />
            <Tab label="Users" />
            <Tab label="Enquiries" />
            
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <OverviewTab />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <PropertiesTab />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <UsersTab />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <EnquiriesTab />
          </TabPanel>
          
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default AdvancedReports;
