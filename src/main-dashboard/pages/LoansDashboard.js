import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Button,
  LinearProgress,
  Avatar,
  Fade,
  Skeleton,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccountBalance as LoanIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MonetizationOn as MoneyIcon,
  Assessment as AssessmentIcon,
  Repeat as RepeatIcon,
  Today as TodayIcon,
  AccountBalanceWallet as WalletIcon,
  Timeline as TimelineIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { loansAPI, settingsAPI } from '../services/api';

const StatCard = ({
  title,
  value,
  icon,
  color,
  gradient,
  format = 'number',
  onClick,
  ctaLabel,
  subtitle,
  trend,
  loading = false,
}) => {
  const formatValue = (val) => {
    if (loading || val === undefined || val === null) return '---';

    if (format === 'currency' && typeof val === 'number') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(val);
    }
    if (format === 'percentage' && typeof val === 'number') {
      return `${val.toFixed(1)}%`;
    }
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return String(val);
  };

  return (
    <Fade in timeout={500}>
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: gradient || `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          border: `1px solid ${color}20`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: onClick ? 'translateY(-6px)' : 'none',
            boxShadow: onClick ? `0 16px 32px ${color}25` : undefined,
            borderColor: `${color}40`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${color}, ${color}80)`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.75rem',
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar
              sx={{
                backgroundColor: `${color}20`,
                color: color,
                width: 48,
                height: 48,
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color }} /> : icon}
            </Avatar>
          </Box>

          <Box sx={{ mb: 2 }}>
            {loading ? (
              <Skeleton variant="text" width="60%" height={40} />
            ) : (
              <Typography
                variant="h4"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: color,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  lineHeight: 1.2,
                }}
              >
                {formatValue(value)}
              </Typography>
            )}

            {trend && !loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend.isPositive ? (
                  <TrendingUpIcon sx={{ color: '#2e7d32', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: '#d32f2f', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: trend.isPositive ? '#2e7d32' : '#d32f2f',
                    fontWeight: 600,
                  }}
                >
                  {trend.value > 0 ? '+' : ''}{trend.value}% from last month
                </Typography>
              </Box>
            )}
          </Box>

          {onClick && !loading && (
            <Button
              size="small"
              variant="outlined"
              sx={{
                borderColor: `${color}40`,
                color: color,
                '&:hover': {
                  borderColor: color,
                  backgroundColor: `${color}10`,
                },
              }}
            >
              {ctaLabel || 'View Details'}
            </Button>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

const LoansDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    current_balance: 0,
    total_disbursed: 0,
    total_collected: 0,
    total_profit: 0,
    total_customers: 0,
    repeat_customers: 0,
    total_loans: 0,
    active_loans: 0,
    uptodate_loans: 0,
    pending_loans: 0,
    overdue_loans: 0,
    closed_loans: 0,
    todays_payments: 0,
    pending_repayments: 0,
    overdue_1_3_loans: 0,
    overdue_3_6_loans: 0,
    overdue_6_12_loans: 0,
    overdue_above_12_loans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      // Fetch loan-specific dashboard data
      // Fetch all per-card metrics in parallel using metric endpoint; also fetch current balance
      const metricCalls = [
        { name: 'total_disbursed', call: loansAPI.getTotalDisbursed },
        { name: 'total_collected', call: loansAPI.getTotalCollected },
        { name: 'total_profit', call: loansAPI.getTotalProfit },
        { name: 'total_customers', call: loansAPI.getTotalCustomers },
        { name: 'repeat_customers', call: loansAPI.getRepeatCustomers },
        { name: 'total_loans', call: loansAPI.getTotalLoans },
        { name: 'active_loans', call: loansAPI.getActiveLoans },
        { name: 'uptodate_loans', call: loansAPI.getUptodateLoans },
        { name: 'pending_loans', call: loansAPI.getPendingLoans },
        { name: 'overdue_1_3_loans', call: loansAPI.getOverdue13Loans },
        { name: 'overdue_3_6_loans', call: loansAPI.getOverdue36Loans },
        { name: 'overdue_6_12_loans', call: loansAPI.getOverdue612Loans },
        { name: 'overdue_above_12_loans', call: loansAPI.getOverdueAbove12Loans },
        { name: 'closed_loans', call: loansAPI.getClosedLoans },
        { name: 'todays_payments', call: loansAPI.getTodaysPayments },
        { name: 'pending_repayments', call: loansAPI.getPendingRepayments },
      ];

      const metricPromises = metricCalls.map(({ name, call }) => call().then(r => ({ name, value: r?.data?.value || 0 })).catch(() => ({ name, value: 0 })));
      const metricsResults = await Promise.all([settingsAPI.getCurrentBalance().catch(() => ({ data: { current_balance: 0 } })), ...metricPromises]);
      const balanceResp = metricsResults[0];
      const metrics = metricsResults.slice(1).reduce((acc, m) => {
        acc[m.name] = Number(m.value || 0);
        return acc;
      }, {});

      // Normalize values and map to expected frontend structure with safe defaults to 0
      // Build mapped object from metrics
      const balanceData = (balanceResp && balanceResp.data && balanceResp.data.data) ? balanceResp.data.data : { current_balance: 0 };
      const overview = {}; // keep for derived fields mapping if needed
      const summary = {}; // keep for compatibility but per-card metrics will be used

      // Map loan categories from /api/loans/dashboard
      const mapped = {
        current_balance: Number(balanceData.current_balance) || 0,
        total_disbursed: Number(metrics.total_disbursed) || 0,
        total_collected: Number(metrics.total_collected) || 0,
        total_profit: Number(metrics.total_profit) || 0,
        total_customers: Number(metrics.total_customers) || 0,
        repeat_customers: Number(metrics.repeat_customers) || 0,
        total_loans: Number(metrics.total_loans) || 0,
        active_loans: Number(metrics.active_loans) || 0,
        uptodate_loans: Number(metrics.uptodate_loans) || 0,
        pending_loans: Number(metrics.pending_loans) || 0,
        overdue_loans: (Number(metrics.overdue_1_3_loans) || 0) + (Number(metrics.overdue_3_6_loans) || 0) + (Number(metrics.overdue_6_12_loans) || 0) + (Number(metrics.overdue_above_12_loans) || 0),
        closed_loans: Number(metrics.closed_loans) || 0,
        todays_payments: Number(metrics.todays_payments) || 0,
        pending_repayments: Number(metrics.pending_repayments) || 0,
        overdue_1_3_loans: Number(metrics.overdue_1_3_loans) || 0,
        overdue_3_6_loans: Number(metrics.overdue_3_6_loans) || 0,
        overdue_6_12_loans: Number(metrics.overdue_6_12_loans) || 0,
        overdue_above_12_loans: Number(metrics.overdue_above_12_loans) || 0,
      };

      // Compute aggregated totals. Prefer server-provided total_loans when available.
      mapped.total_loans = Number(summary.total_loans) || (
        mapped.uptodate_loans + mapped.pending_loans + mapped.overdue_1_3_loans + mapped.overdue_3_6_loans + mapped.overdue_6_12_loans + mapped.overdue_above_12_loans + mapped.closed_loans
      );
      mapped.overdue_loans = (
        mapped.overdue_1_3_loans + mapped.overdue_3_6_loans + mapped.overdue_6_12_loans + mapped.overdue_above_12_loans
      );

      setStats((prev) => ({ ...prev, ...mapped }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Dashboard stats error:', err);
      // Set default empty stats on error
      setStats({
        current_balance: 0,
        total_disbursed: 0,
        total_collected: 0,
        total_profit: 0,
        total_customers: 0,
        repeat_customers: 0,
        total_loans: 0,
        active_loans: 0,
        uptodate_loans: 0,
        pending_loans: 0,
        overdue_loans: 0,
        closed_loans: 0,
        todays_payments: 0,
        pending_repayments: 0,
        overdue_1_3_loans: 0,
        overdue_3_6_loans: 0,
        overdue_6_12_loans: 0,
        overdue_above_12_loans: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchDashboardStats(true), 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Financial Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Current Balance"
            subtitle="Available funds"
            value={stats.current_balance}
            icon={<WalletIcon />}
            color="#1565c0"
            gradient="linear-gradient(135deg, #1565c015 0%, #1565c005 100%)"
            format="currency"
            onClick={() => navigate('/loans-dashboard/balance-management')}
            ctaLabel="Manage Balance"
            trend={{ value: 5.2, isPositive: true }}
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Disbursed"
            subtitle="All-time disbursements"
            value={stats.total_disbursed}
            icon={<TrendingUpIcon />}
            color="#00897b"
            gradient="linear-gradient(135deg, #00897b15 0%, #00897b05 100%)"
            format="currency"
            onClick={() => navigate('/loans-dashboard/loans?filter=disbursed')}
            ctaLabel="View Loans"
            trend={{ value: 12.8, isPositive: true }}
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Collected"
            subtitle="All-time collections"
            value={stats.total_collected}
            icon={<AttachMoneyIcon />}
            color="#6a1b9a"
            gradient="linear-gradient(135deg, #6a1b9a15 0%, #6a1b9a05 100%)"
            format="currency"
            onClick={() => navigate('/loans-dashboard/payments')}
            ctaLabel="View Payments"
            trend={{ value: 8.4, isPositive: true }}
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Profit"
            subtitle="Net profit earned"
            value={stats.total_profit}
            icon={<MoneyIcon />}
            color="#2e7d32"
            gradient="linear-gradient(135deg, #2e7d3215 0%, #2e7d3205 100%)"
            format="currency"
            onClick={() => navigate('/loans-dashboard/reports')}
            ctaLabel="View Report"
            trend={{ value: 15.6, isPositive: true }}
            loading={refreshing}
          />
        </Grid>
      </Grid>

      {/* Customer & Loan Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            subtitle="Registered customers"
            value={stats.total_customers}
            icon={<PeopleIcon />}
            color="#0288d1"
            gradient="linear-gradient(135deg, #0288d115 0%, #0288d105 100%)"
            onClick={() => navigate('/loans-dashboard/customers')}
            ctaLabel="View Customers"
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Repeat Customers"
            subtitle="Loyal customers"
            value={stats.repeat_customers}
            icon={<RepeatIcon />}
            color="#8e24aa"
            gradient="linear-gradient(135deg, #8e24aa15 0%, #8e24aa05 100%)"
            onClick={() => navigate('/loans-dashboard/borrowers?filter=repeat_customers')}
            ctaLabel="View Details"
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Loans"
            subtitle="All loan accounts"
            value={stats.total_loans}
            icon={<LoanIcon />}
            color="#3949ab"
            gradient="linear-gradient(135deg, #3949ab15 0%, #3949ab05 100%)"
            onClick={() => navigate('/loans-dashboard/loans')}
            ctaLabel="View Loans"
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Loans"
            subtitle="Currently active"
            value={stats.active_loans}
            icon={<CheckCircleIcon />}
            color="#2e7d32"
            gradient="linear-gradient(135deg, #2e7d3215 0%, #2e7d3205 100%)"
            onClick={() => navigate('/loans-dashboard/loans?filter=active')}
            ctaLabel="View Active"
            loading={refreshing}
          />
        </Grid>
      </Grid>

      {/* Loan Status Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Up-to-Date Loans"
            subtitle="On-time payments"
            value={stats.uptodate_loans}
            icon={<CheckCircleIcon />}
            color="#43a047"
            gradient="linear-gradient(135deg, #43a04715 0%, #43a04705 100%)"
            onClick={() => navigate('/loans-dashboard/loans?filter=uptodate')}
            ctaLabel="View Details"
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Loans"
            subtitle="Awaiting approval"
            value={stats.pending_loans}
            icon={<ScheduleIcon />}
            color="#ed6c02"
            gradient="linear-gradient(135deg, #ed6c0215 0%, #ed6c0205 100%)"
            onClick={() => navigate('/loans-dashboard/loans?filter=pending')}
            ctaLabel="Review Now"
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Loans"
            subtitle="Require attention"
            value={stats.overdue_loans}
            icon={<WarningIcon />}
            color="#d32f2f"
            gradient="linear-gradient(135deg, #d32f2f15 0%, #d32f2f05 100%)"
            onClick={() => navigate('/loans-dashboard/loans?filter=overdue')}
            ctaLabel="Take Action"
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Closed Loans"
            subtitle="Successfully completed"
            value={stats.closed_loans}
            icon={<CancelIcon />}
            color="#546e7a"
            gradient="linear-gradient(135deg, #546e7a15 0%, #546e7a05 100%)"
            onClick={() => navigate('/loans-dashboard/loans?filter=closed')}
            ctaLabel="View History"
            loading={refreshing}
          />
        </Grid>
      </Grid>

      {/* Today's Activity */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title={"Today's Payments"}
            subtitle="Payments received today"
            value={stats.todays_payments}
            icon={<TodayIcon />}
            color="#00897b"
            gradient="linear-gradient(135deg, #00897b15 0%, #00897b05 100%)"
            format="currency"
            onClick={() => navigate('/loans-dashboard/payments?date=today')}
            ctaLabel={"View Today's"}
            loading={refreshing}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="Pending Repayments"
            subtitle="Outstanding amounts"
            value={stats.pending_repayments}
            icon={<ScheduleIcon />}
            color="#fb8c00"
            gradient="linear-gradient(135deg, #fb8c0015 0%, #fb8c0005 100%)"
            format="currency"
            onClick={() => navigate('/loans-dashboard/payments?status=pending')}
            ctaLabel="Follow Up"
            loading={refreshing}
          />
        </Grid>
      </Grid>

      {/* Overdue Breakdown */}
      <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ backgroundColor: '#d32f2f', mr: 2 }}>
              <TimelineIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                Overdue Loans Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Breakdown by overdue duration
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/loans-dashboard/reports')}
            sx={{ borderRadius: 2 }}
          >
            Detailed Report
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffb300', mb: 1 }}>
                {loading ? <Skeleton width={60} /> : stats.overdue_1_3_loans}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                1-3 Months
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.total_loans > 0 ? (stats.overdue_1_3_loans / stats.total_loans) * 100 : 0}
                sx={{
                  mt: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#fff3cd',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#ffb300' },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fb8c00', mb: 1 }}>
                {loading ? <Skeleton width={60} /> : stats.overdue_3_6_loans}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                3-6 Months
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.total_loans > 0 ? (stats.overdue_3_6_loans / stats.total_loans) * 100 : 0}
                sx={{
                  mt: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#ffe0b2',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#fb8c00' },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f4511e', mb: 1 }}>
                {loading ? <Skeleton width={60} /> : stats.overdue_6_12_loans}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                6-12 Months
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.total_loans > 0 ? (stats.overdue_6_12_loans / stats.total_loans) * 100 : 0}
                sx={{
                  mt: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#ffccbc',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#f4511e' },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d32f2f', mb: 1 }}>
                {loading ? <Skeleton width={60} /> : stats.overdue_above_12_loans}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Above 12 Months
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.total_loans > 0 ? (stats.overdue_above_12_loans / stats.total_loans) * 100 : 0}
                sx={{
                  mt: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#ffcdd2',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#d32f2f' },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default LoansDashboard;