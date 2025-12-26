import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

// Department-specific roles (must match backend/team roles mapping)
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

const getRolesForDepartment = (dept) => DEPARTMENT_ROLES[dept] || [];

const StaffForm = ({ staff, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    status: 'active',
    address: '',
    date_of_joining: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    qualification: '',
    experience_years: '',
    skills: '',
    performance_rating: '',
    last_performance_review: '',
    password: '',
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        employee_id: staff.employee_id || '',
        full_name: staff.full_name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        department: staff.department || '',
        designation: staff.designation || '',
        status: staff.status || 'active',
        address: staff.address || '',
        date_of_joining: staff.date_of_joining ? new Date(staff.date_of_joining).toISOString().split('T')[0] : '',
        emergency_contact_name: staff.emergency_contact_name || '',
        emergency_contact_phone: staff.emergency_contact_phone || '',
        emergency_contact_relation: staff.emergency_contact_relation || '',
        qualification: staff.qualification || '',
        experience_years: staff.experience_years || '',
        skills: staff.skills || '',
        performance_rating: staff.performance_rating || '',
        last_performance_review: staff.last_performance_review ? new Date(staff.last_performance_review).toISOString().split('T')[0] : '',
        password: staff.password || '',
      });
    }
  }, [staff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If department changes, reset designation if it doesn't belong to new dept
    if (name === 'department') {
      const roles = getRolesForDepartment(value);
      const validDesignations = roles.map(r => r.designation.toLowerCase());
      const currentDesignation = formData.designation ? formData.designation.toLowerCase() : '';
      setFormData({ ...formData, department: value, designation: validDesignations.includes(currentDesignation) ? formData.designation : '' });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: 1,
        p: 2,
        overflow: 'auto',
        borderRadius: 1,
        border: 'none',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
        Edit Staff Member
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            type="email"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="department-label">Department</InputLabel>
            <Select
              labelId="department-label"
              id="department"
              name="department"
              value={formData.department}
              label="Department"
              onChange={handleChange}
            >
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="operations">Operations</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="hr">HR</MenuItem>
              <MenuItem value="it">IT</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          {getRolesForDepartment(formData.department).length > 0 ? (
            <FormControl fullWidth>
              <InputLabel id="designation-label">Designation</InputLabel>
              <Select
                labelId="designation-label"
                id="designation"
                name="designation"
                value={formData.designation}
                label="Designation"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>Select Designation</em>
                </MenuItem>
                {getRolesForDepartment(formData.department).map(r => (
                  <MenuItem key={r.key} value={r.designation}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleChange}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="on_leave">On Leave</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date of Joining"
            name="date_of_joining"
            type="date"
            value={formData.date_of_joining}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emergency Contact Name"
            name="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emergency Contact Phone"
            name="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={handleChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emergency Contact Relation"
            name="emergency_contact_relation"
            value={formData.emergency_contact_relation}
            onChange={handleChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Qualification"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Experience Years"
            name="experience_years"
            value={formData.experience_years}
            onChange={handleChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Skills"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Performance Rating"
            name="performance_rating"
            value={formData.performance_rating}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Performance Review"
            name="last_performance_review"
            type="date"
            value={formData.last_performance_review}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button type="submit" variant="contained" size="small">
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default StaffForm;