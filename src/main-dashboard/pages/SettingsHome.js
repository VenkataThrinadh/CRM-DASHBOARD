import React from 'react';
import { Box, Grid, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  People,
  ReceiptLong,
  Search,
  Settings as SettingsIcon,
  ImportExport,
  UploadFile,
  Phone,
  Group,
  Notifications,
  Build,
  Tune,
  FeaturedPlayList,
  Domain,
  DoneAll,
  Flag,
  Repeat,
  AutoFixHigh,
  Speed,
  Feedback,
  Language,
} from '@mui/icons-material';

const tiles = [
  { key: 'user-management', title: 'User Management', caption: 'Add users, manage their teams and hierarchy.', icon: <People fontSize="large" />, to: '/settings/user-management' },
  { key: 'billing', title: 'Billing', caption: 'Download your invoices & check your dues.', icon: <ReceiptLong fontSize="large" /> },
  { key: 'search-lists', title: 'Search Lists', caption: 'Use Smart Lists to segment your leads.', icon: <Search fontSize="large" /> },
  { key: 'lead-settings', title: 'Lead Settings', caption: 'Customise Lead forms, pipeline stages.', icon: <SettingsIcon fontSize="large" /> },
  { key: 'import', title: 'Import', caption: 'Import your data in bulk.', icon: <ImportExport fontSize="large" /> },
  { key: 'export', title: 'Export', caption: 'Download your leads, calls, activities & more.', icon: <UploadFile fontSize="large" /> },
  { key: 'telephony', title: 'Telephony', caption: 'Setup & manage your telephony & IVR.', icon: <Phone fontSize="large" /> },
  { key: 'partner-settings', title: 'Partner Settings', caption: 'Configure & Manage your Channel Partners.', icon: <Group fontSize="large" /> },
  { key: 'notification-settings', title: 'Notification Settings', caption: 'Manage your Notification Settings.', icon: <Notifications fontSize="large" /> },
  { key: 'others', title: 'Others', caption: 'Common Configurations.', icon: <Build fontSize="large" /> },
  { key: 'features', title: 'Features', caption: 'Enable Client Features.', icon: <Tune fontSize="large" /> },
  { key: 'custom-fields', title: 'Custom Fields', caption: 'Customise your account with custom fields.', icon: <FeaturedPlayList fontSize="large" /> },
  { key: 'company-details', title: 'Company Details', caption: 'Manage your common company details.', icon: <Domain fontSize="large" /> },
  { key: 'pre-sales', title: 'Pre/Sales Configuration', caption: 'Manage pre-sales configuration.', icon: <DoneAll fontSize="large" /> },
  { key: 'post-sales', title: 'Post Sales Configuration', caption: 'Manage post-sales configuration.', icon: <Flag fontSize="large" /> },
  { key: 'booking-lists', title: 'Booking Lists', caption: 'Smart Lists for your customers.', icon: <Repeat fontSize="large" /> },
  { key: 'user-targets', title: 'User Targets', caption: 'Add and manage targets on users and teams.', icon: <Speed fontSize="large" /> },
  { key: 'goals', title: 'Goals', caption: 'Add and manage goals.', icon: <AutoFixHigh fontSize="large" /> },
  { key: 'reassign-leads', title: 'Reassign Leads', caption: 'Bulk reassignment of leads.', icon: <Repeat fontSize="large" /> },
  { key: 'bulk-job-history', title: 'Bulk Job History', caption: 'View bulk job tracking history.', icon: <UploadFile fontSize="large" /> },
  { key: 'routing-setup', title: 'Routing Setup', caption: 'Setup lead and call routing.', icon: <Speed fontSize="large" /> },
  { key: 'feedback', title: 'Feedback', caption: 'Configure feedback form and questions.', icon: <Feedback fontSize="large" /> },
  { key: 'website', title: 'Website', caption: 'Template integration for Property Landing page.', icon: <Language fontSize="large" /> },
  { key: 'bulk-check', title: 'Bulk Check Lead Presence', caption: 'Upload a file to check leads presence.', icon: <Search fontSize="large" /> },
];

const SettingsHome = () => {
  const navigate = useNavigate();

  const handleClick = (tile) => {
    if (tile.to) {
      navigate(tile.to);
      return;
    }
    // For tiles without a target yet, open a placeholder route or do nothing
    // navigate(`/settings/${tile.key}`);
    // For now just log
    // eslint-disable-next-line no-console
    console.log('Tile clicked:', tile.key);
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Settings Management
      </Typography>

      <Grid container spacing={2}>
        {tiles.map(tile => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={tile.key}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <CardActionArea onClick={() => handleClick(tile)} sx={{ p: 2 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, minHeight: 88 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: 'primary.main', mb: 0.5 }}>
                    {tile.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {tile.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
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

export default SettingsHome;
