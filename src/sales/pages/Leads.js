import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY } from '../../loans/utils/dateFormatter';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Delete,
  Refresh,
  Add,
  Visibility,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { leadsAPI } from '../../main-dashboard/services/api';

const SOURCE_OPTIONS = ['facebook','instagram','youtube','linkedin','twitter','website','google','whatsapp','other'];
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

const Leads = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [pageSize, setPageSize] = useState(isMobile ? 10 : 25);

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    source: '',
    status: '',
    campaign: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend enforces a per-request limit (default 20, max 100).
      // To load all leads, page through the API and accumulate results.
      const perPage = 100; // backend caps to 100
      let page = 1;
      let allLeads = [];
      let total = null;

      while (true) {
        const response = await leadsAPI.getAll({ page, limit: perPage });
        const data = response.data || {};
        const leadsData = data.leads || [];
        total = data.total ?? total;
        allLeads = allLeads.concat(leadsData);

        // If we've loaded all leads or the API returned fewer than requested, stop.
        if (total !== null && allLeads.length >= total) break;
        if (leadsData.length < perPage) break;

        page += 1;
      }

      setLeads(allLeads);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to load leads. Please try again.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };


  // Handle delete lead
  const handleDelete = (lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    try {
      await leadsAPI.delete(leadToDelete.id);
      setLeads(leads.filter(lead => lead.id !== leadToDelete.id));
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    } catch (error) {
      setError('Failed to delete lead. Please try again.');
    }
  };

  // Handle edit lead
  const handleEdit = (lead) => {
    setEditingLead(lead);
    setEditFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      message: lead.message || '',
      source: lead.source || '',
      status: lead.status || '',
      campaign: lead.campaign || ''
    });
    setEditDialogOpen(true);
  };

  // Handle add new lead
  const handleAdd = () => {
    setEditingLead(null); // null indicates we're adding a new lead
    setEditFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      source: '',
      status: 'new',
      campaign: ''
    });
    setEditDialogOpen(true);
  };

  // Save lead (create or update)
  const handleSave = async () => {
    // Validate required fields
    if (!editFormData.name || !editFormData.email || !editFormData.source || !editFormData.status) {
      setError('Please fill in all required fields (Name, Email, Source, Status)');
      return;
    }

    setFormLoading(true);
    try {
      let savedLead;

      if (editingLead) {
        // Update existing lead
        const response = await leadsAPI.update(editingLead.id, editFormData);
        savedLead = response.data || response;
        setLeads(leads.map(lead =>
          lead.id === editingLead.id ? { ...lead, ...savedLead } : lead
        ));
      } else {
        // Create new lead
        const response = await leadsAPI.create(editFormData);
        savedLead = response.data || response;
        setLeads([savedLead, ...leads]); // Add new lead to the beginning of the list
      }

      setEditDialogOpen(false);
      setEditingLead(null);
      setEditFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        source: '',
        status: '',
        campaign: ''
      });
      setError(null); // Clear any previous errors
    } catch (error) {
      // console.error('Save lead error:', error); // Commented out to avoid ESLint no-console warning
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save lead. Please try again.';
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };


  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.source?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value || 'N/A'}
          </Typography>
          {params.row.platform_id && (
            <Typography variant="caption" color="text.secondary">
              Ref: {params.row.platform_id}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 120,
      renderCell: (params) => (
        (() => {
          // Prefer platform information from metadata.raw.platform when available
          let src = (params.value || '') + '';
          const metaRaw = params.row?.metadata;
          if (metaRaw) {
            try {
              const metaObj = typeof metaRaw === 'string' ? JSON.parse(metaRaw) : metaRaw;
              const p = metaObj?.raw?.platform || metaObj?.platform || metaObj?.raw?.source || metaObj?.source;
              if (p) src = String(p);
            } catch (e) {
              // ignore parse errors and fall back to params.value
            }
          }

          const s = String(src || '').toLowerCase();
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
        })()
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <StatusChip status={params.value} />
      ),
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? formatDateDDMMYYYY(params.value) : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
            setSelectedLead(params.row);
          }}
        >
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Page Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: isMobile ? 2 : 3,
        flexDirection: isSmallScreen ? 'column' : 'row',
        gap: isSmallScreen ? 2 : 0
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            gutterBottom
            fontWeight="bold"
            sx={{ fontSize: isSmallScreen ? '1.5rem' : isMobile ? '1.75rem' : '2.125rem' }}
          >
            Leads Management
          </Typography>
          <Typography
            variant={isMobile ? "body2" : "body1"}
            color="text.secondary"
            sx={{ maxWidth: isSmallScreen ? '100%' : '500px' }}
          >
            Manage customer leads and track their progress ({leads.length} leads loaded)
          </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          gap: isMobile ? 1 : 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          width: isSmallScreen ? '100%' : 'auto'
        }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchLeads}
            disabled={loading}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            size={isMobile ? "small" : "large"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            {isMobile ? 'Add' : 'Add Lead'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 2 : 3 }}>
        <Box sx={{
          display: 'flex',
          gap: isMobile ? 1 : 2,
          alignItems: 'center',
          flexDirection: isSmallScreen ? 'column' : 'row'
        }}>
          <TextField
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, width: isSmallScreen ? '100%' : 'auto' }}
            size={isMobile ? "small" : "medium"}
          />
        </Box>
      </Paper>

      {/* Leads Table */}
      <Paper sx={{
        height: isMobile ? 400 : 600,
        width: '100%',
        overflow: 'hidden'
      }}>
        <DataGrid
          rows={filteredLeads}
          columns={columns}
          pageSize={pageSize}
          rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
          loading={loading}
          disableSelectionOnClick
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          noRowsOverlay={() => (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No leads found
              </Typography>
              <Typography variant="body2" color="text.disabled" textAlign="center">
                {searchTerm ? 'Try adjusting your search terms' : 'Leads from various sources will appear here'}
              </Typography>
              <Button
                variant="outlined"
                onClick={fetchLeads}
                sx={{ mt: 2 }}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </Box>
          )}
          sx={{
            border: 'none',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
              padding: isMobile ? '8px' : '16px',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#fafafa',
              borderBottom: '2px solid #e0e0e0',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: 600,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              fontWeight: 600,
            },
            '& .MuiDataGrid-row': {
              minHeight: isMobile ? 60 : 52,
            },
          }}
        />
      </Paper>

      {/* Add/Edit Lead Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          if (!formLoading) {
            setEditDialogOpen(false);
            setEditingLead(null);
            setEditFormData({
              name: '',
              email: '',
              phone: '',
              message: '',
              source: '',
              status: '',
              campaign: ''
            });
            setError(null);
          }
        }}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={formLoading}
      >
        <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              size="small"
              required
              error={!editFormData.name && formLoading}
              helperText={!editFormData.name && formLoading ? 'Name is required' : ''}
            />
            <TextField
              label="Email"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              size="small"
              required
              error={!editFormData.email && formLoading}
              helperText={!editFormData.email && formLoading ? 'Email is required' : ''}
            />
            <TextField
              label="Phone"
              value={editFormData.phone}
              onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Message"
              value={editFormData.message}
              onChange={(e) => setEditFormData(prev => ({ ...prev, message: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              size="small"
            />
            <TextField
              select
              label="Source"
              value={editFormData.source}
              onChange={(e) => setEditFormData(prev => ({ ...prev, source: e.target.value }))}
              fullWidth
              size="small"
              required
            >
              {SOURCE_OPTIONS.map(source => (
                <MenuItem key={source} value={source}>
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={editFormData.status}
              onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
              fullWidth
              size="small"
              required
            >
              {STATUS_OPTIONS.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Campaign"
              value={editFormData.campaign}
              onChange={(e) => setEditFormData(prev => ({ ...prev, campaign: e.target.value }))}
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditingLead(null);
              setEditFormData({
                name: '',
                email: '',
                phone: '',
                message: '',
                source: '',
                status: '',
                campaign: ''
              });
              setError(null);
            }}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={formLoading || !editFormData.name || !editFormData.email || !editFormData.source || !editFormData.status}
          >
            {formLoading ? (editingLead ? 'Updating...' : 'Creating...') : (editingLead ? 'Update Lead' : 'Create Lead')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the lead for "{leadToDelete?.name || leadToDelete?.email}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (selectedLead) navigate(`/leads/${selectedLead.id}`);
          setAnchorEl(null);
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedLead) handleEdit(selectedLead);
          setAnchorEl(null);
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit Lead
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedLead) handleDelete(selectedLead);
          setAnchorEl(null);
        }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Lead
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Leads;