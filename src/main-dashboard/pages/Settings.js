import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Switch,
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Link,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Save,
  Edit,
  Notifications,
  Security,
  Language,
  Email,
  Lock,
  Help,
  Description,
  Shield,
  DarkMode,
  LightMode,
  Person,
  Backup,
  CloudDownload,
  Delete,
  Warning,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { user, updateUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [backupDialog, setBackupDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    darkMode: false,
    autoBackup: true,
    maintenanceMode: false,
    debugMode: false,
    language: 'en',
    timezone: 'Asia/Kolkata',
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load settings from API or localStorage
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSystemSettings(prev => ({ ...prev, ...parsed.system }));
        setSecuritySettings(prev => ({ ...prev, ...parsed.security }));
      }
    } catch (error) {
      console.error('Error loading settings:', error); // eslint-disable-line no-console
    }
  };

  const saveSettings = async (type, settings) => {
    try {
      const currentSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
      const updatedSettings = {
        ...currentSettings,
        [type]: settings,
      };
      localStorage.setItem('adminSettings', JSON.stringify(updatedSettings));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to save settings');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleProfileChange = (field) => (event) => {
    setProfileData({
      ...profileData,
      [field]: event.target.value,
    });
  };

  const handleSystemSettingChange = (setting) => (event) => {
    const newSettings = {
      ...systemSettings,
      [setting]: event.target.checked !== undefined ? event.target.checked : event.target.value,
    };
    setSystemSettings(newSettings);
    saveSettings('system', newSettings);
  };

  const handleSecuritySettingChange = (setting) => (event) => {
    const newSettings = {
      ...securitySettings,
      [setting]: event.target.checked !== undefined ? event.target.checked : event.target.value,
    };
    setSecuritySettings(newSettings);
    saveSettings('security', newSettings);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      setTimeout(() => {
        updateUser({ ...user, ...profileData });
        setSuccess(true);
        setLoading(false);
        setTimeout(() => setSuccess(false), 3000);
      }, 1000);
    } catch (error) {
      setError('Failed to update profile');
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPasswordDialog(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSuccess(true);
        setLoading(false);
        setTimeout(() => setSuccess(false), 3000);
      }, 1000);
    } catch (error) {
      setError('Failed to change password');
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(async () => {
        await signOut();
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError('Failed to delete account');
      setLoading(false);
    }
  };

  const handleBackupData = async () => {
    try {
      setLoading(true);
      // Simulate backup process
      setTimeout(() => {
        const data = {
          timestamp: new Date().toISOString(),
          user: user,
          settings: { system: systemSettings, security: securitySettings },
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setBackupDialog(false);
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }, 1000);
    } catch (error) {
      setError('Failed to create backup');
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: isMobile ? 1.5 : 3 }}>{children}</Box>}
    </div>
  );

  const ProfileTab = () => (
    <Grid container spacing={isMobile ? 1 : 3}>
      <Grid item xs={12} md={4}>
        <Card sx={{ minHeight: isMobile ? 200 : 300 }}>
          <CardContent sx={{
            textAlign: 'center',
            p: isMobile ? 2 : 3
          }}>
            <Avatar
              sx={{
                width: isMobile ? 80 : 100,
                height: isMobile ? 80 : 100,
                mx: 'auto',
                mb: isMobile ? 1.5 : 2,
                fontSize: isMobile ? '2rem' : '2.5rem'
              }}
              src={user?.avatar_url}
            >
              {user?.full_name?.charAt(0)}
            </Avatar>
            <Typography
              variant={isMobile ? "subtitle1" : "h6"}
              sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
            >
              {user?.full_name}
            </Typography>
            <Typography
              variant={isMobile ? "caption" : "body2"}
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              {user?.role === 'admin' ? 'Administrator' : 'User'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              sx={{
                mt: isMobile ? 1.5 : 2,
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }}
              size={isMobile ? "small" : "medium"}
              onClick={() => {/* Handle avatar upload */}}
            >
              {isMobile ? 'Change' : 'Change Photo'}
            </Button>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader
            title="Profile Information"
            titleTypographyProps={{
              variant: isMobile ? "subtitle1" : "h6",
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={isMobile ? 1.5 : 2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileData.full_name}
                  onChange={handleProfileChange('full_name')}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange('email')}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={handleProfileChange('phone')}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={isMobile ? 2 : 3}
                  value={profileData.bio}
                  onChange={handleProfileChange('bio')}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                  size={isMobile ? "small" : "medium"}
                  sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                >
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const NotificationsTab = () => (
    <Grid container spacing={isMobile ? 1 : 3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Email Notifications"
            titleTypographyProps={{
              variant: isMobile ? "subtitle1" : "h6",
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          />
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Email sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive email notifications for important updates"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.emailNotifications}
                    onChange={handleSystemSettingChange('emailNotifications')}
                    size={isMobile ? "small" : "medium"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Notifications sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Push Notifications"
                  secondary="Receive push notifications in browser"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.pushNotifications}
                    onChange={handleSystemSettingChange('pushNotifications')}
                    size={isMobile ? "small" : "medium"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Email sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Marketing Emails"
                  secondary="Receive marketing and promotional emails"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.marketingEmails}
                    onChange={handleSystemSettingChange('marketingEmails')}
                    size={isMobile ? "small" : "medium"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="System Preferences"
            titleTypographyProps={{
              variant: isMobile ? "subtitle1" : "h6",
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          />
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  {systemSettings.darkMode ?
                    <DarkMode sx={{ fontSize: isMobile ? 20 : 24 }} /> :
                    <LightMode sx={{ fontSize: isMobile ? 20 : 24 }} />
                  }
                </ListItemIcon>
                <ListItemText
                  primary="Dark Mode"
                  secondary="Use dark theme for the interface"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.darkMode}
                    onChange={handleSystemSettingChange('darkMode')}
                    size={isMobile ? "small" : "medium"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Language sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Language"
                  secondary="Select your preferred language"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <FormControl size={isMobile ? "small" : "small"} sx={{ minWidth: isMobile ? 100 : 120 }}>
                    <Select
                      value={systemSettings.language}
                      onChange={handleSystemSettingChange('language')}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="hi">Hindi</MenuItem>
                      <MenuItem value="mr">Marathi</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Backup sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Auto Backup"
                  secondary="Automatically backup data daily"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.autoBackup}
                    onChange={handleSystemSettingChange('autoBackup')}
                    size={isMobile ? "small" : "medium"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const SecurityTab = () => (
    <Grid container spacing={isMobile ? 1 : 3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Account Security"
            titleTypographyProps={{
              variant: isMobile ? "subtitle1" : "h6",
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          />
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Lock sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Change Password"
                  secondary="Update your account password"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    onClick={() => setPasswordDialog(true)}
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Change
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Shield sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary="Add an extra layer of security"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onChange={handleSecuritySettingChange('twoFactorAuth')}
                    size={isMobile ? "small" : "medium"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Notifications sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Login Alerts"
                  secondary="Get notified of new login attempts"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onChange={handleSecuritySettingChange('loginAlerts')}
                    size={isMobile ? "small" : "medium"}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Data Management"
            titleTypographyProps={{
              variant: isMobile ? "subtitle1" : "h6",
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          />
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            <List sx={{ p: 0 }}>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <CloudDownload sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Backup Data"
                  secondary="Download a backup of your data"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    onClick={() => setBackupDialog(true)}
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Backup
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem sx={{ px: isMobile ? 1 : 2 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Delete color="error" sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Delete Account"
                  secondary="Permanently delete your account and data"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDeleteAccountDialog(true)}
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Delete
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const SupportTab = () => (
    <Grid container spacing={isMobile ? 1 : 3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Help & Support"
            titleTypographyProps={{
              variant: isMobile ? "subtitle1" : "h6",
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          />
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            <List sx={{ p: 0 }}>
              <ListItem
                button
                component={Link}
                href="#"
                target="_blank"
                sx={{ px: isMobile ? 1 : 2 }}
              >
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Help sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Help Center"
                  secondary="Find answers to common questions"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
              </ListItem>
              <ListItem
                button
                component={Link}
                href="#"
                target="_blank"
                sx={{ px: isMobile ? 1 : 2 }}
              >
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Email sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Contact Support"
                  secondary="Get help from our support team"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
              </ListItem>
              <ListItem
                button
                component={Link}
                href="#"
                target="_blank"
                sx={{ px: isMobile ? 1 : 2 }}
              >
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Description sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Documentation"
                  secondary="Read the complete documentation"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Legal"
            titleTypographyProps={{
              variant: isMobile ? "subtitle1" : "h6",
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}
          />
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            <List sx={{ p: 0 }}>
              <ListItem
                button
                component={Link}
                href="#"
                target="_blank"
                sx={{ px: isMobile ? 1 : 2 }}
              >
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Description sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Terms of Service"
                  secondary="Read our terms of service"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
              </ListItem>
              <ListItem
                button
                component={Link}
                href="#"
                target="_blank"
                sx={{ px: isMobile ? 1 : 2 }}
              >
                <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
                  <Shield sx={{ fontSize: isMobile ? 20 : 24 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Privacy Policy"
                  secondary="Learn about our privacy practices"
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', p: isMobile ? 1 : 3 }}>
      <Typography
        variant={isMobile ? "h5" : "h4"}
        gutterBottom
        sx={{ fontSize: isSmallScreen ? '1.5rem' : isMobile ? '1.75rem' : '2.125rem' }}
      >
        Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              minWidth: isMobile ? 80 : 120,
              padding: isMobile ? '6px 12px' : '12px 16px'
            },
            '& .MuiTab-iconWrapper': {
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }
          }}
        >
          <Tab
            icon={<Person />}
            label={isMobile ? '' : 'Profile'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<Notifications />}
            label={isMobile ? '' : 'Notifications'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<Security />}
            label={isMobile ? '' : 'Security'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
          <Tab
            icon={<Help />}
            label={isMobile ? '' : 'Support'}
            sx={{ minWidth: isMobile ? 60 : 120 }}
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <ProfileTab />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <NotificationsTab />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <SecurityTab />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <SupportTab />
        </TabPanel>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { m: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          Change Password
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mt: isMobile ? 0 : 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      size={isMobile ? "small" : "medium"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={() => setPasswordDialog(false)}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        open={deleteAccountDialog}
        onClose={() => setDeleteAccountDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { m: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="error" sx={{ fontSize: isMobile ? 20 : 24 }} />
            Delete Account
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={() => setDeleteAccountDialog(false)}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Dialog */}
      <Dialog
        open={backupDialog}
        onClose={() => setBackupDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { m: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
          Backup Data
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            This will create a backup file containing your profile data and settings. The file will be downloaded to your device.
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          p: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0
        }}>
          <Button
            onClick={() => setBackupDialog(false)}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBackupData}
            variant="contained"
            disabled={loading}
            fullWidth={isMobile}
            size={isMobile ? "small" : "medium"}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;