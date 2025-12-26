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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Email,
  Phone,
  CalendarToday,
  Person,
  Source,
  Message,
  SaveAlt,
  Close,
  Flag,
} from '@mui/icons-material';
import { leadsAPI } from '../../main-dashboard/services/api';
import LoadingScreen from '../../main-dashboard/components/common/LoadingScreen';

const SOURCE_OPTIONS = ['facebook', 'instagram', 'youtube', 'linkedin', 'twitter', 'website', 'google', 'whatsapp', 'other'];
const STATUS_OPTIONS = ['New', 'Working Lead', 'On-Hold Lead', 'Unqualified Lead', 'Site Planned Lead', 'Site Visit Completed Lead', 'Qualified', 'Lost'];

function StatusChip({ status }) {
  const color = {
    'New': 'default',
    'Working Lead': 'info',
    'On-Hold Lead': 'warning',
    'Unqualified Lead': 'error',
    'Site Planned Lead': 'secondary',
    'Site Visit Completed Lead': 'info',
    'Qualified': 'warning',
    'Lost': 'error'
  }[status] || 'default';
  return <Chip size="small" color={color} label={status} sx={{ textTransform: 'capitalize' }} />;
}

function SourceChip({ source }) {
  const s = String(source || '').toLowerCase();
  const displayName = s
    ? (s === 'fb' || s === 'facebook' || s === 'meta' ? 'Facebook'
      : s === 'ig' || s === 'instagram' ? 'Instagram'
      : s === 'yt' || s === 'youtube' ? 'YouTube'
      : s === 'linkedin' ? 'LinkedIn'
      : s === 'twitter' ? 'Twitter'
      : s === 'website' ? 'Website'
      : s === 'google' ? 'Google'
      : s === 'whatsapp' ? 'WhatsApp'
      : s === 'other' ? 'Other'
      : s.charAt(0).toUpperCase() + s.slice(1))
    : 'N/A';

  return (
    <Chip
      label={displayName}
      size="small"
      color="info"
      variant="outlined"
      sx={{ textTransform: 'capitalize' }}
    />
  );
}

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    source: '',
    status: '',
    campaign: ''
  });

    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [showAddConversation, setShowAddConversation] = useState(false);
    const [conversationDate, setConversationDate] = useState(new Date().toISOString().split('T')[0]);
    const [conversationText, setConversationText] = useState('');
    const [conversationType, setConversationType] = useState('call');
    const [conversationNotes, setConversationNotes] = useState('');
    const [savingConversation, setSavingConversation] = useState(false);
    const [conversationError, setConversationError] = useState(null);
    const [editingConversation, setEditingConversation] = useState(null);
    const [showEditConversation, setShowEditConversation] = useState(false);
  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leadsAPI.getById(id);
      const leadData = response.data || response;
      setLead(leadData);
      setEditFormData({
        name: leadData.name || '',
        email: leadData.email || '',
        phone: leadData.phone || '',
        message: leadData.message || '',
        source: leadData.source || '',
        status: leadData.status || '',
        campaign: leadData.campaign || ''
      });
    } catch (error) {
      setError('Failed to load lead details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [id, fetchLead]);
    const fetchConversations = useCallback(async () => {
      try {
        setLoadingConversations(true);
        const response = await leadsAPI.getConversations(id);
        const convoData = response.data || response || [];
        setConversations(Array.isArray(convoData) ? convoData : []);
      } catch (error) {
        setConversations([]);
      } finally {
        setLoadingConversations(false);
      }
    }, [id]);

    useEffect(() => {
      fetchLead();
      fetchConversations();
    }, [id, fetchLead, fetchConversations]);

  const handleCancel = () => {
    setIsEditing(false);
    if (lead) {
      setEditFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        message: lead.message || '',
        source: lead.source || '',
        status: lead.status || '',
        campaign: lead.campaign || ''
      });
    }
    setError(null);
  };

  const handleSave = async () => {
    if (!editFormData.name || !editFormData.email || !editFormData.source || !editFormData.status) {
      setError('Please fill in all required fields (Name, Email, Source, Status)');
      return;
    }

    try {
      setIsSaving(true);
      const response = await leadsAPI.update(id, editFormData);
      const updatedLead = response.data || response;
      setLead(updatedLead);
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to save lead. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await leadsAPI.delete(id);
      setDeleteDialogOpen(false);
      navigate('/leads');
    } catch (error) {
      setError('Failed to delete lead. Please try again.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Enter edit mode
  const handleEditClick = () => {
    setError(null);
    setIsEditing(true);
  };

    const handleSaveConversation = async () => {
      if (!conversationText.trim()) {
        setConversationError('Conversation text is required');
        return;
      }

      try {
        setSavingConversation(true);
        setConversationError(null);
        const response = await leadsAPI.saveConversation(id, {
          conversation_date: conversationDate,
          conversation_text: conversationText,
          conversation_type: conversationType,
          notes: conversationNotes
        });
        setConversations([response.data || response, ...conversations]);
        setConversationDate(new Date().toISOString().split('T')[0]);
        setConversationText('');
        setConversationType('call');
        setConversationNotes('');
        setShowAddConversation(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        setConversationError(error.response?.data?.error || 'Failed to save conversation');
      } finally {
        setSavingConversation(false);
      }
    };

    const handleDeleteConversation = async (conversationId) => {
      try {
        await leadsAPI.deleteConversation(id, conversationId);
        setConversations(conversations.filter(c => c.id !== conversationId));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        setError('Failed to delete conversation');
      }
    };

    const handleEditConversation = (conversation) => {
      setEditingConversation(conversation);
      setConversationDate(conversation.conversation_date);
      setConversationText(conversation.conversation_text);
      setConversationType(conversation.conversation_type || 'call');
      setConversationNotes(conversation.notes || '');
      setShowEditConversation(true);
    };

    const handleUpdateConversation = async () => {
      if (!conversationText.trim()) {
        setConversationError('Conversation text is required');
        return;
      }

      try {
        setSavingConversation(true);
        setConversationError(null);
        const response = await leadsAPI.saveConversation(id, {
          conversation_date: conversationDate,
          conversation_text: conversationText,
          conversation_type: conversationType,
          notes: conversationNotes
        });
        setConversations(conversations.map(c => c.id === editingConversation.id ? (response.data || response) : c));
        setEditingConversation(null);
        setConversationDate(new Date().toISOString().split('T')[0]);
        setConversationText('');
        setConversationType('call');
        setConversationNotes('');
        setShowEditConversation(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        setConversationError(error.response?.data?.error || 'Failed to update conversation');
      } finally {
        setSavingConversation(false);
      }
    };
  if (loading) {
    return <LoadingScreen message="Loading lead details..." />;
  }

  if (error && !lead) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          {error || 'Lead not found'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/leads')}
          sx={{ mt: 2 }}
        >
          Back to Leads
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/leads')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Lead Details
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <StatusChip status={lead?.status || 'new'} />
            <SourceChip source={lead?.source} />
            <Typography variant="body2" color="text.secondary">
              Lead ID: {lead?.id}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isEditing && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleEditClick}
            >
              Edit
            </Button>
          )}
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
          Lead updated successfully!
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      {isEditing ? (
        // Edit Mode
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
            Edit Lead Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
                error={!editFormData.name && isSaving}
                helperText={!editFormData.name && isSaving ? 'Name is required' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                fullWidth
                required
                error={!editFormData.email && isSaving}
                helperText={!editFormData.email && isSaving ? 'Email is required' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Source"
                value={editFormData.source}
                onChange={(e) => setEditFormData(prev => ({ ...prev, source: e.target.value }))}
                fullWidth
                required
                error={!editFormData.source && isSaving}
                helperText={!editFormData.source && isSaving ? 'Source is required' : ''}
              >
                {SOURCE_OPTIONS.map(source => (
                  <MenuItem key={source} value={source}>
                    {source.charAt(0).toUpperCase() + source.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                value={editFormData.status}
                onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                fullWidth
                required
                error={!editFormData.status && isSaving}
                helperText={!editFormData.status && isSaving ? 'Status is required' : ''}
              >
                {STATUS_OPTIONS.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Campaign"
                value={editFormData.campaign}
                onChange={(e) => setEditFormData(prev => ({ ...prev, campaign: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Message"
                value={editFormData.message}
                onChange={(e) => setEditFormData(prev => ({ ...prev, message: e.target.value }))}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveAlt />}
              onClick={handleSave}
              disabled={isSaving || !editFormData.name || !editFormData.email || !editFormData.source || !editFormData.status}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      ) : (
        // View Mode
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Personal Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Name
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {lead?.name || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Email
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Email sx={{ mr: 1, fontSize: '1.2rem' }} />
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {lead?.email || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Phone
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Phone sx={{ mr: 1, fontSize: '1.2rem' }} />
                    <Typography variant="body2">
                      {lead?.phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Lead Status Information */}
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Flag sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Lead Status
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <StatusChip status={lead?.status} />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Source
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <SourceChip source={lead?.source} />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Campaign
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {lead?.campaign || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <CalendarToday sx={{ mr: 1, fontSize: '1.2rem' }} />
                    <Typography variant="body2">
                      {lead?.created_at ? formatDateDDMMYYYY(lead.created_at) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Daily Conversations */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Message sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6" fontWeight="bold">
                        Daily Conversations & Follow-ups
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setShowAddConversation(true)}
                    >
                      Add Conversation
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {loadingConversations ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading conversations...
                    </Typography>
                  ) : conversations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      No conversations logged yet
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><strong>Conversation Date</strong></TableCell>
                            <TableCell><strong>Lead Name</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Message</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {conversations
                            .sort((a, b) => new Date(b.conversation_date) - new Date(a.conversation_date))
                            .map((conversation) => (
                              <TableRow key={conversation.id}>
                                <TableCell>{conversation.conversation_date}</TableCell>
                                <TableCell>{lead?.name || 'N/A'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={conversation.conversation_type || 'call'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell sx={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {conversation.conversation_text}
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleEditConversation(conversation)}
                                    title="Edit"
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteConversation(conversation.id)}
                                    title="Delete"
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          {/* Additional Information */}
          {lead?.platform_id && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Additional Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Platform Reference ID
                    </Typography>
                    <Typography variant="body2">
                      {lead?.platform_id}
                    </Typography>
                  </Box>

                  {lead?.metadata && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Metadata
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {typeof lead.metadata === 'string' ? lead.metadata : JSON.stringify(lead.metadata, null, 2)}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      {/* Add Conversation Dialog */}
      <Dialog open={showAddConversation} onClose={() => setShowAddConversation(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Conversation</DialogTitle>
        <DialogContent>
          {conversationError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setConversationError(null)}>
              {conversationError}
            </Alert>
          )}
          <TextField
            label="Date"
            type="date"
            value={conversationDate}
            onChange={(e) => setConversationDate(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Type"
            value={conversationType}
            onChange={(e) => setConversationType(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            {['call', 'sms', 'email', 'meeting', 'whatsapp', 'other'].map((t) => (
              <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Conversation Text"
            value={conversationText}
            onChange={(e) => setConversationText(e.target.value)}
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Notes (optional)"
            value={conversationNotes}
            onChange={(e) => setConversationNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddConversation(false)} disabled={savingConversation}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveConversation} disabled={savingConversation || !conversationText.trim()}>
            {savingConversation ? 'Saving...' : 'Save Conversation'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Conversation Dialog */}
      <Dialog open={showEditConversation} onClose={() => setShowEditConversation(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Conversation</DialogTitle>
        <DialogContent>
          {conversationError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setConversationError(null)}>
              {conversationError}
            </Alert>
          )}
          <TextField
            label="Date"
            type="date"
            value={conversationDate}
            onChange={(e) => setConversationDate(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Type"
            value={conversationType}
            onChange={(e) => setConversationType(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            {['call', 'sms', 'email', 'meeting', 'whatsapp', 'other'].map((t) => (
              <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Conversation Text"
            value={conversationText}
            onChange={(e) => setConversationText(e.target.value)}
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Notes (optional)"
            value={conversationNotes}
            onChange={(e) => setConversationNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditConversation(false)} disabled={savingConversation}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateConversation} disabled={savingConversation || !conversationText.trim()}>
            {savingConversation ? 'Updating...' : 'Update Conversation'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the lead for "{lead?.name || lead?.email}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadDetail;
