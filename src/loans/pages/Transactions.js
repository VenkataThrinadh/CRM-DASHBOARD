import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
import { apiService } from '../services/apiService';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const transactionTypes = [
    { value: '', label: 'All Types' },
    { value: 'loan', label: 'Loan Disbursement' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'expense', label: 'Expense' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit,
        type: filters.type || undefined,
        status: filters.status || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        search: filters.search || undefined,
      };
      const response = await apiService.get('/loans/transactions', { params });
      if (!response || !response.success) {
        throw new Error(response && response.message ? response.message : 'Failed to fetch transactions');
      }
      const rows = (response.data && Array.isArray(response.data.data)) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
      const normalized = (rows || []).map(t => ({
        id: t.transaction_id,
        transaction_id: String(t.transaction_id || ''),
        type: t.transaction_type || 'deposit',
        description: t.description || '',
        amount: Number(t.amount || 0),
        balance_before: Number(t.balance_before || 0),
        balance_after: Number(t.balance_after || 0),
        date: t.transaction_date || t.date || new Date().toISOString(),
        reference_id: t.reference_id || t.loan_ref_no || undefined,
        customer_name: t.customer_name || undefined,
        loan_id: t.loan_id ? String(t.loan_id) : undefined,
        status: t.status || 'completed',
      }));
      setTransactions(normalized);
    } catch (err) {
      // Show helpful message returned by API when possible
      const msg = err?.message || 'Failed to fetch transactions';
      // eslint-disable-next-line no-console
      console.error('Transactions fetch error:', err);
      setError(msg);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    fetchTransactions();
  };

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast.info('No transactions to export');
      return;
    }
    const csvRows = [];
    csvRows.push(['Transaction ID', 'Date', 'Type', 'Description', 'Customer', 'Amount', 'Balance After', 'Status', 'Reference'].join(','));
    transactions.forEach(t => {
      csvRows.push([t.transaction_id, new Date(t.date).toLocaleString(), t.type, JSON.stringify(t.description || ''), t.customer_name || '', t.amount, t.balance_after, t.status, t.reference_id || ''].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully');
  };

  const getTransactionTypeLabel = (type) => {
    const typeObj = transactionTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAmountColor = (type) => {
    if (type === 'deposit') {
      return 'success.main';
    } else {
      return 'error.main';
    }
  };

  const formatAmount = (type, amount) => {
    if (type === 'deposit') {
      return `+₹${Math.abs(amount).toLocaleString()}`;
    } else {
      return `-₹${Math.abs(amount).toLocaleString()}`;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const typeMatch = !filters.type || t.type === filters.type;
    const statusMatch = !filters.status || t.status === filters.status;
    const searchMatch = !filters.search || 
      t.transaction_id.toLowerCase().includes(filters.search.toLowerCase()) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(filters.search.toLowerCase())) ||
      t.description.toLowerCase().includes(filters.search.toLowerCase());
    return typeMatch && statusMatch && searchMatch;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Transaction History
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTransactions}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Transaction Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  {transactionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
          
          <Box mt={2}>
            <TextField
              fullWidth
              label="Search by Transaction ID, Customer Name, or Description"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Balance After</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {transaction.transaction_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateDDMMYYYY(transaction.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTransactionTypeLabel(transaction.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {transaction.customer_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={getAmountColor(transaction.type)}
                      >
                        {formatAmount(transaction.type, transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        ₹{transaction.balance_after.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={getStatusColor(transaction.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {transaction.reference_id || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No transactions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Transactions;
