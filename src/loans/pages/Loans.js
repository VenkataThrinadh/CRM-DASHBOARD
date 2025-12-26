import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  TablePagination,
  InputAdornment,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  FormHelperText,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  PhotoCamera as PhotoCameraIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  Percent as PercentIcon,
  Calculate as CalculateIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiService } from '../services/apiService';
import { LoanService } from '../services/loanService';
import { settingsAPI } from '../../main-dashboard/services/api';
import { formatCurrency, formatDateToIST, daysBetween, getCurrentDateFormats } from '../utils/dateTime';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
import GoldPhotoDisplay from '../components/GoldPhotoDisplay';


const initialFormData = {
  borrower_id: 0,
  lplan_id: 0,
  ltype_id: 0,
  amount: 0,
  purpose: '',
  loan_release_date: new Date().toISOString().split('T')[0],
  interest_start_date: (() => { const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; })(),
  gross_weight: 0,
  net_weight: 0,
  gold_rate: 0,
  gold_details: '',
  eligible_amount: 0,
  release_immediately: false,
  gold_photo: null,
};

const loanStatusConfig = {
  1: { label: 'Pending', color: 'warning', icon: ScheduleIcon },
  2: { label: 'Sanctioned', color: 'success', icon: CheckCircleIcon },
  3: { label: 'Closed', color: 'default', icon: CancelIcon },
};

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [loanPlans, setLoanPlans] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loanStats, setLoanStats] = useState({});
  const [nextRefNo, setNextRefNo] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [sanctioning, setSanctioning] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const navigate = useNavigate();
  const [actionAnchor, setActionAnchor] = useState(null);
  const [actionLoan, setActionLoan] = useState(null);
  const [sanctionConfirmOpen, setSanctionConfirmOpen] = useState(false);
  const [loanToSanction, setLoanToSanction] = useState(null);
  const [overdueDialogOpen, setOverdueDialogOpen] = useState(false);
  const [overdueResult, setOverdueResult] = useState(null);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [overdueLoan, setOverdueLoan] = useState(null);

  const openActionMenu = (e, loan) => {
    setActionAnchor(e.currentTarget);
    setActionLoan(loan);
  };
  const closeActionMenu = () => {
    setActionAnchor(null);
    setActionLoan(null);
  };

  const handleViewDetails = () => {
    if (!actionLoan) return;
    navigate(`/loans-dashboard/loans/${actionLoan.loan_id}`);
    closeActionMenu();
  };
  const handlePaymentHistory = () => {
    if (!actionLoan) return;
    navigate(`/loans-dashboard/payments?loanId=${actionLoan.loan_id}&refNo=${encodeURIComponent(actionLoan.ref_no)}`);
    closeActionMenu();
  };
  const handleInterestDetails = () => {
    if (!actionLoan) return;
    navigate(`/loans-dashboard/loans/${actionLoan.loan_id}/interest`);
    closeActionMenu();
  };
  const handleCalculateOverdue = async () => {
    if (!actionLoan) return;
    setOverdueLoading(true);
    try {
      // backend route is namespaced under /loans
      const resp = await apiService.get(`/loans/payments/calculate-overdue/${actionLoan.loan_id}`);
      if (!resp || !resp.success) {
        throw new Error(resp && resp.message ? resp.message : 'Failed to calculate overdue');
      }
      // apiService wraps server response in { success, data }
      setOverdueResult(resp.data || resp);
      // Capture the loan that was used for this calculation so dialog can reference it
      setOverdueLoan(actionLoan);
      setOverdueDialogOpen(true);
    } catch (e) {
      toast.error(e.message || 'Failed to calculate overdue');
    } finally {
      setOverdueLoading(false);
      closeActionMenu();
    }
  };
  const handleDownloadReceipt = async () => {
    if (!actionLoan) return;
    // Close menu early to avoid UI blocking while we prepare
    closeActionMenu();
    try {
      toast.info('Preparing receipt...');

      // Fetch the most recent payment for this loan
      const paymentsResp = await apiService.get('/loans/payments', { params: { loan_id: actionLoan.loan_id, page: 1, limit: 1 } });
      let payments = [];
      if (paymentsResp && paymentsResp.success && paymentsResp.data) {
        payments = Array.isArray(paymentsResp.data) ? paymentsResp.data : (paymentsResp.data.data || []);
      }

      const payment = payments[0];
      if (!payment) {
        toast.error('No payments found for this loan');
        return;
      }

      // Try to fetch an existing receipt for that payment (if any)
      const receiptsResp = await apiService.get('/loans/receipts', { params: { payment_id: payment.payment_id } });
      let receipt = null;
      if (receiptsResp && receiptsResp.success && receiptsResp.data) {
        const arr = Array.isArray(receiptsResp.data) ? receiptsResp.data : (receiptsResp.data.data || []);
        receipt = arr[0] || null;
      }

      const borrowerName = actionLoan.full_name || actionLoan.customer_id || '';
      const refNo = actionLoan.borrower_ref_no || actionLoan.ref_no || '';
      const receiptNo = receipt?.receipt_no || `REC-${payment.payment_id || Date.now()}`;
      const paymentDate = payment.payment_date || payment.created_at || payment.date || '';
      const amount = payment.amount || payment.payment_amount || payment.paid_amount || 0;

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title><style>
        body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#222}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
        .title{font-size:20px;font-weight:700}
        .meta{font-size:14px}
        .table{width:100%;border-collapse:collapse;margin-top:10px}
        .table td{padding:10px;border:1px solid #ddd}
        .footer{margin-top:30px;font-size:13px}
      </style></head><body>
        <div class="header"><div><div class="title">Payment Receipt</div><div class="meta">Receipt No: ${receiptNo}</div></div><div style="text-align:right"><div class="meta">Ref: ${refNo}</div><div class="meta">${borrowerName}</div></div></div>
        <table class="table">
          <tr><td>Payment Date</td><td>${formatDateDDMMYYYY(paymentDate)}</td></tr>
          <tr><td>Amount</td><td>${formatCurrency(amount)}</td></tr>
          <tr><td>Payment Method</td><td>${payment.payment_method || payment.mode || payment.pay_mode || 'N/A'}</td></tr>
          <tr><td>Transaction ID</td><td>${payment.transaction_id || payment.txn_id || '-'}</td></tr>
        </table>
        <div class="footer">This is a system generated receipt. For any queries contact support.</div>
      </body></html>`;

      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (!win) {
        toast.error('Popup blocked. Please allow popups for this site.');
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { try { win.print(); } catch (e) { /* swallow */ } }, 500);

    } catch (err) {
      console.error('Download receipt error', err);
      toast.error(err.message || 'Failed to prepare receipt');
    }
  };

  const handleSanctionLoan = async () => {
    if (!actionLoan) return;
    setLoanToSanction(actionLoan);
    // Fetch current wallet balance to pre-populate dialog and validate
    (async () => {
      try {
        const res = await settingsAPI.getCurrentBalance();
        if (res && res.data && typeof res.data.current_balance !== 'undefined') {
          setCurrentBalance(Number(res.data.current_balance) || 0);
        } else {
          setCurrentBalance(null);
        }
      } catch (e) {
        // Don't block the dialog if balance fetch fails; still open dialog
        console.error('Failed to fetch balance for sanction dialog', e);
        setCurrentBalance(null);
      }
    })();
    setSanctionConfirmOpen(true);
    closeActionMenu();
  };

  const confirmSanctionLoan = async () => {
    if (!loanToSanction) return;
    
    try {
      setSanctioning(true);
      // Before sanctioning (releasing), fetch current balance to ensure sufficient funds
      try {
        const res = await settingsAPI.getCurrentBalance();
        const balance = res && res.data && typeof res.data.current_balance !== 'undefined' ? Number(res.data.current_balance) : null;
        if (balance !== null && Number(loanToSanction.amount) > Number(balance)) {
          throw new Error(`Insufficient wallet balance to sanction this loan. Current balance ₹${Number(balance).toLocaleString('en-IN')}`);
        }
      } catch (err) {
        // If the error originated from the balance check, bubble to catch block
        throw err;
      }
      // Re-fetch loan from server to ensure amount has not changed since the dialog opened
      try {
        const latestLoan = await LoanService.getLoanById(loanToSanction.loan_id);
        if (latestLoan && typeof latestLoan.amount !== 'undefined' && Number(latestLoan.amount) !== Number(loanToSanction.amount)) {
          toast.error(`Loan amount changed since opening dialog. Latest amount: ₹${Number(latestLoan.amount).toLocaleString('en-IN')}. Please refresh and try again.`);
          return;
        }
      } catch (e) {
        // If fetching latest loan failed, continue and let update call fail with a proper error if needed
        console.error('Failed to fetch latest loan details before sanctioning', e);
      }
      await LoanService.updateLoanStatus(loanToSanction.loan_id, 2); // Status 2 = Sanctioned
      toast.success(`Loan ${loanToSanction.ref_no} has been sanctioned successfully`);
      fetchLoans();
      fetchLoanStats();
    } catch (error) {
      toast.error(error.message || 'Failed to sanction loan');
    } finally {
      setSanctioning(false);
      setSanctionConfirmOpen(false);
      setLoanToSanction(null);
    }
  };

  const cancelSanctionLoan = () => {
    setSanctionConfirmOpen(false);
    setLoanToSanction(null);
  };

  // Tab filters with dynamic counts
  const getTabFilters = () => [
    { label: 'Due 0-30d', value: 'uptodate', count: loanStats.uptodate || 0 },
    { label: 'Today Due', value: 'today_due', count: loanStats.today_due || 0 },
    { label: 'Pending', value: 'pending', count: loanStats.pending || 0 },
    { label: 'Overdue 1-3M', value: 'overdue_1_3', count: loanStats.overdue_1_3 || 0 },
    { label: 'Overdue 3-6M', value: 'overdue_3_6', count: loanStats.overdue_3_6 || 0 },
    { label: 'Overdue 6-12M', value: 'overdue_6_12', count: loanStats.overdue_6_12 || 0 },
    { label: 'Overdue >12M', value: 'overdue_above_12', count: loanStats.overdue_above_12 || 0 },
    { label: 'Closed', value: 'closed', count: loanStats.closed || 0 },
  ];

  useEffect(() => {
    fetchLoanStats();
    fetchNextRefNo();
  }, []);

  // Initialize tab from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    const status = params.get('status');

    const tabFilters = getTabFilters();
    const filterToIndex = {
      uptodate: tabFilters.findIndex(t => t.value === 'uptodate'),
      today_due: tabFilters.findIndex(t => t.value === 'today_due'),
      pending: tabFilters.findIndex(t => t.value === 'pending'),
      overdue_1_3: tabFilters.findIndex(t => t.value === 'overdue_1_3'),
      overdue_3_6: tabFilters.findIndex(t => t.value === 'overdue_3_6'),
      overdue_6_12: tabFilters.findIndex(t => t.value === 'overdue_6_12'),
      overdue_above_12: tabFilters.findIndex(t => t.value === 'overdue_above_12'),
      closed: tabFilters.findIndex(t => t.value === 'closed'),
    };

    if (filter && filterToIndex[filter] !== undefined && filterToIndex[filter] >= 0) {
      setActiveTab(filterToIndex[filter]);
      setPage(0);
    }

    // If status=today_due, activate Today Due tab
    if (status === 'today_due') {
      const idx = filterToIndex['today_due'];
      if (idx >= 0) {
        setActiveTab(idx);
        setPage(0);
      }
    }
  }, [location.search]);

  useEffect(() => {
    fetchLoans();
  }, [activeTab, searchTerm, page, rowsPerPage, location.search]);

  // When searching, activate Today Due tab (matches legacy behavior of focusing dues)
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0) {
      const idx = getTabFilters().findIndex(t => t.value === 'today_due');
      if (idx >= 0) setActiveTab(idx);
    }
  }, [searchTerm, loanStats]);

  useEffect(() => {
    fetchSupportingData();
  }, [loanStats]); // Add loanStats as dependency to prevent infinite loop

  const fetchLoanStats = async () => {
    try {
      const stats = await LoanService.getLoanStats();
      setLoanStats(stats);
    } catch (err) {
      console.error('Failed to fetch loan stats:', err);
    }
  };

  const fetchNextRefNo = async () => {
    try {
      // backend reference-numbers are namespaced under /loans
      const response = await apiService.get('/loans/reference-numbers/next');
      if (response.success && response.data) {
        // backend returns { reference_number: 'XXX' }
        setNextRefNo(response.data.reference_number || response.data.reference_number || '');
      }
    } catch (err) {
      console.error('Failed to fetch next reference number:', err);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tabFilters = getTabFilters();
      const currentFilter = tabFilters[activeTab]?.value || 'uptodate';

      const filters = {
        filter: currentFilter,
        search: searchTerm,
        page: page + 1,
        limit: rowsPerPage,
      };

      const response = await LoanService.getLoans(filters);
      setLoans(response.data);
      setTotalItems(response.pagination.totalItems);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch loans');
      console.error('Fetch loans error:', err);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      // Fetch borrowers, loan plans, and loan types
      const [borrowersResponse, plansResponse, typesResponse] = await Promise.all([
        // backend routes are namespaced under /loans
        apiService.get('/loans/borrowers', { params: { limit: 1000 } }),
        apiService.get('/loans/loan-plans', { params: { limit: 1000 } }),
        apiService.get('/loans/loan-types', { params: { limit: 1000 } })
      ]);

      // backend responses often wrap results as { data: { data: rows, pagination } }
      if (borrowersResponse.success && borrowersResponse.data) {
        setBorrowers(Array.isArray(borrowersResponse.data) ? borrowersResponse.data : (borrowersResponse.data.data || []));
      }
      if (plansResponse.success && plansResponse.data) {
        setLoanPlans(Array.isArray(plansResponse.data) ? plansResponse.data : (plansResponse.data.data || []));
      }
      if (typesResponse.success && typesResponse.data) {
        setLoanTypes(Array.isArray(typesResponse.data) ? typesResponse.data : (typesResponse.data.data || []));
      }
      
    } catch (err) {
      console.error('Failed to fetch supporting data:', err);
      toast.error('Failed to load form data. Please refresh the page.');
    }
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleOpenDialog = (loan) => {
    if (loan) {
      setEditingLoan(loan);
      setFormData({
        borrower_id: loan.borrower_id,
        lplan_id: loan.lplan_id,
        ltype_id: loan.ltype_id || 0,
        amount: loan.amount,
        purpose: loan.purpose,
        loan_release_date: loan.loan_release_date || loan.date_released || new Date().toISOString().split('T')[0],
        interest_start_date: loan.interest_start_date || (() => { const base = new Date(loan.loan_release_date || loan.date_released || new Date().toISOString().split('T')[0]); base.setDate(base.getDate() + 15); return base.toISOString().split('T')[0]; })(),
        gross_weight: loan.gross_weight || 0,
        net_weight: loan.net_weight || 0,
        gold_rate: loan.gold_rate || 0,
        gold_details: loan.gold_details || '',
        eligible_amount: loan.eligible_amount,
        release_immediately: loan.status === 2, // Set based on current status
        gold_photo: null,
      });
      const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
      setSelectedBorrower(borrower || null);
      if (loan.gold_photo) {
        setPhotoPreview(`/uploads/gold/${loan.gold_photo}`);
      }
    } else {
      setEditingLoan(null);
      setFormData(initialFormData);
      setSelectedBorrower(null);
      setPhotoPreview(null);
    }
    setFormErrors({});
    setOpenDialog(true);
    // Fetch current balance when opening the dialog so UI can validate against it
    (async () => {
      try {
        const res = await settingsAPI.getCurrentBalance();
        if (res && res.data && typeof res.data.current_balance !== 'undefined') {
          setCurrentBalance(Number(res.data.current_balance) || 0);
        } else {
          setCurrentBalance(null);
        }
      } catch (err) {
        console.error('Failed to fetch current balance', err);
        setCurrentBalance(null);
      }
    })();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLoan(null);
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedBorrower(null);
    setPhotoPreview(null);
  };

  // Calculate eligible amount based on net weight and gold rate
  const calculateEligibleAmount = (netWeight, goldRate) => {
    if (netWeight > 0 && goldRate > 0) {
      // Eligible amount = net weight * gold rate (match legacy PHP behavior)
      return Math.round(netWeight * goldRate);
    }
    return 0;
  };

  const handleInputChange = (field) => (event) => {
    let value = event.target.value;
    
    if (field === 'amount' || field === 'gross_weight' || field === 'net_weight' || field === 'gold_rate' || field === 'eligible_amount') {
      value = parseFloat(event.target.value) || 0;
    } else if (field === 'borrower_id' || field === 'lplan_id' || field === 'ltype_id') {
      value = parseInt(event.target.value, 10) || 0;
    }
    
    const newFormData = {
      ...formData,
      [field]: value,
    };

    // Auto-calculate eligible amount when net weight or gold rate changes
    if (field === 'net_weight' || field === 'gold_rate') {
      const netWeight = field === 'net_weight' ? value : formData.net_weight;
      const goldRate = field === 'gold_rate' ? value : formData.gold_rate;
      newFormData.eligible_amount = calculateEligibleAmount(netWeight, goldRate);
    }

    // Auto-calculate interest start date when loan sanction date changes (add 15 days)
    if (field === 'loan_release_date' && value) {
      const sanctionDate = new Date(value);
      sanctionDate.setDate(sanctionDate.getDate() + 15);
      newFormData.interest_start_date = sanctionDate.toISOString().split('T')[0];
    }
    
    setFormData(newFormData);

    // Real-time validation for loan amount vs eligible amount
    if (field === 'amount' && newFormData.eligible_amount && value > newFormData.eligible_amount) {
      setFormErrors(prev => ({
        ...prev,
        amount: `Loan amount (₹${value.toLocaleString()}) cannot exceed eligible amount (₹${newFormData.eligible_amount.toLocaleString()})`
      }));
    } else if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSelectChange = (field) => (event) => {
    const value = parseInt(event.target.value, 10) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleBorrowerSelect = (borrower) => {
    setSelectedBorrower(borrower);
    if (borrower) {
      setFormData(prev => ({
        ...prev,
        borrower_id: borrower.borrower_id,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        borrower_id: 0,
      }));
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPG, JPEG, PNG, WEBP and GIF files are allowed.');
        return;
      }
      
      const MAX_SIZE = 50 * 1024 * 1024; // Align with backend limits (50MB)
      if (file.size > MAX_SIZE) {
        toast.error('File size too large. Maximum size allowed is 50MB.');
        return;
      }

      setFormData(prev => ({ ...prev, gold_photo: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const MAX_LOAN_AMOUNT = 99999999.99; // Align frontend with backend MAX_DECIMAL_10_2 in loans-loans.js
  const allowedMax = (formData.release_immediately === true && typeof currentBalance === 'number' && !Number.isNaN(currentBalance)) ? Math.min(MAX_LOAN_AMOUNT, Number(currentBalance)) : MAX_LOAN_AMOUNT;
  // When release_immediately is selected and the requested loan amount exceeds the wallet balance,
  // disable sanction now option and disable submission to prevent backend 'Insufficient funds' errors.
  const isImmediateDisbursalInsufficient = (formData.release_immediately === true) && (typeof currentBalance === 'number') && !Number.isNaN(Number(currentBalance)) && (Number(formData.amount) > Number(currentBalance));
  const validateForm = () => {
    const errors = {};

    if (!formData.borrower_id) {
      errors.borrower_id = 'Borrower selection is required';
    }

    if (!formData.lplan_id) {
      errors.lplan_id = 'Loan plan selection is required';
    }

    if (!formData.ltype_id) {
      errors.ltype_id = 'Loan type selection is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Valid loan amount is required';
    }

    // Validate max loan amount (cap at allowedMax which respects the wallet balance if release_immediately is true)
    if (typeof formData.amount === 'number' && formData.amount > allowedMax) {
      errors.amount = `Loan amount cannot exceed ₹${allowedMax.toLocaleString('en-IN', {maximumFractionDigits:2})}`;
    }

    // If release immediately is requested, ensure sufficient wallet balance
    // If release immediately is requested, ensure sufficient wallet balance (this mirrors allowedMax check)
    if ((formData.release_immediately === true) && typeof currentBalance === 'number') {
      if (Number(formData.amount) > Number(currentBalance)) {
        errors.amount = `Insufficient wallet balance for immediate disbursal. Current balance: ₹${Number(currentBalance).toLocaleString('en-IN')} `;
      }
    }

    // Validate loan amount doesn't exceed eligible amount
    if (formData.amount && formData.eligible_amount && formData.amount > formData.eligible_amount) {
      errors.amount = `Loan amount (₹${formData.amount.toLocaleString()}) cannot exceed eligible amount (₹${formData.eligible_amount.toLocaleString()})`;
    }

    // Purpose may be undefined when editing older loans; guard before trimming
    const purposeVal = (typeof formData.purpose === 'string') ? formData.purpose.trim() : '';
    if (!purposeVal) {
      errors.purpose = 'Purpose is required';
    }

    // Eligible amount validation - only if it's provided and not auto-calculated
    if (formData.eligible_amount && formData.eligible_amount <= 0) {
      errors.eligible_amount = 'Eligible amount must be positive';
    }

    if (!formData.loan_release_date) {
      errors.loan_release_date = 'Loan release date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare loan data mapped to backend fields
      // Backend expects: borrower_id, loan_amount, interest_rate, tenure_months, status, disbursed_date
      // Determine interest_rate and tenure_months from selected loan plan
      const selectedPlan = loanPlans.find(p => (p.plan_id || p.lplan_id) === formData.lplan_id || p.lplan_id === formData.lplan_id);
      let interestRate = formData.interest_rate || 0;
      let tenureMonths = formData.tenure_months || 0;
      if (selectedPlan) {
        tenureMonths = selectedPlan.tenure_months || selectedPlan.lplan_month || tenureMonths;
        // choose appropriate interest column if available
        interestRate = (typeof selectedPlan.lplan_interest_3m !== 'undefined' && selectedPlan.lplan_interest_3m) && tenureMonths == 3 ? selectedPlan.lplan_interest_3m
          : (typeof selectedPlan.lplan_interest !== 'undefined' && selectedPlan.lplan_interest) && tenureMonths == 6 ? selectedPlan.lplan_interest
          : (typeof selectedPlan.lplan_interest_6m !== 'undefined' && selectedPlan.lplan_interest_6m) && tenureMonths == 12 ? selectedPlan.lplan_interest_6m
          : (selectedPlan.interest_rate || selectedPlan.lplan_interest || interestRate || 0);
      }

      const loanData = {
        borrower_id: formData.borrower_id,
        lplan_id: formData.lplan_id,
        ltype_id: formData.ltype_id,
        loan_amount: formData.amount,
        interest_rate: Number(interestRate) || 0,
        tenure_months: Number(tenureMonths) || undefined,
        status: formData.release_immediately ? 2 : 1,
        disbursed_date: formData.loan_release_date || undefined,
        // include some extra fields for backward compatibility (won't affect insert)
        purpose: formData.purpose,
        eligible_amount: formData.eligible_amount
      };

      if (editingLoan) {
        // Update existing loan
        await LoanService.updateLoan(editingLoan.loan_id, loanData);
        toast.success('Loan updated successfully');
      } else {
        // Create new loan
        const created = await LoanService.createLoan(loanData);
        toast.success(`Loan ${created.ref_no} added successfully`);
      }

      handleCloseDialog();
      // If user chose not to release immediately, switch to Pending tab
      if (!formData.release_immediately) {
        const idx = getTabFilters().findIndex(t => t.value === 'pending');
        if (idx >= 0) setActiveTab(idx);
      }
      fetchLoans();
      fetchLoanStats();
      fetchNextRefNo();
    } catch (err) {
      toast.error(err.message || 'Failed to save loan');
      console.error('Save loan error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Since we're using server-side pagination and filtering, we don't need client-side filtering
  const paginatedLoans = loans;

  const getOverdueChip = (loan) => {
    if (loan.status !== 2) return null;
    
    const daysOverdue = loan.days_since_last_payment || 0;
    
    if (daysOverdue < 30) {
      // Show remaining days to reach 30-day cycle
      const daysLeft = 30 - daysOverdue;
      return <Chip label={`Due in ${daysLeft}d`} color="success" size="small" />;
    } else if (daysOverdue === 30) {
      return <Chip label={`Due Today`} color="warning" size="small" />;
    } else if (daysOverdue <= 120) {
      return <Chip label={`${daysOverdue - 30}d Overdue`} color="warning" size="small" />;
    } else {
      return <Chip label={`${daysOverdue - 30}d Overdue`} color="error" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Loans
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Loan
        </Button>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {getTabFilters().map((filter, index) => (
            <Tab
              key={filter.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={filter.count} color="primary">
                    {filter.label}
                  </Badge>
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor:
                        (filter.value === 'uptodate') ? '#2e7d32' :
                        (filter.value === 'today_due') ? '#ed6c02' :
                        (filter.value === 'pending') ? '#f9a825' :
                        (filter.value === 'overdue_1_3') ? '#ff9800' :
                        (filter.value === 'overdue_3_6') ? '#f57c00' :
                        (filter.value === 'overdue_6_12') ? '#e65100' :
                        (filter.value === 'overdue_above_12') ? '#c62828' :
                        (filter.value === 'closed') ? '#6b7280' : '#9e9e9e'
                    }}
                    aria-label={`status-dot-${filter.value}`}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Card>

      {/* Current Tab Summary */}
      <Box sx={{ mb: 2 }}>
        {(() => {
          const tabs = getTabFilters();
          const current = tabs[activeTab];
          return current ? (
            <Typography variant="subtitle2" color="text.secondary">
              {`Showing: ${current.label} (${current.count})`}
            </Typography>
          ) : null;
        })()}
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search loans by reference number, borrower name, customer ID, or purpose..."
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

      {/* Loans Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ref No</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Outstanding</TableCell>
                  <TableCell>Release Date</TableCell>
                  <TableCell>Gold Photo</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedLoans.map((loan) => {
                  const StatusIcon = loanStatusConfig[loan.status].icon;
                  return (
                    <TableRow key={loan.loan_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {loan.borrower_ref_no || loan.ref_no}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {loan.customer_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(loan.amount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {loan.ltype_name || 'Gold Loan'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {loan.lplan_month} months
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {loan.active_interest_rate}% p.a.
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip
                            label={loanStatusConfig[loan.status].label}
                            color={loanStatusConfig[loan.status].color}
                            size="small"
                            icon={<StatusIcon />}
                          />
                          {loan.status === 2 && getOverdueChip(loan)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {(() => {
                              // Compute interest on-the-fly to avoid stale remaining_interest
                              const remainingP = Math.max(0, loan.amount - (loan.total_principal_paid || 0));
                              const daysRaw = Math.max(0, loan.days_since_last_payment || 0);
                              const days = Math.max(15, daysRaw); // apply minimum 15 days interest
                              const daily = (loan.active_interest_rate / 100) / 365;
                              const currentI = Math.round(remainingP * daily * days);
                              return formatCurrency(remainingP + currentI);
                            })()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            P: {formatCurrency(Math.max(0, loan.amount - (loan.total_principal_paid || 0)))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            I: {(() => {
                              const remainingP = Math.max(0, loan.amount - (loan.total_principal_paid || 0));
                              const daysRaw = Math.max(0, loan.days_since_last_payment || 0);
                              const days = Math.max(15, daysRaw); // apply minimum 15 days interest
                              const daily = (loan.active_interest_rate / 100) / 365;
                              const currentI = Math.round(remainingP * daily * days);
                              return formatCurrency(currentI);
                            })()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateDDMMYYYY(loan.loan_release_date || loan.date_released)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <GoldPhotoDisplay
                          goldPhoto={loan.gold_photo}
                          loanRefNo={loan.ref_no}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info" onClick={() => navigate(`/loans-dashboard/loans/${loan.loan_id}`)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {loan.status === 1 && (
                          <Tooltip title="Sanction Loan">
                            <IconButton 
                              size="small" 
                              color="success" 
                              onClick={() => {
                                setLoanToSanction(loan);
                                setSanctionConfirmOpen(true);
                              }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Actions">
                          <IconButton size="small" onClick={(e) => openActionMenu(e, loan)}>
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalItems}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={actionAnchor} open={Boolean(actionAnchor)} onClose={closeActionMenu}>
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {actionLoan?.status === 1 && (
          <MenuItem onClick={handleSanctionLoan}>
            <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Sanction Loan</ListItemText>
          </MenuItem>
        )}
        {actionLoan?.status === 1 && (
          <MenuItem onClick={() => { if (actionLoan) handleOpenDialog(actionLoan); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Edit Loan</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handlePaymentHistory}>
          <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Payment History</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleInterestDetails}>
          <ListItemIcon><PercentIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Interest Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCalculateOverdue}>
          <ListItemIcon><CalculateIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Calculate Overdue</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadReceipt}>
          <ListItemIcon><ReceiptIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Download Receipt</ListItemText>
        </MenuItem>
        {/* Print Loan Release Receipt removed per user request */}
      </Menu>

      {/* Add/Edit Loan Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingLoan ? 'Edit Loan' : 'Add New Loan'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={borrowers}
                getOptionLabel={(option) => `${option.full_name} (${option.ref_no})`}
                value={selectedBorrower}
                onChange={(event, newValue) => handleBorrowerSelect(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Borrower"
                    error={!!formErrors.borrower_id}
                    helperText={formErrors.borrower_id}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.lplan_id}>
                <InputLabel>Loan Plan *</InputLabel>
                <Select
                  value={formData.lplan_id}
                  onChange={handleSelectChange('lplan_id')}
                  label="Loan Plan *"
                >
                  {loanPlans.map((plan) => (
                    <MenuItem key={plan.lplan_id} value={plan.lplan_id}>
                      {plan.lplan_month} Months - {plan.lplan_interest_3m}[3M] - {plan.lplan_interest}[6M] - {plan.lplan_interest_6m}[12M]
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.ltype_id}>
                <InputLabel>Loan Type *</InputLabel>
                <Select
                  value={formData.ltype_id}
                  onChange={handleSelectChange('ltype_id')}
                  label="Loan Type *"
                >
                  {loanTypes.map((type) => (
                    <MenuItem key={type.ltype_id} value={type.ltype_id}>
                      {type.ltype_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Loan Sanction Date"
                type="date"
                value={formData.loan_release_date}
                onChange={handleInputChange('loan_release_date')}
                error={!!formErrors.loan_release_date}
                helperText={formErrors.loan_release_date}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Interest Start Date"
                type="date"
                value={formData.interest_start_date}
                onChange={handleInputChange('interest_start_date')}
                error={!!formErrors.interest_start_date}
                helperText={formErrors.interest_start_date}
                disabled
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Gross Weight (grams)"
                type="number"
                value={formData.gross_weight}
                onChange={handleInputChange('gross_weight')}
                error={!!formErrors.gross_weight}
                helperText={formErrors.gross_weight}
                InputProps={{
                  endAdornment: <InputAdornment position="end">g</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Net Weight (grams)"
                type="number"
                value={formData.net_weight}
                onChange={handleInputChange('net_weight')}
                error={!!formErrors.net_weight}
                helperText={formErrors.net_weight}
                InputProps={{
                  endAdornment: <InputAdornment position="end">g</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Gold Rate (per gram)"
                type="number"
                value={formData.gold_rate}
                onChange={handleInputChange('gold_rate')}
                error={!!formErrors.gold_rate}
                helperText={formErrors.gold_rate}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Gold Details"
                value={formData.gold_details}
                onChange={handleInputChange('gold_details')}
                error={!!formErrors.gold_details}
                helperText={formErrors.gold_details}
                placeholder="e.g., 22K Gold Chain, Bangles, etc."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Eligible Amount (Auto-calculated)"
                type="number"
                value={formData.eligible_amount}
                onChange={handleInputChange('eligible_amount')}
                error={!!formErrors.eligible_amount}
                helperText={formErrors.eligible_amount || "Calculated as 75% of (Net Weight × Gold Rate)"}
                required
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Loan Amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange('amount')}
                error={!!formErrors.amount}
                helperText={formErrors.amount || (formData.release_immediately ? `Available wallet balance: ₹${(typeof currentBalance === 'number' ? Number(currentBalance).toLocaleString('en-IN') : 'N/A')}` : '')}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { step: '0.01', max: allowedMax }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={isImmediateDisbursalInsufficient}>
                <InputLabel>Sanction Immediately</InputLabel>
                <Select
                  value={formData.release_immediately ? 'true' : 'false'}
                  onChange={(e) => {
                    const value = e.target.value === 'true';
                    setFormData(prev => ({ ...prev, release_immediately: value }));
                  }}
                  label="Sanction Immediately"
                >
                  <MenuItem value="false">No - Keep as Sanctioned</MenuItem>
                  <MenuItem value="true" disabled={isImmediateDisbursalInsufficient}>Yes - Sanction Now</MenuItem>
                </Select>
                {isImmediateDisbursalInsufficient && (
                  <FormHelperText>
                    Insufficient wallet balance for immediate disbursal. Current balance: ₹{Number(currentBalance).toLocaleString('en-IN')}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
                fullWidth
                sx={{ height: 56 }}
              >
                Upload Gold Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                />
              </Button>
            </Grid>
            {photoPreview && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={photoPreview}
                    alt=""
                    style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: 8 }}
                  />
                </Box>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purpose"
                multiline
                rows={3}
                value={formData.purpose}
                onChange={handleInputChange('purpose')}
                error={!!formErrors.purpose}
                helperText={formErrors.purpose}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Tooltip title={isImmediateDisbursalInsufficient ? 'Cannot sanction immediately: insufficient wallet balance' : ''}>
            <span>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting || isImmediateDisbursalInsufficient}
              >
            {submitting ? <CircularProgress size={20} /> : (editingLoan ? 'Update' : 'Add')}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Overdue Calculation Dialog */}
      <Dialog
        open={overdueDialogOpen}
        onClose={() => { setOverdueDialogOpen(false); setOverdueResult(null); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Overdue Interest Calculation</DialogTitle>
        <DialogContent>
          {overdueLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress/></Box>
          ) : overdueResult ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Loan:</strong> {overdueLoan ? (overdueLoan.borrower_ref_no || overdueLoan.ref_no) : ''} — {overdueLoan ? overdueLoan.full_name || overdueLoan.customer_id : ''}
              </Typography>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Days Calculated</TableCell>
                    <TableCell>{overdueResult.days ?? '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Interest Calculated</TableCell>
                    <TableCell>{formatCurrency(overdueResult.interestCalculated || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>New Remaining Interest</TableCell>
                    <TableCell>{formatCurrency(overdueResult.remaining_interest || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Message</TableCell>
                    <TableCell>{overdueResult.message}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography>No data</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOverdueDialogOpen(false); setOverdueResult(null); setOverdueLoan(null); }}>Close</Button>
          <Button onClick={() => {
            setOverdueDialogOpen(false);
            setOverdueResult(null);
            const l = overdueLoan || actionLoan;
            setOverdueLoan(null);
            // navigate to interest details page for full view
            if (l) navigate(`/loans-dashboard/loans/${l.loan_id}/interest`);
          }} variant="contained">View Interest Details</Button>
        </DialogActions>
      </Dialog>

      {/* Sanction Confirmation Dialog */}
      <Dialog
        open={sanctionConfirmOpen}
        onClose={cancelSanctionLoan}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            Confirm Loan Sanction
          </Box>
        </DialogTitle>
        <DialogContent>
          {loanToSanction && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to sanction this loan?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Loan Reference:</strong> {loanToSanction.ref_no}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Borrower:</strong> {loanToSanction.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Amount:</strong> {formatCurrency(loanToSanction.amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Available wallet balance:</strong> {typeof currentBalance === 'number' ? formatCurrency(currentBalance) : 'N/A'}
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Once sanctioned, the loan will be released immediately and interest calculation will begin.
              </Alert>
              {typeof currentBalance === 'number' && Number(loanToSanction.amount) > Number(currentBalance) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Insufficient wallet balance to sanction this loan. Current balance ₹{Number(currentBalance).toLocaleString('en-IN')}
                </Alert>
              )}
              {typeof currentBalance === 'number' && Number(loanToSanction.amount) > Number(currentBalance) && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => { navigate('/loans-dashboard/balance-management'); setSanctionConfirmOpen(false); }}>Add Balance</Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelSanctionLoan}>Cancel</Button>
          <Tooltip title={(typeof currentBalance === 'number' && Number(loanToSanction?.amount || 0) > Number(currentBalance)) ? 'Insufficient wallet balance' : ''}>
            <span>
              <Button
                onClick={confirmSanctionLoan}
                variant="contained"
                color="success"
                startIcon={sanctioning ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                disabled={sanctioning || (typeof currentBalance === 'number' && Number(loanToSanction?.amount || 0) > Number(currentBalance))}
              >
                {sanctioning ? 'Sanctioning...' : 'Sanction Loan'}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loans;
