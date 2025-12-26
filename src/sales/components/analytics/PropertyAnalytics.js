import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Home,
  AttachMoney,
  Star,
} from '@mui/icons-material';
import { propertiesAPI } from '../../../main-dashboard/services/api';

const PropertyAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  
  // Analytics data
  const [statistics, setStatistics] = useState({
    total: 0,
    available: 0,
    sold: 0,
    pending: 0,
    featured: 0,
    totalValue: 0,
    averagePrice: 0,
    averageArea: 0,
  });
  
  const [chartData, setChartData] = useState({
    statusDistribution: [],
    typeDistribution: [],
    priceRanges: [],
    cityDistribution: [],
    monthlyTrends: [],
    areaDistribution: [],
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all properties for analysis
      const response = await propertiesAPI.getAll({ includeInactive: 'true' });
      const properties = response.data?.properties || response.data || [];

      // Calculate statistics
      calculateStatistics(properties);

      // Generate chart data
      generateChartData(properties);

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, fetchAnalytics]);

  const calculateStatistics = (properties) => {
    const stats = {
      total: properties.length,
      available: properties.filter(p => p.status === 'available').length,
      sold: properties.filter(p => p.status === 'sold').length,
      pending: properties.filter(p => p.status === 'pending').length,
      featured: properties.filter(p => p.is_featured).length,
      totalValue: 0,
      averagePrice: 0,
      averageArea: 0,
    };

    // Calculate financial metrics
    const validPrices = properties
      .map(p => parseFloat(p.price?.toString().replace(/[^0-9.]/g, '')) || 0)
      .filter(price => price > 0);
    
    const validAreas = properties
      .map(p => parseFloat(p.area) || 0)
      .filter(area => area > 0);

    stats.totalValue = validPrices.reduce((sum, price) => sum + price, 0);
    stats.averagePrice = validPrices.length > 0 ? stats.totalValue / validPrices.length : 0;
    stats.averageArea = validAreas.length > 0 ? validAreas.reduce((sum, area) => sum + area, 0) / validAreas.length : 0;

    setStatistics(stats);
  };

  const generateChartData = (properties) => {
    // Status distribution
    const statusCounts = properties.reduce((acc, p) => {
      const status = p.status || 'available';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      percentage: ((count / properties.length) * 100).toFixed(1),
    }));

    // Property type distribution
    const typeCounts = properties.reduce((acc, p) => {
      const type = p.property_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const typeDistribution = Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percentage: ((count / properties.length) * 100).toFixed(1),
    }));

    // Price ranges
    const priceRanges = [
      { range: '0-10L', min: 0, max: 1000000, count: 0 },
      { range: '10L-25L', min: 1000000, max: 2500000, count: 0 },
      { range: '25L-50L', min: 2500000, max: 5000000, count: 0 },
      { range: '50L-1Cr', min: 5000000, max: 10000000, count: 0 },
      { range: '1Cr+', min: 10000000, max: Infinity, count: 0 },
    ];

    properties.forEach(p => {
      const price = parseFloat(p.price?.toString().replace(/[^0-9.]/g, '')) || 0;
      const range = priceRanges.find(r => price >= r.min && price < r.max);
      if (range) range.count++;
    });

    // City distribution (top 10)
    const cityCounts = properties.reduce((acc, p) => {
      const city = p.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    const cityDistribution = Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({
        name: city,
        value: count,
        percentage: ((count / properties.length) * 100).toFixed(1),
      }));

    // Monthly trends (last 12 months)
    const monthlyData = {};
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData[monthKey] = { month: monthName, count: 0, value: 0 };
    }

    properties.forEach(p => {
      const createdDate = new Date(p.created_at);
      const monthKey = createdDate.toISOString().slice(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].count++;
        const price = parseFloat(p.price?.toString().replace(/[^0-9.]/g, '')) || 0;
        monthlyData[monthKey].value += price;
      }
    });

    const monthlyTrends = Object.values(monthlyData);

    // Area distribution
    const areaRanges = [
      { range: '0-500', min: 0, max: 500, count: 0 },
      { range: '500-1000', min: 500, max: 1000, count: 0 },
      { range: '1000-1500', min: 1000, max: 1500, count: 0 },
      { range: '1500-2000', min: 1500, max: 2000, count: 0 },
      { range: '2000+', min: 2000, max: Infinity, count: 0 },
    ];

    properties.forEach(p => {
      const area = parseFloat(p.area) || 0;
      const range = areaRanges.find(r => area >= r.min && area < r.max);
      if (range) range.count++;
    });

    setChartData({
      statusDistribution,
      typeDistribution,
      priceRanges,
      cityDistribution,
      monthlyTrends,
      areaDistribution: areaRanges,
    });
  };

  const formatPrice = (price) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Property Analytics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 3 months</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
            <MenuItem value="all">All time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Home sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="primary">
                {statistics.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Properties
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {statistics.available}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="info.main">
                {formatPrice(statistics.totalValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {statistics.featured}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Featured
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" color="secondary.main">
                {formatPrice(statistics.averagePrice)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Price
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" color="secondary.main">
                {Math.round(statistics.averageArea)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Area (sq ft)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Property Type Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Property Type Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Price Range Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Price Range Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.priceRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* City Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Top Cities
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.cityDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Monthly Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Monthly Property Listings Trend
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? value : formatPrice(value),
                    name === 'count' ? 'Properties Listed' : 'Total Value'
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Properties Listed"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  stroke="#ff7300"
                  name="Total Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Area Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Area Distribution (sq ft)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.areaDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.areaDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PropertyAnalytics;
