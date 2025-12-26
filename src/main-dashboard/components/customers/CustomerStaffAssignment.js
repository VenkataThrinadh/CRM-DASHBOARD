import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Avatar,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  PersonAdd,
  Phone,
  Email,
  Business,
  Save,
  Cancel,
} from '@mui/icons-material';
import { staffAPI, customersAPI } from '../../services/api';

const CustomerStaffAssignment = ({ customerId, onAssignmentChange, customer }) => {
  const [staff, setStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [assignedStaff, setAssignedStaff] = useState(null);

  // Fetch available staff members and check if customer already has assigned staff
  useEffect(() => {
    fetchStaff();
    checkAssignedStaff();
  }, [customer]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAll({ status: 'active' });
      setStaff(response.data.staff || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching staff:', error);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const checkAssignedStaff = () => {
    if (customer && customer.assigned_staff_id) {
      setAssignedStaff({
        id: customer.assigned_staff_id,
        full_name: customer.assigned_staff_name,
        email: customer.assigned_staff_email,
        phone: customer.assigned_staff_phone,
        department: customer.assigned_staff_department,
        designation: customer.assigned_staff_designation
      });
    } else {
      setAssignedStaff(null);
    }
  };

  const handleStaffSelect = (staffId) => {
    setSelectedStaffId(staffId);
    const staffMember = staff.find(s => s.id === staffId);
    setSelectedStaff(staffMember);
  };

  const handleAssignClick = () => {
    if (selectedStaff) {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmAssign = async () => {
    try {
      setAssigning(true);
      setError(null);

      // Update customer with assigned staff
      await customersAPI.update(customerId, {
        assigned_staff_id: selectedStaff.id,
        assigned_staff_name: selectedStaff.full_name,
        assigned_staff_email: selectedStaff.email,
        assigned_staff_phone: selectedStaff.phone,
        assigned_staff_department: selectedStaff.department,
        assigned_staff_designation: selectedStaff.designation
      });

      setSuccess(`Successfully assigned ${selectedStaff.full_name} to this customer`);
      setConfirmDialogOpen(false);

      // Update assigned staff state
      setAssignedStaff(selectedStaff);

      // Notify parent component
      if (onAssignmentChange) {
        onAssignmentChange(selectedStaff);
      }

      // Reset selection
      setSelectedStaffId('');
      setSelectedStaff(null);

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error assigning staff:', error);
      setError('Failed to assign staff member');
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelAssignment = () => {
    setSelectedStaffId('');
    setSelectedStaff(null);
    setConfirmDialogOpen(false);
  };

  const handleRemoveAssignment = async () => {
    try {
      setAssigning(true);
      setError(null);

      // Remove staff assignment
      await customersAPI.update(customerId, {
        assigned_staff_id: null,
        assigned_staff_name: null,
        assigned_staff_email: null,
        assigned_staff_phone: null,
        assigned_staff_department: null,
        assigned_staff_designation: null
      });

      setAssignedStaff(null);
      setSuccess('Staff assignment removed successfully');

      // Notify parent component
      if (onAssignmentChange) {
        onAssignmentChange(null);
      }

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error removing staff assignment:', error);
      setError('Failed to remove staff assignment');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <Card sx={{ mt: 2 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAdd color="primary" />
              <Typography variant="h6">
                {assignedStaff ? 'Assigned Staff Member' : 'Assign Staff Member'}
              </Typography>
            </Box>
          }
          // subheader={
          //   assignedStaff
          //     ? "This customer has an assigned staff member to handle their enquiries and requirements"
          //     : "Assign a staff member to handle this customer's enquiries and requirements"
          // }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {assignedStaff ? (
            // Show assigned staff details
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'success.main' }}>
                  {assignedStaff.full_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{assignedStaff.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assignedStaff.designation} • {assignedStaff.department}
                  </Typography>
                  <Chip label="Assigned" color="success" size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Email color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Email:</strong> {assignedStaff.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Phone:</strong> {assignedStaff.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Business color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Department:</strong> {assignedStaff.department || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAdd color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Designation:</strong> {assignedStaff.designation || 'Not specified'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveAssignment}
                  disabled={assigning}
                  startIcon={<Cancel />}
                >
                  {assigning ? 'Removing...' : 'Remove Assignment'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setAssignedStaff(null)}
                  startIcon={<PersonAdd />}
                >
                  Change Assignment
                </Button>
              </Box>
            </Box>
          ) : (
            // Show staff selection form
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Staff Member</InputLabel>
                  <Select
                    value={selectedStaffId}
                    label="Select Staff Member"
                    onChange={(e) => handleStaffSelect(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>Choose a staff member...</em>
                    </MenuItem>
                    {staff.map((staffMember) => (
                      <MenuItem key={staffMember.id} value={staffMember.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            {staffMember.full_name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {staffMember.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {staffMember.designation} • {staffMember.department}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
                  <Button
                    variant="contained"
                    onClick={handleAssignClick}
                    disabled={!selectedStaff || assigning}
                    startIcon={<PersonAdd />}
                    fullWidth
                  >
                    {assigning ? 'Assigning...' : 'Assign Staff'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}

          {selectedStaff && !assignedStaff && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" gutterBottom color="primary">
                Selected Staff Member Details:
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                  {selectedStaff.full_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedStaff.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStaff.designation} • {selectedStaff.department}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Email color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedStaff.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedStaff.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Business color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Department:</strong> {selectedStaff.department || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAdd color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Employee ID:</strong> {selectedStaff.employee_id || 'Not assigned'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !assigning && setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Staff Assignment
        </DialogTitle>
        <DialogContent>
          {selectedStaff && (
            <Box>
              <Typography gutterBottom>
                Are you sure you want to assign <strong>{selectedStaff.full_name}</strong> to handle this customer?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Department:</strong> {selectedStaff.department}<br />
                  <strong>Designation:</strong> {selectedStaff.designation}<br />
                  <strong>Email:</strong> {selectedStaff.email}<br />
                  <strong>Phone:</strong> {selectedStaff.phone || 'Not provided'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            disabled={assigning}
            startIcon={<Cancel />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAssign}
            variant="contained"
            disabled={assigning}
            startIcon={<Save />}
          >
            {assigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerStaffAssignment;