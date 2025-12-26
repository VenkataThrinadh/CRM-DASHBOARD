import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '../../loans/utils/dateFormatter';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  TextField,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Reply,
  Delete,
  Email,
  Phone,
  CalendarToday,
  Person,
  Send,
  AttachMoney,
  Home,
  LocationOn,
  PriorityHigh,
  Source,
  EventNote,
  Notes,
} from '@mui/icons-material';
import { enquiriesAPI } from '../../main-dashboard/services/api';
import LoadingScreen from '../../main-dashboard/components/common/LoadingScreen';
import EnquiryConversation from '../../main-dashboard/components/enquiries/EnquiryDetail';

const EnquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEnquiry = useCallback(async () => {
    try {
      setLoading(true);
      const res = await enquiriesAPI.getById(id);
      setEnquiry(res.data);
    } catch (error) {
      setError('Failed to load enquiry details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEnquiry();
  }, [id, fetchEnquiry]);

  const handleSendResponse = async () => {
    if (!response.trim()) return;

    try {
      setResponding(true);
      await enquiriesAPI.respond(id, response);
      setEnquiry({ ...enquiry, status: 'responded', response });
      setResponse('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to send response. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await enquiriesAPI.delete(id);
      setDeleteDialogOpen(false);
      navigate('/customers');
    } catch (error) {
      setError('Failed to delete enquiry. Please try again.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return <LoadingScreen message="Loading enquiry details..." />;
  }

  if (error && !enquiry) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          {error || 'Enquiry not found'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
          sx={{ mt: 2 }}
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'responded':
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getPriorityColor = (enquiryType) => {
    switch (enquiryType?.toLowerCase()) {
      case 'urgent':
        return 'error';
      case 'general':
        return 'info';
      case 'purchase':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/customers')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Enquiry Details
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={enquiry?.status || 'pending'}
              color={getStatusColor(enquiry?.status)}
            />
            <Chip
              label={enquiry?.enquiry_type || 'General'}
              color={getPriorityColor(enquiry?.enquiry_type)}
            />
            <Typography variant="body2" color="text.secondary">
              Enquiry ID: {enquiry?.id}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDeleteClick}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Response sent successfully!
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Customer Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {enquiry?.name || enquiry?.user_name || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email Address
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {enquiry?.email || enquiry?.user_email || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {enquiry?.phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Enquiry Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {enquiry?.created_at ? formatDateDDMMYYYY(enquiry.created_at) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Enquiry Message */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Enquiry Message
            </Typography>
            <Typography variant="body1" paragraph>
              {enquiry?.message || 'No message provided.'}
            </Typography>

            {enquiry?.subject && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Subject: <strong>{enquiry.subject}</strong>
                </Typography>
              </>
            )}

            {enquiry?.unit_type && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Unit Type: <strong>{enquiry.unit_type}</strong>
                </Typography>
              </>
            )}
          </Paper>

          {/* Property Requirements */}
          {(enquiry?.property_type || enquiry?.preferred_location || enquiry?.budget_min || enquiry?.budget_max || enquiry?.requirements) && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                <Home sx={{ mr: 1 }} />
                Property Requirements
              </Typography>
              <Grid container spacing={2}>
                {enquiry?.property_type && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Home sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Property Type
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {enquiry.property_type}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {enquiry?.preferred_location && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Preferred Location
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {enquiry.preferred_location}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {(enquiry?.budget_min || enquiry?.budget_max) && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AttachMoney sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Budget Range
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {enquiry.budget_min && enquiry.budget_max
                            ? `₹${enquiry.budget_min} - ₹${enquiry.budget_max}`
                            : enquiry.budget_min
                            ? `From ₹${enquiry.budget_min}`
                            : enquiry.budget_max
                            ? `Up to ₹${enquiry.budget_max}`
                            : 'Not specified'
                          }
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {enquiry?.requirements && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Specific Requirements
                    </Typography>
                    <Typography variant="body1">
                      {enquiry.requirements}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Enquiry Metadata */}
          {(enquiry?.priority || enquiry?.source || enquiry?.follow_up_date || enquiry?.notes) && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Enquiry Details
              </Typography>
              <Grid container spacing={2}>
                {enquiry?.priority && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PriorityHigh sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Priority
                        </Typography>
                        <Chip
                          label={enquiry.priority}
                          size="small"
                          color={
                            enquiry.priority === 'urgent' ? 'error' :
                            enquiry.priority === 'high' ? 'warning' :
                            enquiry.priority === 'medium' ? 'info' : 'default'
                          }
                        />
                      </Box>
                    </Box>
                  </Grid>
                )}
                {enquiry?.source && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Source sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Source
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {enquiry.source}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {enquiry?.follow_up_date && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EventNote sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Follow-up Date
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDateDDMMYYYY(enquiry.follow_up_date)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {enquiry?.notes && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <Notes sx={{ mr: 1, color: 'primary.main', fontSize: 18, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Internal Notes
                        </Typography>
                        <Typography variant="body1">
                          {enquiry.notes}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {/* Previous Response */}
          {enquiry?.response && (
            <Paper sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Previous Response
              </Typography>
              <Typography variant="body1" paragraph>
                {enquiry.response}
              </Typography>
            </Paper>
          )}

          {/* Response Form */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Send Response
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Type your response here..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              margin="normal"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleSendResponse}
                disabled={!response.trim() || responding}
              >
                {responding ? 'Sending...' : 'Send Response'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Actions
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Email />}
                sx={{ mb: 1 }}
                href={`mailto:${enquiry?.email || enquiry?.user_email}`}
              >
                Send Email
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Phone />}
                sx={{ mb: 1 }}
                href={`tel:${enquiry?.phone}`}
              >
                Call Customer
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Reply />}
                onClick={() => {
                  const responseField = document.querySelector('textarea');
                  if (responseField) {
                    responseField.focus();
                  }
                }}
              >
                Quick Reply
              </Button>
            </CardContent>
          </Card>

          {/* Enquiry Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Enquiry Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Property
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {enquiry?.property_title || `Property ID: ${enquiry?.property_id}` || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Plot Number
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {enquiry?.plot_number || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Enquiry Type
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {enquiry?.enquiry_type || 'General'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={enquiry?.status || 'pending'}
                  size="small"
                  color={getStatusColor(enquiry?.status)}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Priority
                </Typography>
                <Chip
                  label={enquiry?.priority || 'medium'}
                  size="small"
                  color={
                    enquiry?.priority === 'urgent' ? 'error' :
                    enquiry?.priority === 'high' ? 'warning' :
                    enquiry?.priority === 'medium' ? 'info' : 'default'
                  }
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Source
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {enquiry?.source || 'website'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {enquiry?.created_at ? formatDateDDMMYYYY(enquiry.created_at) : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {enquiry?.updated_at ? formatDateDDMMYYYY(enquiry.updated_at) : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
            {/* Conversation component (chat) - embedded here to avoid replacing full page */}
            <Box sx={{ mt: 3 }}>
              <EnquiryConversation enquiryId={id} embedded />
            </Box>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Enquiry
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this enquiry? This action cannot be undone.
            <br /><br />
            <strong>Customer:</strong> {enquiry?.name || enquiry?.user_name || 'N/A'}
            <br />
            <strong>Property:</strong> {enquiry?.property_title || 'N/A'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnquiryDetail;