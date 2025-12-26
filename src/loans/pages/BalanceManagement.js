import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  Add as AddIcon,
  History as HistoryIcon,
  TrendingUp as IncreaseIcon,
  TrendingDown as DecreaseIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
import { settingsAPI } from '../../main-dashboard/services/api';

const BalanceManagement = () => {
  const [currentBalance, setCurrentBalance] = useState(0);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [transactionData, setTransactionData] = useState({
    type: 'deposit',
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchCurrentBalance();
    fetchBalanceHistory();
  }, []);

  const fetchBalanceHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsAPI.getBalanceHistory();
      if (!response || !response.data || !response.data.success) {
        const message = response?.data?.message || 'Failed to fetch balance history';
        throw new Error(message);
      }
      const mapped = (response.data.data || []).map(t => ({
        id: t.transaction_id,
        type: t.transaction_type,
        amount: parseFloat(t.amount) || 0,
        description: t.description,
        balance_before: parseFloat(t.balance_before) || 0,
        balance_after: parseFloat(t.balance_after) || 0,
        date: t.transaction_date,
        created_by: t.created_by || 'System'
      }));
      setBalanceHistory(mapped);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch balance history');
      // eslint-disable-next-line no-console
      console.error('Error fetching balance history:', err);
      setBalanceHistory([]);
      setLoading(false);
    }
  };

  const fetchCurrentBalance = async () => {
    try {
      const response = await settingsAPI.getSystemSettings();
      if (response && response.data && response.data.success) {
        const current = response.data.data?.current_balance || 0;
        setCurrentBalance(parseFloat(current) || 0);
      }
    } catch (err) {
      setError('Failed to fetch current balance');
      // eslint-disable-next-line no-console
      console.error('Error fetching current balance:', err);
    }
  };

  const handleAddTransaction = () => {
    setTransactionData({
      type: 'deposit',
      amount: '',
      description: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTransactionData({
      type: 'deposit',
      amount: '',
      description: '',
    });
  };

  const handleSubmit = async () => {
    try {
      const amount = parseFloat(transactionData.amount);
      
      if (!amount || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (!transactionData.description.trim()) {
        toast.error('Please enter a description');
        return;
      }

      if (transactionData.type === 'withdrawal' && amount > currentBalance) {
        toast.error('Insufficient balance for withdrawal');
        return;
      }

      // Submit transaction to backend
      const response = await settingsAPI.createBalanceTransaction({
        type: transactionData.type,
        amount: amount,
        description: transactionData.description
      });
      if (!response || !response.data || !response.data.success) {
        throw new Error(response?.data?.message || 'Failed to process transaction');
      }
      // Refresh balances and history
      await fetchCurrentBalance();
      await fetchBalanceHistory();
      handleCloseDialog();
      toast.success('Transaction added successfully');
    } catch (err) {
      toast.error('Failed to process transaction');
      console.error('Error processing transaction:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setTransactionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTransactionColor = (type) => {
    return type === 'deposit' ? 'success' : 'error';
  };

  const formatAmount = (amount, type) => {
    const sign = type === 'deposit' ? '+' : '-';
    return `${sign}₹${amount.toLocaleString()}`;
  };

  const totalDeposits = balanceHistory
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = balanceHistory
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

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
          Balance Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTransaction}
        >
          Add Transaction
        </Button>
      </Box>

      {/* Current Balance Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BalanceIcon sx={{ color: 'white', fontSize: 32, mr: 2 }} />
                <Typography variant="h6" color="white" fontWeight="bold">
                  Current Balance
                </Typography>
              </Box>
              <Typography variant="h3" color="white" fontWeight="bold">
                          ₹{currentBalance.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <IncreaseIcon sx={{ color: 'white', fontSize: 32, mr: 2 }} />
                <Typography variant="h6" color="white" fontWeight="bold">
                  Total Deposits
                </Typography>
              </Box>
                <Typography variant="h3" color="white" fontWeight="bold">
                ₹{totalDeposits.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DecreaseIcon sx={{ color: 'white', fontSize: 32, mr: 2 }} />
                <Typography variant="h6" color="white" fontWeight="bold">
                  Total Withdrawals
                </Typography>
              </Box>
                <Typography variant="h3" color="white" fontWeight="bold">
                ₹{totalWithdrawals.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Balance History */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <HistoryIcon sx={{ mr: 2 }} />
            <Typography variant="h6" fontWeight="bold">
              Balance History
            </Typography>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Balance Before</TableCell>
                  <TableCell>Balance After</TableCell>
                  <TableCell>Created By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {balanceHistory.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateDDMMYYYY(transaction.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type.toUpperCase()}
                        color={getTransactionColor(transaction.type)}
                        size="small"
                        icon={transaction.type === 'deposit' ? <IncreaseIcon /> : <DecreaseIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={transaction.type === 'deposit' ? 'success.main' : 'error.main'}
                      >
                        {formatAmount(transaction.amount, transaction.type)}
                      </Typography>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>₹{transaction.balance_before.toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{transaction.balance_after.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{transaction.created_by}</TableCell>
                  </TableRow>
                ))}
                {balanceHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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

      {/* Add Transaction Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Balance Transaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={transactionData.type}
                  label="Transaction Type"
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <MenuItem value="deposit">Deposit</MenuItem>
                  <MenuItem value="withdrawal">Withdrawal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={transactionData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={transactionData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                variant="outlined"
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                Current Balance: ₹{currentBalance.toLocaleString()}
                {transactionData.type === 'withdrawal' && transactionData.amount && (
                  <>
                    <br />
                    Balance After: ₹{(currentBalance - (parseFloat(transactionData.amount) || 0)).toLocaleString()}
                  </>
                )}
                {transactionData.type === 'deposit' && transactionData.amount && (
                  <>
                    <br />
                    Balance After: ₹{(currentBalance + (parseFloat(transactionData.amount) || 0)).toLocaleString()}
                  </>
                )}
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Add Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BalanceManagement;
