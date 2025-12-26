import React from 'react';
import { Navigate } from 'react-router-dom';

// Staff detail page removed from Sales Dashboard — redirect to Manage Users
export default function StaffDetail() {
  return <Navigate to="/settings/manage-users" replace />;
}
            height: 60,
            mr: 2,
            backgroundColor: 'primary.main',
            fontSize: '1.5rem',
          }}
        >
          {staff.full_name?.charAt(0)?.toUpperCase() || 'S'}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            {staff.full_name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={staff.department || 'No Department'}
              color={getDepartmentColor(staff.department)}
              icon={<Engineering />}
            />
            <Chip
              label={staff.status || 'active'}
              color={getStatusColor(staff.status)}
            />
            <Typography variant="body2" color="text.secondary" component="span">
              Employee ID: {staff.employee_id || 'N/A'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEditStaff}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDeleteStaff}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                Staff Information
              </Typography>
              <IconButton aria-label="edit" onClick={() => setIsModalOpen(true)}>
                <Edit />
              </IconButton>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Email Address
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Phone Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Work sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Designation
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.designation || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Business sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Assigned Property
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.project_name || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Date of Joining
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.date_of_joining ? formatDateDDMMYYYY(staff.date_of_joining) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Work sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Experience (Years)
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.experience_years ? `${staff.experience_years} years` : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Work sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Qualification
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.qualification || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Work sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Performance Rating
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.performance_rating ? `${staff.performance_rating}/5.0` : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Last Performance Review
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.last_performance_review ? formatDateDDMMYYYY(staff.last_performance_review) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Last Updated
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.updated_at ? formatDateDDMMYYYY(staff.updated_at) : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Work sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Password
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.derived_plain_password || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {staff.address && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                    Address
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <LocationOn sx={{ mr: 1, color: 'primary.main', mt: 0.25 }} />
                  <Typography variant="body1" paragraph component="div">
                    {staff.address}
                  </Typography>
                </Box>
              </>
            )}

            {/* Emergency Contact Information */}
            {(staff.emergency_contact_name || staff.emergency_contact_phone) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                  Emergency Contact
                </Typography>
                <Grid container spacing={3}>
                  {staff.emergency_contact_name && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Work sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" component="div">
                            Contact Name
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" component="div">
                            {staff.emergency_contact_name}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {staff.emergency_contact_phone && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Phone sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" component="div">
                            Contact Phone
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" component="div">
                            {staff.emergency_contact_phone}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {staff.emergency_contact_relation && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Work sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" component="div">
                            Relationship
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" component="div">
                            {staff.emergency_contact_relation}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </>
            )}

            {/* Skills and Competencies */}
            {staff.skills && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                  Skills & Competencies
                </Typography>
                <Typography variant="body1" paragraph component="div">
                  {staff.skills}
                </Typography>
              </>
            )}
          </Paper>

          {/* Staff Activity Placeholder */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              Activity tracking will be implemented in future updates.
            </Typography>
          </Paper>
         </Grid>
         <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          aria-labelledby="staff-form-modal"
          aria-describedby="staff-form-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            height: '75vh', // Reduced height to 75% of viewport height
            overflow: 'auto', // Added scrollbar
          }}>
            <StaffForm
              staff={{ ...staff, password: staff.derived_plain_password }}
              onClose={() => setIsModalOpen(false)}
              onSubmit={async (formData) => {
                // Persist updates via API and refresh detail
                try {
                  const payload = { ...formData };
                  // Ensure numeric fields are properly cast or left null
                  if (payload.experience_years === '') payload.experience_years = null;
                  if (payload.performance_rating === '') payload.performance_rating = null;
                  // Never send password on update; backend does not accept password updates here
                  delete payload.password;
                  payload.project_id = formData.project_id || null;
                  await staffAPI.update(staff.id, payload);
                  setIsModalOpen(false);
                  fetchStaffDetails();
                } catch (e) {
                  // Basic error handling; could be improved with UI feedback
                  console.error('Failed to update staff', e);
                  setIsModalOpen(false);
                  fetchStaffDetails();
                }
              }}
            />
          </Box>
        </Modal>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Employment Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                Employment Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" component="div">
                  Employee ID
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary" component="div">
                  {staff.employee_id || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" component="div">
                  Department
                </Typography>
                <Typography variant="body1" fontWeight="medium" component="div">
                  {staff.department || 'Not Assigned'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" component="div">
                  Employment Status
                </Typography>
                <Chip
                  label={staff.status || 'active'}
                  color={getStatusColor(staff.status)}
                  size="small"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" component="div">
                  Assigned Property
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main" component="div">
                  {staff.project_name || 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                Performance Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Rating
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {staff.performance_rating ? `${staff.performance_rating}/5.0` : 'Not Rated'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Experience Level
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {staff.experience_years ? `${staff.experience_years} years` : 'Entry Level'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Employment Status
                  </Typography>
                  <Chip
                    label={staff.status || 'active'}
                    color={getStatusColor(staff.status)}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Department Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                Department Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Engineering sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" component="div">
                    Current Department
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" component="div">
                    {staff.department || 'Not Assigned'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Work sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" component="div">
                    Job Title
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" component="div">
                    {staff.designation || 'Not Specified'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" component="div">
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 1, color: 'primary.main' }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" component="div">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" component="div" sx={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    {staff.email}
                  </Typography>
                </Box>
              </Box>
              {staff.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="div">
                      Phone
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" component="div">
                      {staff.phone}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StaffDetail;