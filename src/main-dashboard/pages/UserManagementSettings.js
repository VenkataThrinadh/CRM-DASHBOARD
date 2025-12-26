import React from 'react';
import { Box, Grid, Card, CardActionArea, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  People,
  Group,
  AccessTime,
  Assignment,
  CloudUpload,
  AccountTree,
  ScoreOutlined,
  Download,
  Update,
  ArrowBack,
} from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';

const UserManagementSettings = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const tiles = [
    {
      key: 'manage-users',
      title: 'Manage Users',
      caption: 'Add users, manage their teams and hierarchy.',
      icon: <People fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/manage-users'),
    },
    {
      key: 'manage-teams',
      title: 'Manage Teams',
      caption: 'Create teams for your users.',
      icon: <Group fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/manage-teams'),
    },
    {
      key: 'attendance-availability',
      title: 'Attendance & Availability',
      caption: 'Manage call availabilities for your users.',
      icon: <AccessTime fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/attendance-availability'),
    },
    {
      key: 'attendance-logs',
      title: 'Attendance & Availability Logs',
      caption: 'View call availability logs for your users.',
      icon: <Assignment fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/attendance-logs'),
    },
    {
      key: 'bulk-update-availability',
      title: 'Bulk Update Call Availabilities For Users',
      caption: 'Bulk update call availability timings for your users.',
      icon: <CloudUpload fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/bulk-update-availability'),
    },
    {
      key: 'team-hierarchy',
      title: 'Team Hierarchy',
      caption: 'Complex organisational hierarchy made simple.',
      icon: <AccountTree fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/team-hierarchy'),
    },
    {
      key: 'user-scores',
      title: 'User Scores',
      caption: 'Manage routing scores for your users.',
      icon: <ScoreOutlined fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/user-scores'),
    },
    {
      key: 'export-data',
      title: 'Export',
      caption: 'Download your user data.',
      icon: <Download fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/export-user-data'),
    },
    {
      key: 'bulk-update-availabilities',
      title: 'Bulk Update Call Availabilities',
      caption: 'Update call availabilities for your multiple users.',
      icon: <Update fontSize="large" />,
      color: '#1976D2',
      action: () => navigate('/settings/bulk-update-availabilities'),
    },
  ];

  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/settings')}
          sx={{ textTransform: 'none' }}
        >
          Back to Settings
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        User Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage users, teams, availability, and organizational hierarchy
      </Typography>

      {/* Grid of Settings Cards */}
      <Grid container spacing={2}>
        {tiles.map((tile) => (
          <Grid item xs={12} sm={6} md={4} key={tile.key}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  borderColor: 'primary.main',
                },
                height: '100%',
              }}
            >
              <CardActionArea
                onClick={tile.action}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    width: '100%',
                    p: { xs: 2, md: 2.5 },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: tile.color,
                      fontSize: '2rem',
                    }}
                  >
                    {tile.icon}
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      color: 'text.primary',
                    }}
                  >
                    {tile.title}
                  </Typography>

                  {/* Caption */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {tile.caption}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserManagementSettings;
