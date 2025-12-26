import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, Table, TableHead, TableRow, TableCell, TableBody, Button, CircularProgress } from '@mui/material';
import { apiService } from '../services/apiService';
import { LoanService } from '../services/loanService';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
import { formatCurrency } from '../utils/dateTime';

const LoanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchLoan();
  }, [id]);

  const fetchLoan = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await LoanService.getLoanById(id);
      if (!resp) {
        setError('Loan not found');
        return;
      }
      // LoanService returns the data object (we expect { loan, payments, schedules })
      setData(resp);
    } catch (err) {
      console.error('Failed to fetch loan detail', err);
      setError(err.message || 'Failed to fetch loan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress/></Box>;
  if (error) return <Box p={3}><Typography color="error">{error}</Typography></Box>;

  const { loan, payments = [], schedules = [] } = data;

  return (
    <Box>
      <Button onClick={() => navigate(-1)} variant="text">Back to Loans</Button>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Reference</Typography>
              <Typography>{loan.borrower_ref_no || loan.ref_no}</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Borrower</Typography>
              <Typography>{loan.borrower_name} (ID: {loan.borrower_customer_id})</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Plan / Type</Typography>
              <Typography>{loan.lplan_month} months · {loan.ltype_name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6">Amount</Typography>
              <Typography>{formatCurrency(loan.amount)}</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Outstanding</Typography>
              <Typography>{formatCurrency(loan.outstanding || 0)}</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Status</Typography>
              <Typography>{loan.status}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Payments</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Interest</TableCell>
                <TableCell>Reduction</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Receipt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={6}>No payments found</TableCell></TableRow>
              ) : payments.map(p => (
                <TableRow key={p.payment_id}>
                  <TableCell>{formatDateDDMMYYYY(p.payment_date)}</TableCell>
                  <TableCell>{formatCurrency(p.actual_amount)}</TableCell>
                  <TableCell>{formatCurrency(p.interest_amount)}</TableCell>
                  <TableCell>{formatCurrency(p.reduction_amount)}</TableCell>
                  <TableCell>{p.payment_mode}</TableCell>
                  <TableCell>{p.receipt_no}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Schedule</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Due Date</TableCell>
                <TableCell>Principal</TableCell>
                <TableCell>Interest</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow><TableCell colSpan={4}>No schedule found</TableCell></TableRow>
              ) : schedules.map(s => (
                <TableRow key={s.loan_sched_id}>
                  <TableCell>{formatDateDDMMYYYY(s.due_date)}</TableCell>
                  <TableCell>{formatCurrency(s.principal_amount)}</TableCell>
                  <TableCell>{formatCurrency(s.interest_amount)}</TableCell>
                  <TableCell>{s.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoanDetail;
