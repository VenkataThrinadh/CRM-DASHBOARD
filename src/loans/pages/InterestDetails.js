import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Button } from '@mui/material';
import { LoanService } from '../services/loanService';
import { formatCurrency, formatDateToIST } from '../utils/dateTime';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';

const InterestDetails = () => {
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
      const resp = await LoanService.getLoanById(id);
      if (!resp || !resp.loan) {
        setError('Loan not found');
        return;
      }
      setData(resp);
    } catch (err) {
      console.error('Failed to load loan interest details', err);
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress/></Box>;
  if (error) return <Box p={3}><Typography color="error">{error}</Typography></Box>;

  const { loan } = data;
  const now = new Date();
  const released = loan.date_released ? new Date(loan.date_released) : (loan.disbursed_date ? new Date(loan.disbursed_date) : null);
  const daysSinceStart = released ? Math.max(0, Math.floor((now - released) / (1000 * 60 * 60 * 24))) : 0;

  const remainingPrincipal = (typeof loan.remaining_principal !== 'undefined' && loan.remaining_principal !== null)
    ? Number(loan.remaining_principal)
    : Math.max(0, Number(loan.amount || 0) - Number(loan.total_principal_paid || 0));

  const activeRate = Number(loan.active_interest_rate || loan.interest_rate || 0);
  const dailyRate = (activeRate / 100) / 365;
  const currentPendingInterest = Math.round(remainingPrincipal * dailyRate * Math.max(1, daysSinceStart));
  const dailyAccrual = Math.round(remainingPrincipal * dailyRate * 100) / 100;
  const advance15 = Math.round(dailyAccrual * 15 * 100) / 100;
  const totalOutstanding = Math.round((remainingPrincipal + (loan.remaining_interest || currentPendingInterest)) * 100) / 100;
  const totalWithAdvance = Math.round((remainingPrincipal + advance15) * 100) / 100;

  // Build a simple interest rate schedule using loan plan if available
  const schedule = [];
  if (loan.lplan_month) {
    const months = Number(loan.lplan_month);
    schedule.push({ period: `0-${Math.min(3, months)} months`, annual: loan.lplan_interest_3m || loan.interest_rate || activeRate });
    schedule.push({ period: `3-6 months`, annual: loan.lplan_interest || activeRate });
    schedule.push({ period: `6-12 months`, annual: loan.lplan_interest_6m || activeRate });
    schedule.push({ period: `Over 12 months`, annual: activeRate });
  } else {
    schedule.push({ period: `0-3 months`, annual: activeRate });
    schedule.push({ period: `3-6 months`, annual: activeRate });
    schedule.push({ period: `6-12 months`, annual: activeRate });
    schedule.push({ period: `Over 12 months`, annual: activeRate });
  }

  return (
    <Box>
      <Button variant="text" onClick={() => navigate(-1)}>Back</Button>
      <Typography variant="h5" sx={{ mb: 2 }}>Loan Interest Details - {loan.borrower_name || loan.full_name} ({loan.borrower_ref_no || loan.ref_no})</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Loan Details</Typography>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Loan Amount</TableCell>
                    <TableCell>{formatCurrency(loan.amount || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Remaining Principal</TableCell>
                    <TableCell>{formatCurrency(remainingPrincipal)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Loan Release Date</TableCell>
                    <TableCell>{formatDateDDMMYYYY(loan.loan_release_date || loan.date_released)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Last Interest Update</TableCell>
                    <TableCell>{loan.last_interest_update ? formatDateDDMMYYYY(loan.last_interest_update) : '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Days Since Loan Start</TableCell>
                    <TableCell>{daysSinceStart} days</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Interest Details</Typography>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Current Interest Rate</TableCell>
                    <TableCell>{(activeRate).toFixed(2)}% p.a.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Days Since Loan Start</TableCell>
                    <TableCell>{daysSinceStart}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Interest applies for the first 15 days</TableCell>
                    <TableCell>{formatCurrency(advance15)} (as of {formatDateDDMMYYYY(new Date())})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Current Pending Interest</TableCell>
                    <TableCell>{formatCurrency(loan.remaining_interest || currentPendingInterest)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Interest Paid</TableCell>
                    <TableCell>{formatCurrency(loan.total_interest_paid || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Daily Interest Accrual</TableCell>
                    <TableCell>{formatCurrency(dailyAccrual)} per day</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>15-Day Advance Interest</TableCell>
                    <TableCell>{formatCurrency(advance15)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Outstanding Amount</TableCell>
                    <TableCell>{formatCurrency(totalOutstanding)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total with 15-Day Advance Interest</TableCell>
                    <TableCell>{formatCurrency(totalWithAdvance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Interest Rate Schedule</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Annual Rate</TableCell>
                    <TableCell>Monthly Rate</TableCell>
                    <TableCell>Daily Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedule.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.period}</TableCell>
                      <TableCell>{(Number(row.annual) || activeRate).toFixed(2)}%</TableCell>
                      <TableCell>{((Number(row.annual) || activeRate)/12).toFixed(2)}%</TableCell>
                      <TableCell>{(((Number(row.annual) || activeRate)/100)/365).toFixed(5)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Interest Rate Thresholds</Typography>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Current Outstanding</TableCell>
                      <TableCell>{formatCurrency(totalOutstanding)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Next Rate Threshold</TableCell>
                      <TableCell>{formatCurrency(loan.next_rate_threshold || 0)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Next Interest Rate</TableCell>
                      <TableCell>{(loan.next_interest_rate || activeRate).toFixed(2)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Estimated Days to Next Rate</TableCell>
                      <TableCell>{loan.estimated_days_to_next_rate || '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InterestDetails;
