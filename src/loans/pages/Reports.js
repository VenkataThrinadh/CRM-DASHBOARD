import React, { useState, useEffect } from 'react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as LoanIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { LoanService } from '../services/loanService';
import { PaymentService } from '../services/paymentService';
import { reportsAPI } from '../../main-dashboard/services/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

// Bar Chart: Collections vs Disbursed
const DynamicBarChart = ({ totalDisbursed, totalCollected, outstanding }) => {
  const data = {
    labels: ['Disbursed', 'Collected', 'Outstanding'],
    datasets: [
      {
        label: 'Amount (INR)',
        data: [totalDisbursed, totalCollected, outstanding],
        backgroundColor: ['#1976d2', '#2e7d32', '#d32f2f'],
      },
    ],
  };
  const options = { 
    responsive: true, 
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(value);
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(value);
          }
        }
      }
    }
  };
  return <Bar data={data} options={options} />;
};

// Doughnut Chart: Loan Status Breakdown
const DynamicDoughnutChart = ({ active, closed, overdue }) => {
  const data = {
    labels: ['Active', 'Closed', 'Overdue'],
    datasets: [
      {
        data: [active, closed, overdue],
        backgroundColor: ['#2e7d32', '#757575', '#d32f2f'],
      },
    ],
  };
  const options = { 
    responsive: true, 
    plugins: { 
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            return label + ': ' + value;
          }
        }
      }
    }
  };
  return <Doughnut data={data} options={options} />;
};

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reportData, setReportData] = useState({
    total_customers: 0,
    total_loans: 0,
    total_disbursed: 0,
    total_payments: 0,
    total_outstanding: 0,
    total_interest_collected: 0,
    overdue_loans: 0,
    closed_loans: 0,
  });
  const [loanReports, setLoanReports] = useState([]);
  const [paymentReports, setPaymentReports] = useState([]);

  // Filter states
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [loanStatus, setLoanStatus] = useState('all');
  const [period, setPeriod] = useState('month');

  const mapStatusToLabel = (statusNum) => {
    if (statusNum === 1) return 'Pending';
    if (statusNum === 2) return 'Active';
    if (statusNum === 3) return 'Closed';
    return 'Unknown';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExportReport = async (format) => {
    try {
      // For now export 'summary' at admin level with filters
      const reportType = 'overview';
      const filters = {};
      if (loanStatus && loanStatus !== 'all') filters.report_type = loanStatus;
      const dateRange = { startDate: dateFrom || undefined, endDate: dateTo || undefined };
      const resp = await reportsAPI.exportReport(reportType, format, dateRange, filters);
      if (!resp || !resp.data) {
        throw new Error('Failed to export report');
      }
      const blob = resp.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loan_report_${reportType}_${dateFrom || 'all'}_to_${dateTo || 'all'}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to export report');
      console.error('Export report error:', err);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return formatDateDDMMYYYY(dateString);
  };

  // Helper to coerce numeric values safely
  const num = (v) => Number.isFinite(v) ? v : Number(v ?? 0) || 0;

  const getStatusChip = (status, daysOverdue) => {
    if (status === 'Pending') {
      return <Chip label="Pending" color="warning" size="small" />;
    } else if (status === 'Closed') {
      return <Chip label="Closed" color="default" size="small" />;
    } else if (daysOverdue > 30) {
      return <Chip label={`${daysOverdue}d Overdue`} color="error" size="small" />;
    } else {
      return <Chip label="Up-to-Date" color="success" size="small" />;
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        // Overview from admin reports (properties/users) for total_customers
        try {
          const overviewResp = await reportsAPI.getOverviewReport({ startDate: dateFrom, endDate: dateTo }, {});
          if (overviewResp && overviewResp.data) {
            setReportData(prev => ({
              ...prev,
              total_customers: Number(overviewResp.data.totalUsers || overviewResp.data.totalUsers || 0),
            }));
          }
        } catch (err) {
          // ignore overview errors, not critical for loans page
          console.warn('Overview fetch failed:', err && err.message || err);
        }
        // Use loans summary endpoint
        const summaryResp = await LoanService.getReportsSummary();
        if (summaryResp && summaryResp.loanStatistics) {
          setReportData(prev => ({
            ...prev,
            total_loans: Number(summaryResp.loanStatistics.totalLoans || 0),
            total_disbursed: Number(summaryResp.loanStatistics.totalAmount || 0),
            total_outstanding: Number(summaryResp.loanStatistics.totalAmount || 0) - Number(summaryResp.collectionStatistics?.totalCollected || 0),
            total_payments: Number(summaryResp.collectionStatistics?.totalCollected || 0),
            total_interest_collected: Number(summaryResp.collectionStatistics?.interest_collected || 0) || 0,
            overdue_loans: 0,
            closed_loans: Number((summaryResp.statusBreakdown || []).find(s => Number(s.status) === 3)?.count || 0),
          }));
        }

        // Loan list (detailed) to show in table (apply loan status mapping)
        const mapLoanStatusToFilter = (ls) => {
          if (!ls || ls === 'all') return undefined;
          if (ls === 'active') return 'uptodate';
          if (ls === 'pending') return 'pending';
          if (ls === 'overdue') return 'overdue_1_3';
          if (ls === 'closed') return 'closed';
          return undefined;
        };
        const loansFilter = mapLoanStatusToFilter(loanStatus);
        const { data: loansData } = await LoanService.getLoans({ limit: 100, filter: loansFilter });
        setLoanReports(loansData || []);

        // Payment list to show in Payment Reports tab
        const resp = await PaymentService.getPayments({ page: 1, limit: 100, date_from: dateFrom || undefined, date_to: dateTo || undefined });
        let payments = [];
        if (Array.isArray(resp)) payments = resp;
        else if (resp && Array.isArray(resp.data)) payments = resp.data;
        else payments = resp?.data || [];
        setPaymentReports(payments || []);
        // Update interest collected from payments list
        const totalInterest = (payments || []).reduce((s, p) => s + num(p.interest_amount), 0);
        setReportData(prev => ({ ...prev, total_interest_collected: totalInterest }));

        // Overdue loans count
        try {
          const overdueResp = await LoanService.getReportsOverdue();
          if (overdueResp && overdueResp.summary) {
            setReportData(prev => ({ ...prev, overdue_loans: Number(overdueResp.summary.totalOverdueLoans || 0) }));
          }
        } catch (err) {
          console.warn('Overdue reports fetch failed:', err && err.message || err);
        }
      } catch (err) {
        setError(err.message || 'Failed to load reports');
        console.error('Reports fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [dateFrom, dateTo, loanStatus]);

  const StatCard = ({ title, value, icon, color, format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'currency' && typeof val === 'number') {
        return formatCurrency(val);
      }
      return typeof val === 'number' ? val.toLocaleString() : val;
    };

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                backgroundColor: `${color}20`,
                borderRadius: '50%',
                p: 1,
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.cloneElement(icon, {
                sx: { color, fontSize: 24 },
              })}
            </Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 'bold',
              color: color,
            }}
          >
            {formatValue(value)}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintReport}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportReport('excel')}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportReport('pdf')}
          >
            PDF
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  label="Period"
                  onChange={(e) => {
                    const p = e.target.value;
                    setPeriod(p);
                    const today = new Date();
                    const to = today.toISOString().split('T')[0];
                    let from = dateFrom;
                    if (p === 'today') {
                      from = to;
                    } else if (p === 'week') {
                      const monday = new Date(today);
                      const day = today.getDay();
                      const diff = (day === 0 ? -6 : 1) - day;
                      monday.setDate(today.getDate() + diff);
                      from = monday.toISOString().split('T')[0];
                    } else if (p === 'month') {
                      from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    } else if (p === 'six_months') {
                      const d = new Date(today);
                      d.setMonth(d.getMonth() - 6);
                      from = d.toISOString().split('T')[0];
                    } else if (p === 'year') {
                      from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                    } else if (p === 'all') {
                      from = '';
                    }
                    if (p !== 'custom') {
                      setDateFrom(from);
                      setDateTo(p === 'all' ? '' : to);
                    }
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="six_months">Last 6 Months</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPeriod('custom');
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPeriod('custom');
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Loan Status</InputLabel>
                <Select
                  value={loanStatus}
                  onChange={(e) => setLoanStatus(e.target.value)}
                  label="Loan Status"
                >
                  <MenuItem value="all">All Loans</MenuItem>
                  <MenuItem value="active">Active Loans</MenuItem>
                  <MenuItem value="pending">Pending Loans</MenuItem>
                  <MenuItem value="overdue">Overdue Loans</MenuItem>
                  <MenuItem value="closed">Closed Loans</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Statistics */}
          {reportData && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Customers"
                  value={reportData.total_customers}
                  icon={<PeopleIcon />}
                  color="#1976d2"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Loans"
                  value={reportData.total_loans}
                  icon={<LoanIcon />}
                  color="#2e7d32"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Disbursed"
                  value={reportData.total_disbursed}
                  icon={<TrendingUpIcon />}
                  color="#ed6c02"
                  format="currency"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Outstanding Amount"
                  value={reportData.total_outstanding}
                  icon={<WarningIcon />}
                  color="#d32f2f"
                  format="currency"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Collected"
                  value={reportData.total_payments}
                  icon={<PaymentIcon />}
                  color="#2e7d32"
                  format="currency"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Interest Earned"
                  value={reportData.total_interest_collected}
                  icon={<TrendingUpIcon />}
                  color="#1976d2"
                  format="currency"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Overdue Loans"
                  value={reportData.overdue_loans}
                  icon={<WarningIcon />}
                  color="#d32f2f"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Closed Loans"
                  value={reportData.closed_loans}
                  icon={<LoanIcon />}
                  color="#757575"
                />
              </Grid>
            </Grid>
          )}

          {/* Charts Section */}
          {reportData && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Collections vs Disbursed
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <DynamicBarChart 
                        totalDisbursed={reportData.total_disbursed} 
                        totalCollected={reportData.total_payments} 
                        outstanding={reportData.total_outstanding} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Loan Status Breakdown
                    </Typography>
                    <Box sx={{ height: 300, maxWidth: 380, mx: 'auto' }}>
                      <DynamicDoughnutChart 
                        active={Math.max(0, reportData.total_loans - reportData.closed_loans)} 
                        closed={reportData.closed_loans} 
                        overdue={reportData.overdue_loans} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Detailed Reports */}
          <Card>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Loan Reports" />
              <Tab label="Payment Reports" />
              <Tab label="Overdue Analysis" />
              <Tab label="Collection Summary" />
            </Tabs>

            <CardContent>
              {/* Loan Reports Tab */}
              {activeTab === 0 && (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ref No</TableCell>
                        <TableCell>Borrower</TableCell>
                        <TableCell>Customer ID</TableCell>
                        <TableCell>Loan Amount</TableCell>
                        <TableCell>Outstanding</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Release Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loanReports.map((loan) => (
                        <TableRow key={loan.loan_id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {loan.borrower_ref_no || loan.ref_no}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1">
                              {loan.borrower_name || loan.full_name || loan.borrower_full_name || loan.fullName || loan.ref_no || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {loan.customer_id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(loan.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold" color="error.main">
                              {formatCurrency(loan.remaining_principal)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(mapStatusToLabel(loan.status), loan.days_overdue)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(loan.date_released)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Payment Reports Tab */}
              {activeTab === 1 && (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Payment Date</TableCell>
                        <TableCell>Ref No</TableCell>
                        <TableCell>Borrower</TableCell>
                        <TableCell>Principal</TableCell>
                        <TableCell>Interest</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Method</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentReports.map((payment) => (
                        <TableRow key={payment.payment_id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(payment.payment_date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {payment.borrower_ref_no || payment.loan_ref_no}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1">
                              {payment.borrower_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold" color="primary">
                              {formatCurrency(payment.actual_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold" color="success.main">
                              {formatCurrency(payment.interest_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency((payment.actual_amount || 0) + (payment.interest_amount || 0) - (payment.reduction_amount || 0))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={payment.payment_mode || payment.payment_method} size="small" variant="outlined" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Overdue Analysis Tab */}
              {activeTab === 2 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Overdue Analysis Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed overdue analysis coming soon
                  </Typography>
                </Box>
              )}

              {/* Collection Summary Tab */}
              {activeTab === 3 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Collection Summary Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Collection summary analysis coming soon
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default Reports;
