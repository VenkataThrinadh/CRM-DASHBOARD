import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Close,
  People,
  TrendingUp,
  PersonAdd,
  Business,
  Source,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

const CustomerAnalytics = ({ open, onClose, analytics = {} }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const StatCard = ({ icon, title, value, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div">
              {formatNumber(value)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ backgroundColor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, p: 1, boxShadow: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{label}</Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>{`${entry.name}: ${entry.value}`}</Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Customer Analytics</Typography>
          <IconButton onClick={onClose}><Close /></IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<People />} title="Total Customers" value={analytics.totalCustomers || 0} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<TrendingUp />} title="Active Customers" value={analytics.activeCustomers || 0} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<PersonAdd />} title="New This Month" value={analytics.newCustomersThisMonth || 0} color="info" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Business />} title="Conversion Rate" value={`${analytics.totalCustomers > 0 ? Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100) : 0}%`} color="warning" />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Source Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Customer Sources</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={analytics.sourceDistribution || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="count">
                      {analytics.sourceDistribution?.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Status Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Customer Status</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.statusDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Cities */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Cities</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topCities || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Summary Stats */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Summary Statistics</Typography>
          <Grid container spacing={2}>
            {(analytics.sourceDistribution || []).map((source, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Source sx={{ color: COLORS[index % COLORS.length] }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">{source.source}</Typography>
                    <Typography variant="h6">{source.count} customers</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerAnalytics;
