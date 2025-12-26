import React, { useState, useEffect } from 'react';
import {
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  InputAdornment,
  TableSortLabel,
  TablePagination,
  Popover,
  Avatar,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import { teamsAPI, staffAPI, propertiesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Department-specific roles configuration
const DEPARTMENT_ROLES = {
  sales: [
    { key: 'project_director', label: 'Projects Director', designation: 'Projects Director' },
    { key: 'project_manager', label: 'Project Manager', designation: 'Project Manager' },
    { key: 'sales_executive', label: 'Sales Executive', designation: 'Sales Executive' },
    { key: 'telecaller', label: 'Telecaller', designation: 'Telecaller' }
  ],
  marketing: [
    { key: 'marketing_director', label: 'Marketing Director', designation: 'Marketing Director' },
    { key: 'marketing_manager', label: 'Marketing Manager', designation: 'Marketing Manager' },
    { key: 'digital_marketing_executive', label: 'Digital Marketing Executive', designation: 'Digital Marketing Executive' },
    { key: 'content_social_media_executive', label: 'Content / Social Media Executive', designation: 'Content / Social Media Executive' },
    { key: 'performance_marketing_executive', label: 'Performance Marketing Executive', designation: 'Performance Marketing Executive' }
  ],
  operations: [
    { key: 'operations_director', label: 'Operations Director', designation: 'Operations Director' },
    { key: 'operations_manager', label: 'Operations Manager', designation: 'Operations Manager' },
    { key: 'site_operations_executive', label: 'Site Operations Executive', designation: 'Site Operations Executive' },
    { key: 'facility_site_supervisor', label: 'Facility / Site Supervisor', designation: 'Facility / Site Supervisor' },
    { key: 'vendor_coordinator', label: 'Vendor Coordinator', designation: 'Vendor Coordinator' },
    { key: 'procurement_executive', label: 'Procurement Executive', designation: 'Procurement Executive' }
  ],
  finance: [
    { key: 'finance_director', label: 'Finance Director', designation: 'Finance Director' },
    { key: 'finance_manager', label: 'Finance Manager', designation: 'Finance Manager' },
    { key: 'accounts_executive', label: 'Accounts Executive', designation: 'Accounts Executive' },
    { key: 'billing_collection_executive', label: 'Billing / Collection Executive', designation: 'Billing / Collection Executive' },
    { key: 'loan_processing_executive', label: 'Loan Processing Executive', designation: 'Loan Processing Executive' },
    { key: 'compliance_executive', label: 'Compliance Executive', designation: 'Compliance Executive' }
  ],
  hr: [
    { key: 'hr_head', label: 'HR Head', designation: 'HR Head' },
    { key: 'hr_manager', label: 'HR Manager', designation: 'HR Manager' },
    { key: 'hr_executive', label: 'HR Executive', designation: 'HR Executive' },
    { key: 'recruiter', label: 'Recruiter', designation: 'Recruiter' }
  ],
  it: [
    { key: 'it_director', label: 'IT Director', designation: 'IT Director' },
    { key: 'system_administrator', label: 'System Administrator', designation: 'System Administrator' },
    { key: 'application_support_engineer', label: 'Application Support Engineer', designation: 'Application Support Engineer' },
    { key: 'it_support_executive', label: 'IT Support Executive', designation: 'IT Support Executive' }
  ]
};

const getRolesForDepartment = (dept) => DEPARTMENT_ROLES[dept] || DEPARTMENT_ROLES['sales'];

const DEPARTMENTS = [
  { value: 'sales', label: 'Sales', color: '#1976d2' },
  { value: 'marketing', label: 'Marketing', color: '#d32f2f' },
  { value: 'operations', label: 'Operations', color: '#f57c00' },
  { value: 'finance', label: 'Finance', color: '#388e3c' },
  { value: 'hr', label: 'HR', color: '#7b1fa2' },
  { value: 'it', label: 'IT', color: '#0097a7' },
  { value: 'management', label: 'Management', color: '#5e35b1' }
];

// Mapping for department colors
const getDepartmentColor = (dept) => {
  return DEPARTMENTS.find(d => d.value === dept)?.color || '#999';
};

const ManageTeams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [membersPopover, setMembersPopover] = useState({ anchorEl: null, teamId: null });

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    project_id: '',
    department: 'sales',
    members: getRolesForDepartment('sales').reduce((acc, r) => ({ ...acc, [r.key]: null }), {})
  });

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [teamsRes, staffRes, propsRes] = await Promise.all([
        teamsAPI.getAll(),
        staffAPI.getAll({ limit: 1000 }),
        propertiesAPI.getAll()
      ]);
      
      setTeams(teamsRes.data.teams || []);
      setStaff(staffRes.data.staff || []);
      setProperties(propsRes.data.properties || propsRes.data || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Get staff filtered by department and designation (case-insensitive)
  const getStaffByRole = (roleKey) => {
    const roles = getRolesForDepartment(formData.department);
    const roleObj = roles.find(r => r.key === roleKey);
    const targetDesignation = roleObj ? roleObj.designation.toLowerCase() : roleKey.toLowerCase();
    return staff.filter(s =>
      s.designation &&
      s.designation.toLowerCase().includes(targetDesignation) &&
      s.status === 'active' &&
      s.department === formData.department
    );
  };

  const handleOpenDialog = (team = null) => {
    if (team) {
      // Edit mode
      setIsEditing(true);
      const dept = team.department || 'sales';
      const memberMap = getRolesForDepartment(dept).reduce((acc, r) => ({ ...acc, [r.key]: null }), {});

      team.members?.forEach(m => {
        if (memberMap.hasOwnProperty(m.role)) memberMap[m.role] = m.staff_id;
      });

      setFormData({
        id: team.id,
        name: team.name,
        project_id: team.project_id || '',
        department: dept,
        members: memberMap
      });
    } else {
      // Create mode
      setIsEditing(false);
      setFormData({
        id: null,
        name: '',
        project_id: '',
        department: 'sales',
        members: getRolesForDepartment('sales').reduce((acc, r) => ({ ...acc, [r.key]: null }), {})
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      id: null,
      name: '',
      project_id: '',
      department: 'sales',
      members: getRolesForDepartment('sales').reduce((acc, r) => ({ ...acc, [r.key]: null }), {})
    });
  };

  const handleSaveTeam = async () => {
    if (!formData.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    const members = Object.entries(formData.members)
      .filter(([_, staffId]) => staffId !== null && staffId !== '')
      .map(([role, staffId]) => ({
        staff_id: parseInt(staffId),
        role
      }));

    if (members.length === 0) {
      toast.error('Add at least one team member');
      return;
    }

    const payload = {
      name: formData.name,
      project_id: formData.project_id ? parseInt(formData.project_id) : null,
      department: formData.department,
      members
    };

    try {
      if (isEditing) {
        await teamsAPI.update(formData.id, payload);
        toast.success('Team updated successfully');
      } else {
        await teamsAPI.create(payload);
        toast.success('Team created successfully');
      }
      handleCloseDialog();
      loadAllData();
    } catch (error) {
      toast.error('Failed to save team');
      console.error(error);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      await teamsAPI.delete(teamId);
      toast.success('Team deleted successfully');
      setDeleteConfirm(null);
      loadAllData();
    } catch (error) {
      toast.error('Failed to delete team');
      console.error(error);
    }
  };

  const getStaffName = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.full_name : '-';
  };

  const getProjectName = (projectId) => {
    const project = properties.find(p => p.id === projectId);
    return project ? project.title : '-';
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAndSortedTeams = () => {
    let filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'department') {
        aValue = DEPARTMENTS.find(d => d.value === a.department)?.label || a.department;
        bValue = DEPARTMENTS.find(d => d.value === b.department)?.label || b.department;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMembersPopoverOpen = (event, teamId) => {
    event.stopPropagation();
    setMembersPopover({ anchorEl: event.currentTarget, teamId });
  };

  const handleMembersPopoverClose = () => {
    setMembersPopover({ anchorEl: null, teamId: null });
  };

  const getTeamMembers = () => {
    if (!membersPopover.teamId) return [];
    const team = teams.find(t => t.id === membersPopover.teamId);
    return team?.members || [];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* Back Button and Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: 'none', color: 'primary.main' }}
        >
          Back User Management
        </Button>
      </Box>

      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Manage Teams
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Create and manage department-wise teams with specific roles. Assign project directors, managers, executives, and telecallers.
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Total Teams: <strong>{teams.length}</strong>
        </Typography>
      </Box>

      {/* Action Bar */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3, 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ fontWeight: 600 }}
        >
          Create New Team
        </Button>
        
        {teams.length > 0 && (
          <TextField
            size="small"
            placeholder="Search teams by name or department..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'action.active' }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300, backgroundColor: 'white' }}
          />
        )}
      </Box>

      {teams.length === 0 ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          border: '2px dashed #ddd',
          borderRadius: 2
        }}>
          <Box sx={{ mb: 2 }}>
            <AddIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
          </Box>
          <Typography variant="h6" gutterBottom>
            No Teams Yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Get started by creating your first team. Teams organize your staff by department and role.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ fontWeight: 600 }}
          >
            Create First Team
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Team Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={orderBy === 'department'}
                    direction={orderBy === 'department' ? order : 'asc'}
                    onClick={() => handleSort('department')}
                  >
                    Department
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={orderBy === 'project_id'}
                    direction={orderBy === 'project_id' ? order : 'asc'}
                    onClick={() => handleSort('project_id')}
                  >
                    Project
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Members</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedTeams()
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(team => (
                  <TableRow key={team.id} hover sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { backgroundColor: '#fafafa' }
                  }}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {team.name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={DEPARTMENTS.find(d => d.value === team.department)?.label || team.department}
                        size="small"
                        sx={{
                          backgroundColor: getDepartmentColor(team.department),
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {getProjectName(team.project_id)}
                    </TableCell>
                    <TableCell>
                      {team.members && team.members.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {team.members.slice(0, 2).map(m => (
                            <Chip
                              key={`${team.id}-${m.staff_id}`}
                              label={`${m.full_name || 'Unknown'}`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                maxWidth: '150px',
                                '& .MuiChip-label': {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }
                              }}
                            />
                          ))}
                          {team.members.length > 2 && (
                            <Chip
                              icon={<InfoIcon sx={{ color: 'white !important' }} />}
                              label={`+${team.members.length - 2} more`}
                              size="small"
                              onClick={(e) => handleMembersPopoverOpen(e, team.id)}
                              sx={{ 
                                cursor: 'pointer', 
                                backgroundColor: '#1976d2',
                                color: 'white',
                                fontWeight: 600,
                                '&:hover': {
                                  backgroundColor: '#1565c0'
                                }
                              }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          No members assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(team)}
                        title="Edit team"
                        sx={{ '&:hover': { backgroundColor: 'primary.light', opacity: 0.1 } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirm(team.id)}
                        title="Delete team"
                        sx={{ '&:hover': { backgroundColor: 'error.light', opacity: 0.1 } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAndSortedTeams().length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ backgroundColor: '#fafafa' }}
          />
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          fontWeight: 600, 
          fontSize: '1.3rem',
          borderBottom: '1px solid #eee'
        }}>
          {isEditing ? '✏️ Edit Team' : '➕ Create New Team'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Team Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            placeholder="e.g., North Block Sales Team"
            variant="outlined"
            helperText="Give your team a descriptive name"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Project (Optional)</InputLabel>
            <Select
              value={formData.project_id}
              label="Project (Optional)"
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            >
              <MenuItem value="">None</MenuItem>
              {properties.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Department</InputLabel>
            <Select
              value={formData.department}
              label="Department"
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              {DEPARTMENTS.map(dept => (
                <MenuItem key={dept.value} value={dept.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: dept.color,
                      }}
                    />
                    {dept.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ 
            mt: 3, 
            mb: 2,
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            borderLeft: `4px solid ${getDepartmentColor(formData.department)}`
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Team Members for {DEPARTMENTS.find(d => d.value === formData.department)?.label} Department
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Staff are filtered by department and their designated role
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {getRolesForDepartment(formData.department).map((role) => {
              const roleKey = role.key;
              const roleLabel = role.label;
              const availableStaff = getStaffByRole(roleKey);
              return (
                <Grid item xs={12} sm={6} key={roleKey}>
                  <FormControl fullWidth>
                    <InputLabel>{roleLabel}</InputLabel>
                    <Select
                      value={formData.members[roleKey] || ''}
                      label={roleLabel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          members: { ...formData.members, [roleKey]: e.target.value }
                        })
                      }
                    >
                      <MenuItem value="">None</MenuItem>
                      {availableStaff.map(s => (
                        <MenuItem key={s.id} value={s.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{s.full_name}</span>
                            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                              ({s.designation})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {availableStaff.length === 0 && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        ⚠️ No staff available with "{role.designation}" designation
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              );
            })}
          </Grid>

          {staff.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }} icon={<Typography>⚠️</Typography>}>
              <Typography variant="body2">
                <strong>No staff members available.</strong> Please create staff members with proper designations first.
              </Typography>
            </Alert>
          )}

          <Alert severity="info" sx={{ mt: 2 }} icon={<Typography>ℹ️</Typography>}>
            <Typography variant="caption">
              <strong>How it works:</strong> Only staff members with matching designations in the selected department will appear. 
              Ensure staff are assigned the correct designation and department before adding them to teams.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={handleCloseDialog} sx={{ fontWeight: 500 }}>
            Cancel
          </Button>
          <Button onClick={handleSaveTeam} variant="contained" color="primary" sx={{ fontWeight: 600 }}>
            {isEditing ? '💾 Update Team' : '➕ Create Team'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>
          🗑️ Delete Team
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            Are you sure you want to delete this team? This action cannot be undone and will remove all team member assignments.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ fontWeight: 500 }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteTeam(deleteConfirm)}
            variant="contained"
            color="error"
            sx={{ fontWeight: 600 }}
          >
            🗑️ Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Members Popover */}
      <Popover
        open={Boolean(membersPopover.anchorEl)}
        anchorEl={membersPopover.anchorEl}
        onClose={handleMembersPopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            All Team Members
          </Typography>
          <Stack spacing={1}>
            {getTeamMembers().map(m => (
              <Box
                key={`${membersPopover.teamId}-${m.staff_id}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: getDepartmentColor(teams.find(t => t.id === membersPopover.teamId)?.department),
                    fontSize: '0.875rem',
                  }}
                >
                  {(m.full_name || 'U')[0].toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {m.full_name || 'Unknown'}
                  </Typography>
                  <Chip
                    label={m.role.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
};

export default ManageTeams;
