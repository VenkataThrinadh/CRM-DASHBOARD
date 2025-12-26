import React, { useState, useEffect } from 'react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  TablePagination,
  InputAdornment,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Calculate as CalculateIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { PaymentService } from '../services/paymentService';

const initialFormData = {
  loan_id: 0,
  actual_amount: 0,
  interest_amount: 0,
  reduction_amount: 0,
  payment_mode: 'cash',
  notes: '',
  close_loan: false,
};

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online Payment' },
];

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [openOverdueDialog, setOpenOverdueDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [calculatedInterest, setCalculatedInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [paymentResult, setPaymentResult] = useState(null);
  const [overdueCalculation, setOverdueCalculation] = useState(null);
  const [calculatingOverdue, setCalculatingOverdue] = useState(false);

  useEffect(() => {
    calculatePayment();
  }, [formData.actual_amount, formData.interest_amount, formData.reduction_amount]);

  // fetch payments when page / rowsPerPage / searchTerm changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page, rowsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await PaymentService.getPayments({
        search: searchTerm || undefined,
        page: page + 1,
        limit: rowsPerPage,
      });

      let rows = [];
      if (Array.isArray(resp)) rows = resp;
      else if (resp && Array.isArray(resp.data)) rows = resp.data;
      else if (resp && Array.isArray(resp.rows)) rows = resp.rows;
      else if (resp && typeof resp === 'object' && resp !== null) {
        // sometimes backend returns an object with data & pagination
        rows = resp.data || resp.items || [];
      }

      setPayments(rows);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Fetch payments error:', err);
      setError(err.message || 'Failed to fetch payments');
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

  const searchLoansForPayment = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const rows = await PaymentService.searchLoansForPayment(query);

      const normalized = (rows || []).map(r => {
        // Use borrower's reference number as canonical ref shown to users
        const ref = r.borrower_ref_no || r.ref_no || '';
        const borrowerName = r.borrower_name || r.full_name || r.fullname || '';
        const customerId = r.customer_id || r.borrower_customer_id || r.customerId || '';
        const remainingPrincipal = Number(r.remaining_principal ?? r.remaining_principal_amount ?? r.remainingPrincipal ?? 0) || 0;
        const remainingInterest = Number(r.remaining_interest ?? (r.outstanding ? (Number(r.outstanding) - remainingPrincipal) : r.remainingInterest) ) || 0;
        const daysOverdue = Number(r.days_overdue ?? r.days_since_last_payment ?? r.daysSinceLastPayment ?? 0) || 0;

        return {
          ...r,
          loan_id: r.loan_id || r.loanId || r.id,
          ref_no: ref,
          borrower_name: borrowerName,
          customer_id: customerId,
          remaining_principal: remainingPrincipal,
          remaining_interest: remainingInterest,
          days_overdue: daysOverdue,
          active_interest_rate: Number(r.active_interest_rate ?? r.interest_rate ?? r.activeInterestRate ?? 0) || 0,
        };
      });

      setSearchResults(normalized);

      const exactMatch = normalized.find(r => (r.ref_no && String(r.ref_no).toLowerCase() === String(query).toLowerCase()));
      if (exactMatch) handleLoanSelect(exactMatch);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Loan search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const num = (v) => Number.isFinite(v) ? v : Number(v ?? 0) || 0;

  const calculatePayment = () => {
    const total = num(formData.actual_amount) + num(formData.interest_amount) - num(formData.reduction_amount);
    setTotalPayment(Math.max(0, Math.round(total)));
  };

  const calculateInterest = (loan) => {
    if (!loan) return 0;
    
    const remainingPrincipal = Math.max(0, num(loan.amount) - 0);
    const dailyRate = (num(loan.active_interest_rate) / 100) / 365;
    const daysOverdue = num(loan.days_overdue);
    
    const interest = remainingPrincipal * dailyRate * Math.max(15, daysOverdue);
    return Math.round(Math.max(0, interest));
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedLoan(null);
    setCalculatedInterest(0);
    setTotalPayment(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedLoan(null);
    setCalculatedInterest(0);
    setTotalPayment(0);
  };

  const handleInputChange = (field) => (event) => {
    const value = ['actual_amount', 'interest_amount', 'reduction_amount'].includes(field)
      ? parseFloat(event.target.value) || 0
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLoanSelect = (loan) => {
    setSelectedLoan(loan);
    if (loan) {
      const interest = calculateInterest(loan);
      setCalculatedInterest(interest);
      setFormData(prev => ({
        ...prev,
        loan_id: loan.loan_id,
        interest_amount: interest,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        loan_id: 0,
        interest_amount: 0,
      }));
      setCalculatedInterest(0);
    }
  };

  const handleCalculateInterest = () => {
    if (selectedLoan) {
      const interest = calculateInterest(selectedLoan);
      setCalculatedInterest(interest);
      setFormData(prev => ({
        ...prev,
        interest_amount: interest,
      }));
    }
  };

  const handleCalculateOverdue = () => {
    if (!selectedLoan) {
      toast.error('Please select a loan first');
      return;
    }

    (async () => {
      setCalculatingOverdue(true);
      try {
        const resp = await PaymentService.calculateOverdueInterest(selectedLoan.loan_id);
        setOverdueCalculation(resp);
        setOpenOverdueDialog(true);
      } catch (err) {
        toast.error(err.message || 'Failed to calculate overdue interest');
        // eslint-disable-next-line no-console
        console.error('Calculate overdue error:', err);
      } finally {
        setCalculatingOverdue(false);
      }
    })();
  };

  const handleCloseLoanToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      close_loan: checked,
    }));

    if (checked && selectedLoan) {
      const remainingPrincipal = Math.max(0, selectedLoan.amount - 0);
      const remainingInterest = calculateInterest(selectedLoan);
      
      setFormData(prev => ({
        ...prev,
        actual_amount: remainingPrincipal,
        interest_amount: remainingInterest,
        reduction_amount: 0,
      }));
      
      toast.info('Amounts auto-filled for loan closure');
    }
  };

  const handleAmountReduction = () => {
    const currentTotal = num(formData.actual_amount) + num(formData.interest_amount);
    if (currentTotal > 0) {
      toast.info('Enter the amount to reduce for trusted customer. This will reduce the total payment amount.');
    } else {
      toast.warning('Please enter interest and/or principal amount first.');
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.loan_id) {
      errors.loan_id = 'Loan selection is required';
    }

    if (!formData.actual_amount || formData.actual_amount <= 0) {
      errors.actual_amount = 'Valid principal amount is required';
    }

    if (formData.interest_amount < 0) {
      errors.interest_amount = 'Interest amount cannot be negative';
    }

    if (formData.reduction_amount < 0) {
      errors.reduction_amount = 'Reduction amount cannot be negative';
    }

    if (!formData.payment_mode) {
      errors.payment_mode = 'Payment method is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const today = new Date().toISOString().split('T')[0];
      
      const newPayment = {
        payment_id: payments.length + 1,
        loan_id: formData.loan_id,
        borrower_id: selectedLoan?.borrower_id || 1,
        payment_date: today,
        actual_amount: formData.actual_amount,
        interest_amount: formData.interest_amount,
        reduction_amount: formData.reduction_amount,
        remaining_interest_after_payment: Math.max(0, formData.interest_amount - formData.reduction_amount),
        payment_mode: formData.payment_mode,
        receipt_no: `RCPT${today.replace(/-/g, '')}${String(payments.length + 1).padStart(4, '0')}`,
        date_created: new Date().toISOString(),
        loan_ref_no: selectedLoan?.ref_no,
        borrower_name: selectedLoan?.borrower_name,
        customer_id: selectedLoan?.customer_id,
      };

      // if backend available, call createPayment
      (async () => {
        try {
          const payload = {
            loan_id: formData.loan_id,
            borrower_id: selectedLoan?.borrower_id || null,
            actual_amount: formData.actual_amount,
            interest_amount: formData.interest_amount,
            reduction_amount: formData.reduction_amount,
            payment_date: today,
            payment_mode: formData.payment_mode,
            close_loan: formData.close_loan,
            notes: formData.notes,
          };

          const resp = await PaymentService.createPayment(payload);

          // Normalize response (backend may return different shapes)
          const raw = resp?.payment_details || resp || {};

          const normalizedPaymentDetails = {
            payment_id: raw.payment_id || raw.id || null,
            receipt_no: raw.receipt_no || raw.receipt || raw.receiptId || null,
            payment_date: raw.payment_date || raw.paymentDate || raw.date || today,
            payment_method: raw.payment_method || raw.paymentMode || raw.payment_mode || formData.payment_mode,
            principal_amount: Number(raw.principal_amount ?? raw.actual_amount ?? 0),
            interest_amount: Number(raw.interest_amount ?? 0),
            reduction_amount: Number(raw.reduction_amount ?? 0),
            total_amount_paid: Number(raw.total_amount_paid ?? raw.total_paid ?? (Number(raw.principal_amount ?? raw.actual_amount ?? 0) + Number(raw.interest_amount ?? 0) - Number(raw.reduction_amount ?? 0)))
          };

          // loan ref and customer info - prefer borrower ref and borrower name
          normalizedPaymentDetails.loan_ref_no = raw.loan_ref_no || raw.borrower_ref_no || selectedLoan?.ref_no || '';
          normalizedPaymentDetails.customer_name = raw.customer_name || raw.borrower_name || selectedLoan?.borrower_name || '';
          normalizedPaymentDetails.loan_status = raw.loan_status || (formData.close_loan ? 'Closed' : 'Active');

          // Remaining & outstanding values may be on root resp
          const remaining_principal = Number(resp?.remaining_principal ?? resp?.remainingPrincipal ?? raw.remaining_principal ?? 0) || 0;
          const remaining_interest = Number(resp?.remaining_interest ?? resp?.remainingInterest ?? raw.remaining_interest ?? 0) || 0;
          const total_outstanding = Number(resp?.total_outstanding ?? resp?.totalOutstanding ?? raw.total_outstanding ?? (remaining_principal + remaining_interest)) || (remaining_principal + remaining_interest);

          // Append to payments list (map to table fields expected)
          const rowForTable = {
            payment_id: normalizedPaymentDetails.payment_id,
            payment_date: normalizedPaymentDetails.payment_date,
            loan_ref_no: normalizedPaymentDetails.loan_ref_no,
            borrower_name: normalizedPaymentDetails.customer_name,
            customer_id: raw.customer_id || raw.borrower_customer_id || selectedLoan?.customer_id || '',
            actual_amount: normalizedPaymentDetails.principal_amount,
            interest_amount: normalizedPaymentDetails.interest_amount,
            reduction_amount: normalizedPaymentDetails.reduction_amount,
            payment_mode: normalizedPaymentDetails.payment_method,
            receipt_no: normalizedPaymentDetails.receipt_no,
          };

          setPayments(prev => [ ...(prev || []), rowForTable ]);

          setPaymentResult({
            payment_details: normalizedPaymentDetails,
            remaining_principal,
            remaining_interest,
            total_outstanding,
            wallet_balance: resp?.wallet_balance ?? null,
          });

          handleCloseDialog();
          setOpenSuccessDialog(true);
          fetchData();
          toast.success(`Payment recorded successfully! Receipt: ${normalizedPaymentDetails.receipt_no || ''}`);
        } catch (err) {
          toast.error(err.message || 'Failed to record payment');
          // eslint-disable-next-line no-console
          console.error('Save payment error:', err);
        } finally {
          setSubmitting(false);
        }
      })();
    } catch (err) {
      toast.error('Failed to record payment');
    } finally {
      // setSubmitting will be handled in async block above
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setSelectedPayment(null);
  };

  const handleDownloadPDFReceipt = (payment) => {
    (async () => {
      try {
        await PaymentService.downloadReceiptPDF(payment.payment_id);
        toast.success('PDF receipt downloaded successfully');
      } catch (err) {
        toast.error(err.message || 'Failed to download PDF receipt');
        // eslint-disable-next-line no-console
        console.error('Download PDF receipt error:', err);
      }
    })();
  };

  const filteredPayments = payments.filter(payment =>
    payment.loan_ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customer_id?.includes(searchTerm) ||
    payment.payment_mode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPayments = filteredPayments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          Payments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{ borderRadius: 2 }}
        >
          Record Payment
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search payments by loan reference, borrower name, customer ID, or payment method..."
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
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Loan Ref</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Principal</TableCell>
                  <TableCell>Interest</TableCell>
                  <TableCell>Reduction</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPayments.map((payment) => (
                  <TableRow key={payment.payment_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDateDDMMYYYY(payment.payment_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {payment.borrower_ref_no || payment.loan_ref_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {payment.borrower_name || payment.borrower_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {payment.borrower_customer_id || payment.customer_id}
                        </Typography>
                      </Box>
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
                      {payment.reduction_amount > 0 ? (
                        <Typography variant="body1" fontWeight="bold" color="error.main">
                          -{formatCurrency(payment.reduction_amount)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(num(payment.actual_amount) + num(payment.interest_amount) - num(payment.reduction_amount))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={paymentMethods.find(m => m.value === payment.payment_mode)?.label || payment.payment_mode}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <span>
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleViewDetails(payment)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Download Receipt">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownloadPDFReceipt(payment)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredPayments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Record New Payment
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Loan Selection */}
            <Grid item xs={12}>
              <Autocomplete
                options={searchResults}
                getOptionLabel={(option) => `${option.ref_no} - ${option.borrower_name}`}
                value={selectedLoan}
                onChange={(event, newValue) => handleLoanSelect(newValue)}
                onInputChange={(event, newInputValue) => {
                  searchLoansForPayment(newInputValue);
                }}
                loading={searchLoading}
                filterOptions={(x) => x}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Loan (Reference No, Customer Name, or ID)"
                    placeholder="Type to search loans..."
                    error={!!formErrors.loan_id}
                    helperText={formErrors.loan_id || "Search by reference number, customer name, or customer ID"}
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  // props may contain a `key` property; do not spread it into the DOM
                  const { key, ...rest } = props;
                  return (
                    <Box component="li" key={key} {...rest}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1" fontWeight="medium">
                          {option.ref_no} - {option.borrower_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status: Active | Outstanding: {formatCurrency((option.remaining_principal || 0) + (option.remaining_interest || 0))} 
                          | Days Overdue: {option.days_overdue || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Customer ID: {option.customer_id}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                noOptionsText="Type to search for loans..."
              />
            </Grid>

            {/* Loan Details */}
            {selectedLoan && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Loan Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Principal Outstanding
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(selectedLoan.remaining_principal)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Interest Outstanding
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(selectedLoan.remaining_interest)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Interest Rate
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {selectedLoan.active_interest_rate}% p.a.
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Days Overdue
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color={selectedLoan.days_overdue > 30 ? 'error.main' : 'success.main'}>
                          {selectedLoan.days_overdue}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Payment Details */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Principal Amount"
                type="number"
                value={formData.actual_amount}
                onChange={handleInputChange('actual_amount')}
                error={!!formErrors.actual_amount}
                helperText={formErrors.actual_amount}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Interest Amount"
                  type="number"
                  value={formData.interest_amount}
                  onChange={handleInputChange('interest_amount')}
                  error={!!formErrors.interest_amount}
                  helperText={formErrors.interest_amount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
                <Tooltip title="Calculate Interest">
                  <span>
                    <IconButton
                      onClick={handleCalculateInterest}
                      disabled={!selectedLoan}
                      color="primary"
                    >
                      <CalculateIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Reduction Amount"
                  type="number"
                  value={formData.reduction_amount}
                  onChange={handleInputChange('reduction_amount')}
                  error={!!formErrors.reduction_amount}
                  helperText={formErrors.reduction_amount || "Interest reduction/waiver for trusted customers"}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
                <Tooltip title="Reduce Amount">
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleAmountReduction}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    Reduce
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.payment_mode}>
                <InputLabel>Payment Method *</InputLabel>
                <Select
                  value={formData.payment_mode}
                  onChange={handleSelectChange('payment_mode')}
                  label="Payment Method *"
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Total Payment */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" align="center">
                    Total Payment: {formatCurrency(totalPayment)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Close Loan Feature */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ backgroundColor: formData.close_loan ? 'warning.light' : 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      type="checkbox"
                      id="close_loan_checkbox"
                      checked={formData.close_loan}
                      onChange={(e) => handleCloseLoanToggle(e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <label htmlFor="close_loan_checkbox" style={{ cursor: 'pointer', flex: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        Close this loan completely
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Check this option to automatically fill all remaining amounts and close the loan
                      </Typography>
                    </label>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Optional payment notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCalculateOverdue}
            variant="outlined"
            color="warning"
            disabled={!selectedLoan || calculatingOverdue}
            startIcon={calculatingOverdue ? <CircularProgress size={16} /> : <CalculateIcon />}
          >
            {calculatingOverdue ? 'Calculating...' : 'Calculate Overdue'}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={<PaymentIcon />}
          >
            {submitting ? <CircularProgress size={20} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={handleCloseDetailsDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Payment Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Payment Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Payment ID" 
                          secondary={selectedPayment.payment_id} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Reference Number" 
                          secondary={selectedPayment.loan_ref_no} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Payment Date" 
                          secondary={formatDateDDMMYYYY(selectedPayment.payment_date)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Payment Method" 
                          secondary={paymentMethods.find(m => m.value === selectedPayment.payment_mode)?.label || selectedPayment.payment_mode} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Amount Breakdown
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Principal Amount" 
                          secondary={formatCurrency(selectedPayment.actual_amount)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Interest Amount" 
                          secondary={formatCurrency(selectedPayment.interest_amount)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Reduction Amount" 
                          secondary={formatCurrency(selectedPayment.reduction_amount)} 
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold">
                              Total Payment
                            </Typography>
                          }
                          secondary={
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              {formatCurrency(num(selectedPayment.actual_amount) + num(selectedPayment.interest_amount) - num(selectedPayment.reduction_amount))}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
          <Button
            variant="contained"
            onClick={() => selectedPayment && handleDownloadPDFReceipt(selectedPayment)}
            startIcon={<DownloadIcon />}
          >
            Download Receipt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Success Modal */}
      <Dialog
        open={openSuccessDialog}
        onClose={() => setOpenSuccessDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'success.main', color: 'success.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon />
            Payment Successful
          </Box>
        </DialogTitle>
        <DialogContent>
          {paymentResult && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  Payment Recorded Successfully!
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaymentIcon /> Payment Details
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Receipt No" 
                            secondary={
                              <Typography variant="body1" fontWeight="bold" color="primary">
                                {paymentResult.payment_details?.receipt_no}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Payment Date" 
                            secondary={paymentResult.payment_details?.payment_date}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Payment Method" 
                            secondary={paymentResult.payment_details?.payment_method}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Principal Amount" 
                            secondary={
                              <Typography color="success.main" fontWeight="bold">
                                {formatCurrency(paymentResult.payment_details?.principal_amount || 0)}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Interest Amount" 
                            secondary={
                              <Typography color="info.main" fontWeight="bold">
                                {formatCurrency(paymentResult.payment_details?.interest_amount || 0)}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {paymentResult.payment_details?.reduction_amount > 0 && (
                          <ListItem>
                            <ListItemText 
                              primary="Reduction" 
                              secondary={
                                <Typography color="warning.main" fontWeight="bold">
                                  -{formatCurrency(paymentResult.payment_details?.reduction_amount || 0)}
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}
                        <Divider />
                        <ListItem>
                          <ListItemText 
                            primary="Total Paid" 
                            secondary={
                              <Typography variant="h6" color="primary" fontWeight="bold">
                                {formatCurrency(paymentResult.payment_details?.total_amount_paid || 0)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderColor: 'info.main' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoIcon /> Loan Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Loan Ref No" 
                            secondary={paymentResult.payment_details?.loan_ref_no}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Customer" 
                            secondary={paymentResult.payment_details?.customer_name}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Loan Status" 
                            secondary={
                              <Chip 
                                label={paymentResult.payment_details?.loan_status}
                                color={paymentResult.payment_details?.loan_status === 'Closed' ? 'success' : 'primary'}
                                size="small"
                              />
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Remaining Principal" 
                            secondary={formatCurrency(paymentResult.remaining_principal || 0)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Remaining Interest" 
                            secondary={formatCurrency(paymentResult.remaining_interest || 0)}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText 
                            primary="Total Outstanding" 
                            secondary={
                              <Typography variant="h6" fontWeight="bold">
                                {formatCurrency(paymentResult.total_outstanding || 0)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSuccessDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (paymentResult?.payment_details) {
                handleDownloadPDFReceipt({ payment_id: paymentResult.payment_details.payment_id });
              }
            }}
            startIcon={<DownloadIcon />}
          >
            Download Receipt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Calculate Overdue Interest Modal */}
      <Dialog
        open={openOverdueDialog}
        onClose={() => setOpenOverdueDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'warning.main', color: 'warning.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateIcon />
            Overdue Interest Calculation
          </Box>
        </DialogTitle>
        <DialogContent>
          {overdueCalculation && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Interest Calculation Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Remaining Principal
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {formatCurrency(overdueCalculation.remaining_principal)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Interest Rate
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {overdueCalculation.interest_rate}% p.a.
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Overdue Days
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="error.main">
                            {overdueCalculation.overdue_days}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Daily Interest
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {formatCurrency(overdueCalculation.daily_interest)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Current Interest
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="info.main">
                            {formatCurrency(overdueCalculation.current_interest)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Total Overdue Interest
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="error.main">
                            {formatCurrency(overdueCalculation.total_overdue_interest)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  This calculation shows the real-time overdue interest based on the current date and loan details.
                  The actual payable interest may vary based on payment history and loan terms.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOverdueDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (overdueCalculation && selectedLoan) {
                setFormData(prev => ({
                  ...prev,
                  interest_amount: overdueCalculation.total_overdue_interest,
                }));
                setOpenOverdueDialog(false);
                toast.success('Interest amount updated with overdue calculation');
              }
            }}
          >
            Use This Amount
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments;
