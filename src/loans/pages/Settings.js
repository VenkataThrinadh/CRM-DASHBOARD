import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Tabs,
  Tab,
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
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Percent as PercentIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { apiService } from '../services/apiService';

const initialLoanPlanForm = {
  lplan_month: 0,
  lplan_interest_3m: 0,
  lplan_interest: 0,
  lplan_interest_6m: 0,
};

const initialLoanTypeForm = {
  ltype_name: '',
};

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  // Loan Plans
  const [loanPlans, setLoanPlans] = useState([]);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState(initialLoanPlanForm);
  const [planSubmitting, setPlanSubmitting] = useState(false);

  // Loan Types
  const [loanTypes, setLoanTypes] = useState([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeFormData, setTypeFormData] = useState(initialLoanTypeForm);
  const [typeSubmitting, setTypeSubmitting] = useState(false);

  // Delete confirmations
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend namespaced loan endpoints and request large limit to retrieve all
      const [plansResponse, typesResponse] = await Promise.all([
        apiService.get('/loans/loan-plans', { params: { limit: 1000 } }),
        apiService.get('/loans/loan-types', { params: { limit: 1000 } })
      ]);

      if (plansResponse.success) {
        const plans = Array.isArray(plansResponse.data) ? plansResponse.data : (plansResponse.data?.data || []);
        setLoanPlans(plans);
      }
      if (typesResponse.success) {
        const types = Array.isArray(typesResponse.data) ? typesResponse.data : (typesResponse.data?.data || []);
        setLoanTypes(types);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Fetch settings error:', err);
      setError(err.message || 'Failed to fetch settings data');
      toast.error('Failed to fetch settings data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Loan Plans Handlers
  const handleOpenPlanDialog = (plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({
        lplan_month: plan.lplan_month,
        lplan_interest_3m: plan.lplan_interest_3m,
        lplan_interest: plan.lplan_interest,
        lplan_interest_6m: plan.lplan_interest_6m,
      });
    } else {
      setEditingPlan(null);
      setPlanFormData(initialLoanPlanForm);
    }
    setOpenPlanDialog(true);
  };

  const handleClosePlanDialog = () => {
    setOpenPlanDialog(false);
    setEditingPlan(null);
    setPlanFormData(initialLoanPlanForm);
  };

  const handlePlanFormChange = (field) => (event) => {
    setPlanFormData(prev => ({
      ...prev,
      [field]: parseFloat(event.target.value) || 0,
    }));
  };

  const handleSavePlan = async () => {
    try {
      if (!planFormData.lplan_month) {
        toast.error('Please enter loan plan month');
        return;
      }

      setPlanSubmitting(true);
      // Prepare payload; map to backend fields if necessary
      // Determine interest_rate from the form inputs.
      // The form uses fields: lplan_interest_3m, lplan_interest (6m), lplan_interest_6m (12m)
      const tenure = planFormData.lplan_month || planFormData.tenure_months || 0;
      let computedInterest = null;

      // If frontend provided an explicit interest_rate field, prefer it
      if (typeof planFormData.interest_rate !== 'undefined' && planFormData.interest_rate !== null) {
        computedInterest = planFormData.interest_rate;
      } else {
        // Map tenure to the correct input field
        if (tenure === 3) computedInterest = planFormData.lplan_interest_3m;
        else if (tenure === 6) computedInterest = planFormData.lplan_interest;
        else if (tenure === 12) computedInterest = planFormData.lplan_interest_6m;
        else computedInterest = planFormData.lplan_interest || planFormData.lplan_interest_3m || planFormData.lplan_interest_6m || 0;
      }

      const payload = {
        // backend expects plan_name/min_amount/max_amount/interest_rate/tenure_months
        plan_name: planFormData.plan_name || `Plan ${tenure}m`,
        min_amount: planFormData.min_amount || 0,
        max_amount: planFormData.max_amount || 0,
        interest_rate: Number(computedInterest) || 0,
        // Send legacy-interest fields explicitly so backend stores them into lplan_interest_* columns
        lplan_interest_3m: Number(planFormData.lplan_interest_3m) || 0,
        lplan_interest: Number(planFormData.lplan_interest) || 0,
        lplan_interest_6m: Number(planFormData.lplan_interest_6m) || 0,
        tenure_months: tenure,
        status: planFormData.status || 'active'
      };

      if (editingPlan && (editingPlan.plan_id || editingPlan.lplan_id)) {
        const id = editingPlan.plan_id || editingPlan.lplan_id;
        const response = await apiService.put(`/loans/loan-plans/${id}`, payload);
        if (response.success) {
          toast.success('Loan plan updated successfully');
          // Refresh list
          fetchData();
        } else {
          throw new Error(response.message || 'Failed to update plan');
        }
      } else {
        const response = await apiService.post('/loans/loan-plans', payload);
        if (response.success) {
          toast.success('Loan plan created successfully');
          fetchData();
        } else {
          throw new Error(response.message || 'Failed to create plan');
        }
      }

      handleClosePlanDialog();
      setPlanSubmitting(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Save loan plan error:', error);
      toast.error(error.message || 'Failed to save loan plan');
      setPlanSubmitting(false);
    }
  };

  const handleDeletePlan = (plan) => {
    setItemToDelete({
      type: 'loan-plan',
      id: plan.lplan_id,
      name: `${plan.lplan_month} Month Plan`,
    });
    setDeleteConfirmOpen(true);
  };

  // Loan Types Handlers
  const handleOpenTypeDialog = (type) => {
    if (type) {
      setEditingType(type);
      setTypeFormData({ ltype_name: type.ltype_name });
    } else {
      setEditingType(null);
      setTypeFormData(initialLoanTypeForm);
    }
    setOpenTypeDialog(true);
  };

  const handleCloseTypeDialog = () => {
    setOpenTypeDialog(false);
    setEditingType(null);
    setTypeFormData(initialLoanTypeForm);
  };

  const handleTypeFormChange = (field) => (event) => {
    setTypeFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSaveType = async () => {
    try {
      if (!typeFormData.ltype_name.trim()) {
        toast.error('Please enter loan type name');
        return;
      }

      setTypeSubmitting(true);
      if (editingType && (editingType.type_id || editingType.ltype_id)) {
        const id = editingType.type_id || editingType.ltype_id;
        const response = await apiService.put(`/loans/loan-types/${id}`, { type_name: typeFormData.ltype_name, description: typeFormData.description || '' });
        if (response.success) {
          toast.success('Loan type updated successfully');
          fetchData();
        } else {
          throw new Error(response.message || 'Failed to update loan type');
        }
      } else {
        const response = await apiService.post('/loans/loan-types', { type_name: typeFormData.ltype_name, description: typeFormData.description || '' });
        if (response.success) {
          toast.success('Loan type created successfully');
          fetchData();
        } else {
          throw new Error(response.message || 'Failed to create loan type');
        }
      }

      handleCloseTypeDialog();
      setTypeSubmitting(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Save loan type error:', error);
      toast.error(error.message || 'Failed to save loan type');
      setTypeSubmitting(false);
    }
  };

  const handleDeleteType = (type) => {
    setItemToDelete({
      type: 'loan-type',
      id: type.ltype_id,
      name: type.ltype_name,
    });
    setDeleteConfirmOpen(true);
  };

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'loan-plan') {
        const response = await apiService.delete(`/loans/loan-plans/${itemToDelete.id}`);
        if (response.success) {
          toast.success('Loan plan deleted successfully');
          fetchData();
        } else {
          throw new Error(response.message || 'Failed to delete plan');
        }
      } else if (itemToDelete.type === 'loan-type') {
        const response = await apiService.delete(`/loans/loan-types/${itemToDelete.id}`);
        if (response.success) {
          toast.success('Loan type deleted successfully');
          fetchData();
        } else {
          throw new Error(response.message || 'Failed to delete loan type');
        }
      }

      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PercentIcon />} label="Loan Plans" />
          <Tab icon={<CategoryIcon />} label="Loan Types" />
        </Tabs>
      </Card>

      {/* Loan Plans Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Loan Plans
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenPlanDialog()}
              >
                Add Plan
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell>3M Interest (%)</TableCell>
                    <TableCell>6M Interest (%)</TableCell>
                    <TableCell>12M Interest (%)</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No loan plans found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    loanPlans.map((plan) => (
                      <TableRow key={plan.lplan_id} hover>
                        <TableCell>{plan.lplan_month}</TableCell>
                        <TableCell>{plan.lplan_interest_3m}%</TableCell>
                        <TableCell>{plan.lplan_interest}%</TableCell>
                        <TableCell>{plan.lplan_interest_6m}%</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPlanDialog(plan)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePlan(plan)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Loan Types Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Loan Types
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenTypeDialog()}
              >
                Add Type
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type Name</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No loan types found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    loanTypes.map((type) => (
                      <TableRow key={type.ltype_id} hover>
                        <TableCell>{type.ltype_name}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenTypeDialog(type)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteType(type)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Loan Plan Dialog */}
      <Dialog open={openPlanDialog} onClose={handleClosePlanDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPlan ? 'Edit Loan Plan' : 'Add Loan Plan'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Month"
                type="number"
                value={planFormData.lplan_month}
                onChange={handlePlanFormChange('lplan_month')}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="3 Month Interest (%)"
                type="number"
                value={planFormData.lplan_interest_3m}
                onChange={handlePlanFormChange('lplan_interest_3m')}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="6 Month Interest (%)"
                type="number"
                value={planFormData.lplan_interest}
                onChange={handlePlanFormChange('lplan_interest')}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="12 Month Interest (%)"
                type="number"
                value={planFormData.lplan_interest_6m}
                onChange={handlePlanFormChange('lplan_interest_6m')}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlanDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSavePlan}
            disabled={planSubmitting}
            startIcon={<SaveIcon />}
          >
            {planSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loan Type Dialog */}
      <Dialog open={openTypeDialog} onClose={handleCloseTypeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingType ? 'Edit Loan Type' : 'Add Loan Type'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Type Name"
            value={typeFormData.ltype_name}
            onChange={handleTypeFormChange('ltype_name')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTypeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveType}
            disabled={typeSubmitting}
            startIcon={<SaveIcon />}
          >
            {typeSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{itemToDelete?.name}"?
            {itemToDelete?.type === 'user' && ' This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
