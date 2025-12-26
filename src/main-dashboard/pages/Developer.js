import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Grid,
  TextField,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  ContactMail as ContactMailIcon,
  Folder as FolderIcon,
  Campaign as CampaignIcon,
  Analytics as AnalyticsIcon,
  Assessment as ReportsIcon,
  Engineering as EngineeringIcon,
  Settings as SettingsIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useMenuVisibility } from '../contexts/MenuVisibilityContext';

const Developer = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [success, setSuccess] = useState(false);
  const [salesSearch, setSalesSearch] = useState('');
  const [loansSearch, setLoansSearch] = useState('');
  const { menuVisibility, updateMenuVisibility } = useMenuVisibility();

  // Menu items configuration (excluding developer page itself)
  const salesItems = [
    {
      id: 'dashboard',
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      id: 'properties',
      text: 'Properties',
      icon: <HomeIcon />,
      path: '/properties',
    },
    {
      id: 'users',
      text: 'Users',
      icon: <PeopleIcon />,
      path: '/users',
    },
    {
      id: 'salesCustomers',
      text: 'Customers',
      icon: <PersonAddIcon />,
      path: '/customers',
    },
    {
      id: 'leads',
      text: 'Leads',
      icon: <CampaignIcon />,
      path: '/leads',
    },
    {
      id: 'staff',
      text: 'Staff',
      icon: <EngineeringIcon />,
      path: '/staff',
    },
    {
      id: 'documents',
      text: 'Documents',
      icon: <FolderIcon />,
      path: '/documents',
    },
    {
      id: 'analytics',
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/sales-dashboard/analytics',
    },
    {
      id: 'reports',
      text: 'Reports',
      icon: <ReportsIcon />,
      path: '/sales-dashboard/reports',
    },
    {
      id: 'settings',
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  const loansItems = [
    {
      id: 'loansDashboardHome',
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/loans-dashboard',
    },
    {
      id: 'loansCustomers',
      text: 'Customers',
      icon: <PeopleIcon />,
      path: '/loans-dashboard/customers',
    },
    {
      id: 'customerDocuments',
      text: 'Customer Documents',
      icon: <FolderIcon />,
      path: '/loans-dashboard/customer-documents',
    },
    {
      id: 'borrowers',
      text: 'Borrowers',
      icon: <PersonAddIcon />,
      path: '/loans-dashboard/borrowers',
    },
    {
      id: 'loans',
      text: 'Loans',
      icon: <DashboardIcon />,
      path: '/loans-dashboard/loans',
    },
    {
      id: 'payments',
      text: 'Payments',
      icon: <ContactMailIcon />,
      path: '/loans-dashboard/payments',
    },
    {
      id: 'receipts',
      text: 'Receipts',
      icon: <FolderIcon />,
      path: '/loans-dashboard/receipts',
    },
    {
      id: 'reports',
      text: 'Reports',
      icon: <DashboardIcon />,
      path: '/loans-dashboard/reports',
    },
    {
      id: 'transactions',
      text: 'Transactions',
      icon: <ContactMailIcon />,
      path: '/loans-dashboard/transactions',
    },
    // vouchers removed from the UI
    {
      id: 'balanceManagement',
      text: 'Balance Management',
      icon: <EngineeringIcon />,
      path: '/loans-dashboard/balance-management',
    },
    {
      id: 'loanSettings',
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/loans-dashboard/settings',
    },
  ];

  const handleMenuVisibilityChange = (itemId) => (event) => {
    const newVisibility = { ...menuVisibility, [itemId]: event.target.checked };
    // If a top-level dashboard toggle is changed, also turn off/on its children accordingly
    if (itemId === 'salesDashboard') {
      salesItems.forEach(it => {
        newVisibility[it.id] = event.target.checked;
      });
    }
    if (itemId === 'loansDashboard') {
      loansItems.forEach(it => {
        newVisibility[it.id] = event.target.checked;
      });
    }
    updateMenuVisibility(newVisibility);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const resetToDefault = (group = 'all') => {
    const defaultVisibility = { ...menuVisibility };
    if (group === 'sales' || group === 'all') {
      salesItems.forEach(item => {
        defaultVisibility[item.id] = true;
      });
      defaultVisibility['salesDashboard'] = true;
    }
    if (group === 'loans' || group === 'all') {
      loansItems.forEach(item => {
        defaultVisibility[item.id] = true;
      });
      defaultVisibility['loansDashboard'] = true;
    }
    updateMenuVisibility(defaultVisibility);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filter helper for search
  const filterItems = (items, query) => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((i) => (i.text || '').toLowerCase().includes(q) || (i.path || '').toLowerCase().includes(q));
  };

  const filteredSales = filterItems(salesItems, salesSearch);
  const filteredLoans = filterItems(loansItems, loansSearch);
  const salesVisibleCount = (menuVisibility['salesDashboard'] === false) ? 0 : salesItems.filter(i => menuVisibility[i.id] !== false).length;
  const loansVisibleCount = (menuVisibility['loansDashboard'] === false) ? 0 : loansItems.filter(i => menuVisibility[i.id] !== false).length;

  function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`dev-tabpanel-${index}`}
        aria-labelledby={`dev-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
      </div>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Developer Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Control which menu items are visible in the dashboard navigation. Changes take effect immediately.
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Menu visibility settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Developer Menu Visibility Tabs"
            variant="standard"
          >
            <Tab label="Sales" value="sales" id="dev-tab-0" />
            <Tab label="Loans" value="loans" id="dev-tab-1" />
          </Tabs>
        </Grid>
        <Grid container spacing={3}>
          {activeTab === 'sales' && (
            <Grid item xs={12} md={12}>
              <TabPanel value={activeTab} index={'sales'}>
            <Card>
              <CardHeader
                title="Sales Dashboard - Menu Item Visibility"
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip size="small" label={`${salesVisibleCount}/${salesItems.length} visible`} />
                    <Button
                      variant="outlined"
                      onClick={() => resetToDefault('sales')}
                      size="small"
                    >
                      Reset Sales Default
                    </Button>
                  </Box>
                }
              />
            <CardContent>
              <TextField
                fullWidth
                size="small"
                placeholder="Search Sales items"
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                sx={{ mb: 1 }}
              />
              <List>
                <ListItem key="sales-toggle" divider>
                  <ListItemIcon>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sales Dashboard" secondary="Top-level section" />
                  <ListItemSecondaryAction>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={menuVisibility['salesDashboard'] !== false}
                          onChange={handleMenuVisibilityChange('salesDashboard')}
                          color="primary"
                        />
                      }
                      label={menuVisibility['salesDashboard'] ? 'Visible' : 'Hidden'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {filteredSales.map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      secondary={`Path: ${item.path}`}
                    />
                    <ListItemSecondaryAction>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={menuVisibility[item.id] !== false}
                            onChange={handleMenuVisibilityChange(item.id)}
                            disabled={menuVisibility['salesDashboard'] === false}
                            color="primary"
                          />
                        }
                        label={menuVisibility[item.id] ? 'Visible' : 'Hidden'}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
            </TabPanel>
            </Grid>
          )}
          {activeTab === 'loans' && (
            <Grid item xs={12} md={12}>
              <TabPanel value={activeTab} index={'loans'}>
            <Card>
              <CardHeader
                title="Loans Dashboard - Menu Item Visibility"
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip size="small" label={`${loansVisibleCount}/${loansItems.length} visible`} />
                    <Button
                      variant="outlined"
                      onClick={() => resetToDefault('loans')}
                      size="small"
                    >
                      Reset Loans Default
                    </Button>
                  </Box>
                }
              />
              <CardContent>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Loans items"
                  value={loansSearch}
                  onChange={(e) => setLoansSearch(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <List>
                  <ListItem key="loans-toggle" divider>
                    <ListItemIcon>
                      <AccountBalanceIcon />
                    </ListItemIcon>
                    <ListItemText primary="Loans Dashboard" secondary="Top-level section" />
                    <ListItemSecondaryAction>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={menuVisibility['loansDashboard'] !== false}
                            onChange={handleMenuVisibilityChange('loansDashboard')}
                            color="primary"
                          />
                        }
                        label={menuVisibility['loansDashboard'] ? 'Visible' : 'Hidden'}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  {filteredLoans.map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemIcon>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        secondary={`Path: ${item.path}`}
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={menuVisibility[item.id] !== false}
                              onChange={handleMenuVisibilityChange(item.id)}
                              disabled={menuVisibility['loansDashboard'] === false}
                              color="primary"
                            />
                          }
                          label={menuVisibility[item.id] ? 'Visible' : 'Hidden'}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
              </TabPanel>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Developer;