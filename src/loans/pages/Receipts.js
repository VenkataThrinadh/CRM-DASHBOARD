import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
import { PaymentService } from '../services/paymentService';
import { getApiBaseUrl } from '../../main-dashboard/config/environment';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Split-view state
  const [splitViewReceipt, setSplitViewReceipt] = useState(null);

  const applyFilters = useCallback(() => {
    let filtered = receipts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt =>
        receipt.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.borrower_ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.receipt_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filters
    if (dateFrom) {
      filtered = filtered.filter(receipt =>
        new Date(receipt.payment_date) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(receipt =>
        new Date(receipt.payment_date) <= new Date(dateTo)
      );
    }

    // Payment mode filter
    if (paymentMode) {
      filtered = filtered.filter(receipt =>
        receipt.payment_mode?.toLowerCase() === paymentMode.toLowerCase()
      );
    }

    // Amount filters
    if (minAmount) {
      const min = parseFloat(minAmount);
      filtered = filtered.filter(receipt => {
        const total = (receipt.actual_amount || 0) + (receipt.interest_amount || 0) - (receipt.reduction_amount || 0);
        return total >= min;
      });
    }

    if (maxAmount) {
      const max = parseFloat(maxAmount);
      filtered = filtered.filter(receipt => {
        const total = (receipt.actual_amount || 0) + (receipt.interest_amount || 0) - (receipt.reduction_amount || 0);
        return total <= max;
      });
    }

    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, dateFrom, dateTo, paymentMode, minAmount, maxAmount]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // fetch receipts when page/rowsPerPage changes
  useEffect(() => {
    fetchReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchTerm]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const resp = await PaymentService.getPayments({ search: searchTerm || undefined, page: page + 1, limit: rowsPerPage });
      // resp can be { data: rows, pagination: {} } or array
      let rows = [];
      if (Array.isArray(resp)) rows = resp;
      else if (resp && Array.isArray(resp.data)) rows = resp.data;
      else if (resp && Array.isArray(resp.rows)) rows = resp.rows;
      else rows = [];

      setReceipts(rows);
      // set pagination if present
      if (resp && typeof resp === 'object' && resp.pagination) {
        setPagination({ totalItems: resp.pagination.totalItems || 0, totalPages: resp.pagination.totalPages || 0 });
      } else if (Array.isArray(rows)) {
        setPagination({ totalItems: rows.length, totalPages: Math.ceil(rows.length / rowsPerPage) });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch receipts:', err);
    } finally {
      setLoading(false);
    }
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

  const getPaymentModeColor = (mode) => {
    const lowerMode = mode?.toLowerCase() || '';
    if (lowerMode.includes('cash')) return 'success';
    if (lowerMode.includes('bank') || lowerMode.includes('transfer')) return 'primary';
    if (lowerMode.includes('cheque')) return 'warning';
    return 'default';
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewReceipt = async (receipt) => {
    try {
      setLoading(true);
      const data = await PaymentService.getPaymentById(receipt.payment_id);
      // api returns the object directly in many cases
      const payment = data || receipt;
      setSelectedReceipt(payment);
      setViewDialogOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch receipt details');
      // eslint-disable-next-line no-console
      console.error('View receipt error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReceiptForSplitView = (receipt) => {
    setSplitViewReceipt(receipt);
  };

  const handlePrintReceipt = async (receipt) => {
    try {
      setLoading(true);
      // open receipt PDF in new tab
      const API_BASE_URL = getApiBaseUrl();
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/loans/payments/${receipt.payment_id}/receipt-pdf`, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (newWindow) newWindow.focus();
      toast.success(`Opened receipt ${receipt.receipt_no} in a new tab`);
    } catch (err) {
      toast.error(err.message || 'Failed to open receipt for printing');
      // eslint-disable-next-line no-console
      console.error('Print receipt error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (receipt) => {
    try {
      setLoading(true);
      await PaymentService.downloadReceiptPDF(receipt.payment_id);
      toast.success(`Downloaded receipt ${receipt.receipt_no}`);
    } catch (err) {
      toast.error(err.message || 'Failed to download receipt');
      // eslint-disable-next-line no-console
      console.error('Download receipt error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPaymentMode('');
    setMinAmount('');
    setMaxAmount('');
    setFilteredReceipts(receipts);
    setFilterDialogOpen(false);
  };

  const num = (v) => Number.isFinite(v) ? v : Number(v ?? 0) || 0;

  const getReceiptTotal = (receipt) => {
    return num(receipt.actual_amount) + num(receipt.interest_amount) - num(receipt.reduction_amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      {/* Left Side - Receipts List */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Payment Receipts
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and manage payment receipts
          </Typography>
        </Box>

        {/* Search and Filter Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by customer name, loan reference, or receipt number..."
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setFilterDialogOpen(true)}
                  >
                    Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {filteredReceipts.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Receipts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(
                    filteredReceipts.reduce((sum, receipt) => sum + getReceiptTotal(receipt), 0)
                  )}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Amount
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(
                    filteredReceipts.reduce((sum, receipt) => sum + num(receipt.reduction_amount), 0)
                  )}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Reductions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {formatCurrency(
                    filteredReceipts.reduce((sum, receipt) => sum + num(receipt.interest_amount), 0)
                  )}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Interest
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Receipts Table */}
        <Card>
          <CardContent>
              {filteredReceipts.length === 0 ? (
              <Alert severity="info">
                No receipts found matching your criteria.
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell>Receipt No.</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Loan Ref</TableCell>
                      <TableCell align="right">Principal</TableCell>
                      <TableCell align="right">Interest</TableCell>
                      <TableCell align="right">Reduction</TableCell>
                      <TableCell align="right">Total Paid</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredReceipts.map((receipt) => (
                      <TableRow
                        key={receipt.payment_id}
                        hover
                        onClick={() => handleSelectReceiptForSplitView(receipt)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: splitViewReceipt?.payment_id === receipt.payment_id ? 'action.selected' : 'inherit',
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {receipt.receipt_no}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(receipt.payment_date)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {receipt.borrower_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2" color="primary">
                              {receipt.borrower_ref_no || receipt.loan_ref_no}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(receipt.actual_amount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(receipt.interest_amount)}
                        </TableCell>
                        <TableCell align="right">
                          {receipt.reduction_amount > 0 ? (
                            <Typography color="success.main">
                              -{formatCurrency(receipt.reduction_amount)}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(getReceiptTotal(receipt))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={receipt.payment_mode}
                            size="small"
                            color={getPaymentModeColor(receipt.payment_mode)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewReceipt(receipt);
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintReceipt(receipt);
                                }}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadReceipt(receipt);
                                }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
          <Box sx={{ px: 2, pb: 2 }}>
            <TablePagination
              component="div"
              count={pagination.totalItems || filteredReceipts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </Card>
      </Box>

      {/* Right Side - Receipt Details Panel (Split View) */}
      {splitViewReceipt && (
        <Box
          sx={{
            width: { xs: '100%', md: 380 },
            maxWidth: 380,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Card sx={{ position: 'sticky', top: 0 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Receipt Details
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setSplitViewReceipt(null)}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {/* Receipt Information */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Receipt Number</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {splitViewReceipt.receipt_no}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Payment Date</Typography>
                  <Typography variant="body2">
                    {formatDate(splitViewReceipt.payment_date)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Customer Name</Typography>
                  <Typography variant="body2">
                    {splitViewReceipt.borrower_name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Loan Reference</Typography>
                    <Typography variant="body2" color="primary" fontWeight="bold">
                    {splitViewReceipt.borrower_ref_no || splitViewReceipt.loan_ref_no}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="textSecondary">Principal Amount</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatCurrency(splitViewReceipt.actual_amount)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Interest Amount</Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {formatCurrency(splitViewReceipt.interest_amount)}
                  </Typography>
                </Box>

                {splitViewReceipt.reduction_amount > 0 && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">Reduction Amount</Typography>
                    <Typography variant="body1" fontWeight="bold" color="warning.main">
                      -{formatCurrency(splitViewReceipt.reduction_amount)}
                    </Typography>
                  </Box>
                )}

                <Divider />

                <Box sx={{ backgroundColor: 'primary.light', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary">Total Paid</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(getReceiptTotal(splitViewReceipt))}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary">Payment Mode</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={splitViewReceipt.payment_mode}
                      size="small"
                      color={getPaymentModeColor(splitViewReceipt.payment_mode)}
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewReceipt(splitViewReceipt)}
                  >
                    View Full Details
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PrintIcon />}
                    onClick={() => handlePrintReceipt(splitViewReceipt)}
                  >
                    Print
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadReceipt(splitViewReceipt)}
                  >
                    Download
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Receipts</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  label="Payment Mode"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Min Amount"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Max Amount"
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={clearFilters} color="warning">Clear All</Button>
          <Button onClick={() => setFilterDialogOpen(false)} variant="contained">Apply Filters</Button>
        </DialogActions>
      </Dialog>

      {/* View Receipt Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Receipt Details</DialogTitle>
        <DialogContent>
          {selectedReceipt && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Receipt Number</Typography>
                    <Typography variant="body1" fontWeight="medium">{selectedReceipt.receipt_no}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Payment Date</Typography>
                    <Typography variant="body1">{formatDate(selectedReceipt.payment_date)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Customer Name</Typography>
                    <Typography variant="body1">{selectedReceipt.borrower_name}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Loan Reference</Typography>
                    <Typography variant="body1" color="primary">{selectedReceipt.borrower_ref_no || selectedReceipt.loan_ref_no}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Principal Amount</Typography>
                    <Typography variant="body1">{formatCurrency(selectedReceipt.actual_amount)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Interest Amount</Typography>
                    <Typography variant="body1">{formatCurrency(selectedReceipt.interest_amount)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Reduction Amount</Typography>
                    <Typography variant="body1" color="success.main">
                      {selectedReceipt.reduction_amount > 0 ?
                        `-${formatCurrency(selectedReceipt.reduction_amount)}` :
                        'No reduction'
                      }
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Total Paid</Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {formatCurrency(getReceiptTotal(selectedReceipt))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">Payment Mode</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={selectedReceipt.payment_mode}
                        color={getPaymentModeColor(selectedReceipt.payment_mode)}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedReceipt && (
            <>
              <Button
                startIcon={<PrintIcon />}
                onClick={() => handlePrintReceipt(selectedReceipt)}
              >
                Print
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadReceipt(selectedReceipt)}
              >
                Download
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Receipts;
