import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Tab,
  Tabs,
  Menu,
  MenuItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  Search,
  MoreVert,
  Visibility,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { propertiesAPI, staffAPI } from '../services/api';

const ManageUsers = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [staff, setStaff] = useState([]);

  const [projects, setProjects] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  const departments = ['ALL', 'HR', 'FINANCE', 'SALES', 'OPERATIONS', 'MARKETING', 'IT'];
  
  const fetchStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      // Map API response to expected structure
      const staffList = (response.data.staff || []).map(s => ({
        // keep DB primary id in `id`, expose `employee_id` for display
        db_id: s.id || null,
        id: s.id || null,
        employee_id: s.employee_id || s.id || '',
        name: s.full_name || s.name,
        email: s.email,
        phone: s.phone,
        department: s.department ? s.department.toUpperCase() : 'HR',
        designation: s.designation,
        status: s.status,
        avatarColor: (s.full_name || s.name || '?').charAt(0).toUpperCase(),
        project_id: s.project_id,
        property_id: s.property_id,
        address: s.address,
        date_of_joining: s.date_of_joining,
        qualification: s.qualification,
        experience_years: s.experience_years,
        performance_rating: s.performance_rating,
        skills: s.skills,
        emergency_contact_name: s.emergency_contact_name,
        emergency_contact_phone: s.emergency_contact_phone,
        emergency_contact_relation: s.emergency_contact_relation,
        last_performance_review: s.last_performance_review,
      }));
      setStaff(staffList);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await propertiesAPI.getAllForDropdown();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };
  
  useEffect(() => {
    fetchStaff();
    fetchProjects();
  }, []);
  const [selectedDept, setSelectedDept] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStaffForMenu, setSelectedStaffForMenu] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'HR',
    designation: '',
    project_id: '',
    status: 'active',
    address: '',
    date_of_joining: '',
    qualification: '',
    experience_years: '',
    performance_rating: '',
    skills: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: 'spouse',
    last_performance_review: '',
  });

  const handleOpenDialog = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        employee_id: staffMember.employee_id,
        full_name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone,
        department: staffMember.department,
        designation: staffMember.designation,
        project_id: staffMember.project_id || '',
        status: staffMember.status,
        address: staffMember.address || '',
        date_of_joining: staffMember.date_of_joining ? staffMember.date_of_joining.split('T')[0] : '',
        qualification: staffMember.qualification || '',
        experience_years: staffMember.experience_years || '',
        performance_rating: staffMember.performance_rating || '',
        skills: staffMember.skills || '',
        emergency_contact_name: staffMember.emergency_contact_name || '',
        emergency_contact_phone: staffMember.emergency_contact_phone || '',
        emergency_contact_relation: staffMember.emergency_contact_relation || 'spouse',
        last_performance_review: staffMember.last_performance_review ? staffMember.last_performance_review.split('T')[0] : '',
      });
    } else {
      setEditingStaff(null);
      setFormData({
        employee_id: '',
        full_name: '',
        email: '',
        phone: '',
        department: 'HR',
        designation: '',
        project_id: '',
        status: 'active',
        address: '',
        date_of_joining: '',
        qualification: '',
        experience_years: '',
        performance_rating: '',
        skills: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: 'spouse',
        last_performance_review: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
  };

  const handleOpenMenuClick = (event, staffMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedStaffForMenu(staffMember);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedStaffForMenu(null);
  };

  const handleViewDetails = (staffMember) => {
    // Navigate to the dedicated Manage User detail page
    if (staffMember && staffMember.id) {
      navigate(`/settings/manage-users/${staffMember.id}`);
    }
    handleCloseMenu();
  };

  const handleEditFromMenu = (staffMember) => {
    handleOpenDialog(staffMember);
    handleCloseMenu();
  };

  const handleDeleteFromMenu = (staffMember) => {
    handleDeleteStaff(staffMember.id);
    handleCloseMenu();
  };

  const handleSaveStaff = async () => {
    // Match behavior with other edit form: only require full name and email
    if (!formData.full_name || !formData.email) {
      setError('Full name and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const staffData = {
      employee_id: formData.employee_id?.trim() || null,
      full_name: formData.full_name?.trim(),
      email: formData.email?.trim(),
      phone: formData.phone?.trim() || null,
      department: formData.department || null,
      designation: formData.designation?.trim() || null,
      project_id: formData.project_id || null,
      status: formData.status || 'active',
      address: formData.address?.trim() || null,
      date_of_joining: formData.date_of_joining || null,
      qualification: formData.qualification?.trim() || null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      skills: formData.skills?.trim() || null,
      performance_rating: formData.performance_rating ? parseFloat(formData.performance_rating) : null,
      emergency_contact_name: formData.emergency_contact_name?.trim() || null,
      emergency_contact_phone: formData.emergency_contact_phone?.trim() || null,
      emergency_contact_relation: formData.emergency_contact_relation || null,
      last_performance_review: formData.last_performance_review || null,
    };

    // Normalize payload to avoid sending empty strings or invalid types
    const normalize = (data) => {
      const normalized = { ...data };
      // Convert empty strings to null for optional fields
      ['employee_id', 'phone', 'department', 'designation', 'address', 'qualification', 'skills', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation', 'last_performance_review'].forEach(k => {
        if (normalized[k] === '' || typeof normalized[k] === 'undefined') normalized[k] = null;
      });

      // Handle project_id: empty -> null, keep numeric otherwise
      if (!normalized.project_id) normalized.project_id = null;

      // Ensure numeric fields are null or numbers
      normalized.experience_years = normalized.experience_years === '' || normalized.experience_years === null || typeof normalized.experience_years === 'undefined' ? null : parseInt(normalized.experience_years, 10);
      normalized.performance_rating = normalized.performance_rating === '' || normalized.performance_rating === null || typeof normalized.performance_rating === 'undefined' ? null : parseFloat(normalized.performance_rating);

      // Ensure status is set
      normalized.status = normalized.status || 'active';

      return normalized;
    };

    try {
      setFormLoading(true);
      setError(null);

      if (editingStaff) {
        // Update existing staff member
        const payload = normalize(staffData);
        console.debug('ManageUsers: updating staff', editingStaff?.id, payload);
        const response = await staffAPI.update(editingStaff.id, payload);
        console.debug('ManageUsers: update response', response && response.data);
      } else {
        // Create new staff member
        const payload = normalize(staffData);
        const response = await staffAPI.create(payload);
        console.debug('ManageUsers: create response', response && response.data);
        
        // Show generated password if available
        if (response && response.data && response.data.generatedPassword) {
          setGeneratedPassword({
            email: formData.email,
            password: response.data.generatedPassword,
            staffName: formData.full_name
          });
          setShowPasswordDialog(true);
          // Close the form dialog but don't refresh yet
          setOpenDialog(false);
          setEditingStaff(null);
          // Refresh staff list after showing password
          await fetchStaff();
          return;
        }
      }

      // Refresh staff list from database
      await fetchStaff();
      handleCloseDialog();
    } catch (error) {
      console.error('ManageUsers: failed to save staff', error);
      const serverMessage = error?.response?.data?.error || error?.response?.data || error.message;
      setError(typeof serverMessage === 'string' ? serverMessage : 'Failed to save staff member. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await staffAPI.delete(id);
      await fetchStaff();
    } catch (error) {
      setError('Failed to delete staff member. Please try again.');
    }
  };

  const getDeptCount = (dept) => {
    if (dept === 'ALL') return staff.length;
    return staff.filter(s => s.department === dept).length;
  };

  const filteredStaff = staff.filter(s => {
    const deptMatch = selectedDept === 0 || s.department === departments[selectedDept];
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = (s.name || '').toLowerCase().includes(searchLower) ||
                       (s.email || '').toLowerCase().includes(searchLower) ||
                       (s.employee_id || s.id || '').toString().toLowerCase().includes(searchLower);
    const propertyMatch = !selectedPropertyId || s.project_id === selectedPropertyId || s.property_id === selectedPropertyId;
    return deptMatch && searchMatch && propertyMatch;
  });

  const getStatusChipColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getDeptChipColor = (dept) => {
    const colors = {
      'HR': '#1976d2',
      'FINANCE': '#ff9800',
      'SALES': '#2196f3',
      'OPERATIONS': '#4caf50',
      'MARKETING': '#e91e63',
      'IT': '#0097a7',
    };
    return colors[dept] || '#757575';
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/settings/user-management')}
          sx={{ textTransform: 'none', color: 'primary.main' }}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Title and Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Manage Staff
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add, edit, and manage staff members in your organization
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 250 }} size={isMobile ? "small" : "medium"}>
            <InputLabel>Select Property</InputLabel>
            <Select
              value={selectedPropertyId}
              label="Select Property"
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              sx={{
                backgroundColor: 'white',
                borderRadius: 1,
              }}
            >
              <MenuItem value="">All Properties</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name || project.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            Add Staff
          </Button>
        </Box>
      </Box>

      {/* Department Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedDept} 
          onChange={(e, newValue) => setSelectedDept(newValue)}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 } }}
        >
          {departments.map((dept, idx) => (
            <Tab
              key={idx}
              label={`${dept} (${getDeptCount(dept)})`}
              sx={{ fontSize: '0.9rem' }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email, or employee ID..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Staff Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 1 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600, width: '60px' }}>Avatar</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.length > 0 ? (
              filteredStaff
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((staffMember) => (
                <TableRow key={staffMember.id} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                  <TableCell>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: '#1976d2',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      {staffMember.avatarColor}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{staffMember.employee_id}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 500 }}>{staffMember.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        ID: {staffMember.employee_id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '0.9rem' }}>✉</Typography>
                      <Typography sx={{ fontSize: '0.85rem' }}>{staffMember.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '0.9rem' }}>📱</Typography>
                      <Typography sx={{ fontSize: '0.85rem' }}>{staffMember.phone}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={staffMember.department}
                      size="small"
                      sx={{
                        backgroundColor: getDeptChipColor(staffMember.department),
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{staffMember.designation}</TableCell>
                  <TableCell>
                    <Chip
                      label={staffMember.status}
                      size="small"
                      color={getStatusChipColor(staffMember.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMenuClick(e, staffMember)}
                      title="More options"
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">No staff members found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredStaff.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit Staff Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { m: isMobile ? 0 : 2 } }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box component="form" id="staff-form" sx={{ mt: 1 }}>
            {error && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#ffebee', color: '#c62828', borderRadius: 1 }}>
                <Typography variant="body2">{error}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Employee ID"
                name="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <FormControl fullWidth sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value, designation: '' })}
                  label="Department"
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="operations">Operations</MenuItem>
                  <MenuItem value="finance">Finance</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="it">IT</MenuItem>
                </Select>
              </FormControl>

              {/* Dynamic designation select based on department */}
              <FormControl fullWidth sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}>
                <InputLabel>Designation</InputLabel>
                <Select
                  name="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  label="Designation"
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="">
                    <em>Select Designation</em>
                  </MenuItem>
                  {(
                    // department role mapping
                    (function(){
                      const mapping = {
                        sales: [
                          { key: 'project_director', designation: 'Projects Director', label: 'Projects Director' },
                          { key: 'project_manager', designation: 'Project Manager', label: 'Project Manager' },
                          { key: 'sales_executive', designation: 'Sales Executive', label: 'Sales Executive' },
                          { key: 'telecaller', designation: 'Telecaller', label: 'Telecaller' }
                        ],
                        marketing: [
                          { key: 'marketing_director', designation: 'Marketing Director', label: 'Marketing Director' },
                          { key: 'marketing_manager', designation: 'Marketing Manager', label: 'Marketing Manager' },
                          { key: 'digital_marketing_executive', designation: 'Digital Marketing Executive', label: 'Digital Marketing Executive' },
                          { key: 'content_social_media_executive', designation: 'Content / Social Media Executive', label: 'Content / Social Media Executive' },
                          { key: 'performance_marketing_executive', designation: 'Performance Marketing Executive', label: 'Performance Marketing Executive' }
                        ],
                        operations: [
                          { key: 'operations_director', designation: 'Operations Director', label: 'Operations Director' },
                          { key: 'operations_manager', designation: 'Operations Manager', label: 'Operations Manager' },
                          { key: 'site_operations_executive', designation: 'Site Operations Executive', label: 'Site Operations Executive' },
                          { key: 'facility_site_supervisor', designation: 'Facility / Site Supervisor', label: 'Facility / Site Supervisor' },
                          { key: 'vendor_coordinator', designation: 'Vendor Coordinator', label: 'Vendor Coordinator' },
                          { key: 'procurement_executive', designation: 'Procurement Executive', label: 'Procurement Executive' }
                        ],
                        finance: [
                          { key: 'finance_director', designation: 'Finance Director', label: 'Finance Director' },
                          { key: 'finance_manager', designation: 'Finance Manager', label: 'Finance Manager' },
                          { key: 'accounts_executive', designation: 'Accounts Executive', label: 'Accounts Executive' },
                          { key: 'billing_collection_executive', designation: 'Billing / Collection Executive', label: 'Billing / Collection Executive' },
                          { key: 'loan_processing_executive', designation: 'Loan Processing Executive', label: 'Loan Processing Executive' },
                          { key: 'compliance_executive', designation: 'Compliance Executive', label: 'Compliance Executive' }
                        ],
                        hr: [
                          { key: 'hr_head', designation: 'HR Head', label: 'HR Head' },
                          { key: 'hr_manager', designation: 'HR Manager', label: 'HR Manager' },
                          { key: 'hr_executive', designation: 'HR Executive', label: 'HR Executive' },
                          { key: 'recruiter', designation: 'Recruiter', label: 'Recruiter' }
                        ],
                        it: [
                          { key: 'it_director', designation: 'IT Director', label: 'IT Director' },
                          { key: 'system_administrator', designation: 'System Administrator', label: 'System Administrator' },
                          { key: 'application_support_engineer', designation: 'Application Support Engineer', label: 'Application Support Engineer' },
                          { key: 'it_support_executive', designation: 'IT Support Executive', label: 'IT Support Executive' }
                        ]
                      };
                      return (mapping[formData.department] || []).map(r => (
                        <MenuItem key={r.key} value={r.designation}>{r.label}</MenuItem>
                      ));
                    })()
                  )}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <FormControl fullWidth sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="on_leave">On Leave</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}>
                <InputLabel>Project</InputLabel>
                <Select
                  name="project_id"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  label="Project"
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              sx={{ mt: 2 }}
              size={isMobile ? 'small' : 'medium'}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Date of Joining"
                name="date_of_joining"
                type="date"
                value={formData.date_of_joining}
                onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Qualification"
                name="qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Experience (Years)"
                name="experience_years"
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                fullWidth
                label="Performance Rating (1-5)"
                name="performance_rating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.performance_rating}
                onChange={(e) => setFormData({ ...formData, performance_rating: e.target.value })}
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
            <TextField
              fullWidth
              label="Skills & Competencies"
              name="skills"
              multiline
              rows={2}
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              sx={{ mt: 2 }}
              size={isMobile ? 'small' : 'medium'}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                sx={{ minWidth: isMobile ? '100%' : '200px', flex: 1 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Emergency Contact Relation</InputLabel>
              <Select
                name="emergency_contact_relation"
                value={formData.emergency_contact_relation}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                label="Emergency Contact Relation"
                size={isMobile ? 'small' : 'medium'}
              >
                <MenuItem value="spouse">Spouse</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="sibling">Sibling</MenuItem>
                <MenuItem value="child">Child</MenuItem>
                <MenuItem value="friend">Friend</MenuItem>
                <MenuItem value="colleague">Colleague</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Last Performance Review Date"
              name="last_performance_review"
              type="date"
              value={formData.last_performance_review}
              onChange={(e) => setFormData({ ...formData, last_performance_review: e.target.value })}
              sx={{ mt: 2 }}
              size={isMobile ? 'small' : 'medium'}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={handleCloseDialog}
            fullWidth={isMobile}
            size={isMobile ? 'small' : 'medium'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveStaff}
            variant="contained"
            fullWidth={isMobile}
            size={isMobile ? 'small' : 'medium'}
            disabled={formLoading}
            form="staff-form"
          >
            {formLoading ? 'Saving...' : (editingStaff ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleViewDetails(selectedStaffForMenu)}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleEditFromMenu(selectedStaffForMenu)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDeleteFromMenu(selectedStaffForMenu)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Generated Password Dialog */}
      <Dialog 
        open={showPasswordDialog} 
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', fontWeight: 600 }}>
          Staff Member Created Successfully
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            A new staff member has been created. Please share the login credentials below with the staff member.
          </Typography>
          
          <Box sx={{ 
            backgroundColor: '#e3f2fd', 
            p: 2, 
            borderRadius: 1, 
            mb: 2,
            border: '1px solid #bbdefb'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Login Credentials
            </Typography>
            
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {generatedPassword?.staffName}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Email
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {generatedPassword?.email}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Password
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600, 
                    fontFamily: 'monospace',
                    backgroundColor: 'white',
                    p: 1,
                    borderRadius: 0.5,
                    flex: 1
                  }}
                >
                  {generatedPassword?.password}
                </Typography>
                <Button 
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword?.password);
                  }}
                >
                  Copy
                </Button>
              </Box>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: 'warning.main' }}>
            ⚠️ Please ensure the staff member changes their password on first login for security.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPasswordDialog(false)}
            variant="contained"
            fullWidth
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageUsers;
