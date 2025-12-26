import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Campaign as CampaignIcon,
  Analytics as AnalyticsIcon,
  AccountCircle,
  Engineering as EngineeringIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  AccountBalance as LoanIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Assessment as ReportsIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useMenuVisibility } from '../../contexts/MenuVisibilityContext';
import NotificationsDropdown from '../common/NotificationsDropdown';

// Comprehensive responsive drawer width for all device types
const getDrawerWidth = (isXs, isSm, isMd, isLg, isPortrait) => {
  if (isXs) return isPortrait ? 280 : 320; // Small phones: full width in portrait, wider in landscape
  if (isSm) return isPortrait ? 280 : 320; // Large phones/small tablets: full width in portrait, wider in landscape
  if (isMd) return isPortrait ? 240 : 280; // Medium tablets: narrower in portrait, standard in landscape
  if (isLg) return isPortrait ? 240 : 280; // Large screens: narrower in portrait (rare), standard in landscape
  return 280; // Default fallback
};

  const menuItems = [
  {
  id: 'salesDashboard',
    text: 'Sales Dashboard',
    icon: <DashboardIcon />,
    path: '/sales-dashboard',
    children: [
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
        text: 'App Users',
        icon: <PeopleIcon />,
        path: '/users',
        adminOnly: true,
      },
      {
        id: 'salesCustomers',
        text: 'Customers',
        icon: <PersonAddIcon />,
        path: '/customers',
      },
      {
        id: 'staff',
        text: 'Staff',
        icon: <EngineeringIcon />,
        path: '/staff',
        adminOnly: true,
      },
      {
        id: 'leads',
        text: 'Leads',
        icon: <CampaignIcon />,
        path: '/leads',
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
        id: 'documents',
        text: 'Documents',
        icon: <FolderIcon />,
        path: '/documents',
      },
      {
        id: 'settings',
        text: 'Settings',
        icon: <SettingsIcon />,
        path: '/settings',
        adminOnly: true,
      },
      
    ],
  },
  {
  id: 'loansDashboard',
    text: 'Loans Dashboard',
    icon: <DashboardIcon />,
    path: '/loans-dashboard',
    children: [
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
        icon: <DocumentIcon />,
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
        icon: <LoanIcon />,
        path: '/loans-dashboard/loans',
      },
      {
        id: 'payments',
        text: 'Payments',
        icon: <PaymentIcon />,
        path: '/loans-dashboard/payments',
      },
      {
        id: 'receipts',
        text: 'Receipts',
        icon: <ReceiptIcon />,
        path: '/loans-dashboard/receipts',
      },
      {
        id: 'reports',
        text: 'Reports',
        icon: <ReportsIcon />,
        path: '/loans-dashboard/reports',
      },
      {
        id: 'transactions',
        text: 'Transactions',
        icon: <PaymentIcon />,
        path: '/loans-dashboard/transactions',
      },
      // Vouchers removed as per project requirements
      {
        id: 'balanceManagement',
        text: 'Balance Management',
        icon: <AccountBalanceIcon />,
        path: '/loans-dashboard/balance-management',
      },
      {
        id: 'loanSettings',
        text: 'Settings',
        icon: <SettingsIcon />,
        path: '/loans-dashboard/settings',
        adminOnly: true,
      },
    ],
  },
  {
    id: 'developer',
    text: 'Developer',
    icon: <CodeIcon />,
    path: '/developer',
    adminOnly: true,
  }
];

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({}); // Track which dropdowns are open
  const { user, logout } = useAuth();
  const { menuVisibility } = useMenuVisibility();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Comprehensive responsive breakpoints for all device types and orientations
  const isXs = useMediaQuery(theme.breakpoints.down('sm')); // < 600px (small phones)
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-900px (large phones/small tablets)
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 900-1200px (tablets)
  const isLg = useMediaQuery(theme.breakpoints.up('lg')); // > 1200px (desktops/large tablets)

  // Orientation detection
  const isPortrait = useMediaQuery('(orientation: portrait)');

  // Special cases for very small screens
  const isVerySmallPortrait = useMediaQuery('(orientation: portrait) and (max-height: 600px)');

  const drawerWidth = getDrawerWidth(isXs, isSm, isMd, isLg, isPortrait);
  const visibleMenuItems = menuItems.filter(item => {
    // Hide developer menu for non-admins (allow sub-admin)
    if (item.adminOnly && !(user?.role === 'admin' || user?.role === 'sub-admin')) return false;
    // If parent has children, only show if parent is visible AND at least one child is visible
    if (item.children && item.children.length) {
      const hasVisibleChild = item.children.some(child => (menuVisibility[child.id] !== false) && !(child.adminOnly && !(user?.role === 'admin' || user?.role === 'sub-admin')));
      return (menuVisibility[item.id] !== false) && hasVisibleChild;
    }
    return menuVisibility[item.id] !== false;
  });

  

  // Close mobile drawer on orientation change
  useEffect(() => {
    if (!isXs && !isSm) {
      setMobileOpen(false);
    }
  }, [isXs, isSm]);

  // Auto-expand menu parents when navigating to a child under them
  useEffect(() => {
    const newExpanded = {};
    visibleMenuItems.forEach(item => {
      if (item.children && item.children.length) {
        // Expand if the item or any child is active according to our helpers
        if (isItemActive(item)) {
          newExpanded[item.id] = true;
        }
      }
    });
    setExpandedMenus(prev => ({ ...prev, ...newExpanded }));
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    // Support both string path or a menu item object with 'path' and 'query'
    if (typeof path === 'object' && path !== null) {
      const targetPath = path.path || '/';
      const targetUrl = path.query ? `${targetPath}?${path.query}` : targetPath;
      navigate(targetUrl);
    } else {
      navigate(path);
    }
    setMobileOpen(false);
  };

  // Handle dropdown expansion/collapse
  const handleToggleDropdown = (itemId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isItemActive = (item) => {
    if (!item) return false;
    if (location.pathname === item.path) return true;
    if (location.pathname.startsWith(item.path + '/') || location.pathname.startsWith(item.path)) return true;
    if (item.children && item.children.length) {
      return item.children.some(child => isItemActive(child));
    }
    return false;
  };

  const isChildActive = (child, parent) => {
    if (!child) return false;
    // If child.path is identical to the parent's path (a base child representing the parent dashboard),
    // we should only match on exact pathname equality. This avoids marking the 'Dashboard' child active
    // when a nested child route (e.g. '/loans-dashboard/loans') is active.
    if (parent && child.path === parent.path) {
      return (location.pathname === child.path) && (!child.query || location.search.includes(child.query));
    }
    const baseMatch = (location.pathname === child.path) || (location.pathname.startsWith(child.path + '/')) || (location.pathname.startsWith(child.path));
    return baseMatch && (!child.query || location.search.includes(child.query));
  };

  const renderMenuItems = (items) => {
    return items.map((item) => {
      if (item.children) {
        const isExpanded = expandedMenus[item.id];
        return (
          <React.Fragment key={item.text}>
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  py: 1,
                  px: 2,
                  // Parent is active if its own path is active OR any of its children paths are active
                    backgroundColor: isItemActive(item) ? 'primary.main' : 'transparent',
                    color: isItemActive(item) ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isItemActive(item) ? 'primary.dark' : 'action.hover',
                  },
                  '&:active': {
                    backgroundColor: isItemActive(item) ? 'primary.dark' : 'action.selected',
                  },
                  minHeight: 48,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pr: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <ListItemIcon
                    sx={{
                      color: isItemActive(item) ? 'white' : 'text.secondary',
                      minWidth: 40,
                      mr: 2,
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.75rem',
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isItemActive(item) ? 600 : 400,
                      fontSize: '1rem',
                    }}
                  />
                </Box>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleDropdown(item.id);
                  }}
                  size="small"
                  sx={{
                    color: isItemActive(item) ? 'white' : 'text.secondary',
                    ml: 1,
                  }}
                >
                  <ExpandMoreIcon
                    sx={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </IconButton>
              </ListItemButton>
            </ListItem>
            
            {/* Collapsible children section */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children
                  .filter((child) => (menuVisibility[child.id] !== false))
                  .map((child) => (
                  <ListItem key={child.text} disablePadding sx={{ mb: 0.25, pl: 4 }}>
                    <ListItemButton
                      onClick={() => handleNavigation(child)}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        py: 0.75,
                        px: 2,
                        // Active when base path matches and, if provided, the query matches
                          backgroundColor: isChildActive(child, item) ? 'primary.main' : 'transparent',
                          color: isChildActive(child, item) ? 'white' : 'text.primary',
                        '&:hover': {
                          backgroundColor: isChildActive(child, item) ? 'primary.dark' : 'action.hover',
                        },
                        '&:active': {
                          backgroundColor: isChildActive(child, item) ? 'primary.dark' : 'action.selected',
                        },
                        minHeight: 40,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                            color: isChildActive(child, item) ? 'white' : 'text.secondary',
                          minWidth: 36,
                          mr: 1,
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.5rem',
                          },
                        }}
                      >
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={child.text}
                        primaryTypographyProps={{
                            fontWeight: isChildActive(child, item) ? 600 : 400,
                          fontSize: '0.9rem',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        );
      } else {
        return (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item)}
              sx={{
                borderRadius: 2,
                mx: 1,
                py: 1,
                px: 2,
                backgroundColor: isItemActive(item) ? 'primary.main' : 'transparent',
                color: isItemActive(item) ? 'white' : 'text.primary',
                '&:hover': {
                  backgroundColor: isItemActive(item) ? 'primary.dark' : 'action.hover',
                },
                '&:active': {
                  backgroundColor: isItemActive(item) ? 'primary.dark' : 'action.selected',
                },
                minHeight: 48,
              }}
            >
              <ListItemIcon
                sx={{
                  color: isItemActive(item) ? 'white' : 'text.secondary',
                  minWidth: 40,
                  mr: 2,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.75rem',
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isItemActive(item) ? 600 : 400,
                  fontSize: '1rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      }
    });
  };

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Logo/Brand */}
      <Box
        sx={{
          p: isXs || isSm ? 1.5 : isMd ? 1.75 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isXs ? 48 : isSm ? 52 : isMd ? 56 : 64,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
        }}
      >
        <HomeIcon sx={{
          mr: 1,
          fontSize: isXs ? 20 : isSm ? 22 : isMd ? 24 : 28
        }} />
        <Typography
          variant={isXs || isSm ? "body1" : isMd ? "subtitle1" : "h6"}
          noWrap
          component="div"
          fontWeight="bold"
          sx={{
            fontSize: isXs ? '0.9rem' : isSm ? '1rem' : isMd ? '1.1rem' : '1.25rem'
          }}
        >
          {(isXs && isPortrait) || (isSm && isPortrait) ? 'CE' :
           isMd && isPortrait ? 'CE' : 'CE Dashboard'}
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        px: isXs || isSm ? 0.5 : 1,
        py: isVerySmallPortrait ? 0.5 : isXs || isSm ? 1 : isMd ? 1.5 : 2,
        maxHeight: isVerySmallPortrait ? 'calc(100vh - 120px)' :
                   isXs && isPortrait ? 'calc(100vh - 140px)' :
                   isSm && isPortrait ? 'calc(100vh - 150px)' : 'auto'
      }}>
        <List sx={{ p: 0 }}>
          {renderMenuItems(visibleMenuItems)}
        </List>
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* User Info */}
      <Box sx={{
        p: isXs ? (isPortrait ? 1 : 1.25) :
           isSm ? (isPortrait ? 1.25 : 1.5) :
           isMd ? 1.75 : 2,
        backgroundColor: 'grey.50',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: isXs ? (isPortrait ? 1 : 1.25) :
               isSm ? (isPortrait ? 1.25 : 1.5) :
               isMd ? 1.5 : 2,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            flexDirection: isVerySmallPortrait || (isXs && isPortrait) ? 'column' : 'row',
            textAlign: isVerySmallPortrait || (isXs && isPortrait) ? 'center' : 'left',
          }}
        >
          <Avatar
            sx={{
              width: isXs ? (isPortrait ? 28 : 32) :
                     isSm ? (isPortrait ? 32 : 36) :
                     isMd ? 36 : 40,
              height: isXs ? (isPortrait ? 28 : 32) :
                      isSm ? (isPortrait ? 32 : 36) :
                      isMd ? 36 : 40,
              mb: isVerySmallPortrait || (isXs && isPortrait) ? 0.75 : 0,
              mr: isVerySmallPortrait || (isXs && isPortrait) ? 0 :
                  isXs ? (isPortrait ? 1 : 1.25) :
                  isSm ? (isPortrait ? 1.25 : 1.5) :
                  isMd ? 1.5 : 2,
              backgroundColor: 'primary.main',
              fontSize: isXs ? (isPortrait ? '0.7rem' : '0.75rem') :
                       isSm ? (isPortrait ? '0.75rem' : '0.875rem') :
                       isMd ? '0.875rem' : '1rem',
            }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
          <Box sx={{
            flexGrow: 1,
            minWidth: 0,
            width: isVerySmallPortrait || (isXs && isPortrait) ? '100%' : 'auto'
          }}>
            <Typography
              variant={isXs ? (isPortrait ? "caption" : "body2") :
                       isSm ? (isPortrait ? "body2" : "body2") :
                       isMd ? "subtitle2" : "subtitle2"}
              noWrap={!(isVerySmallPortrait || (isXs && isPortrait))}
              component="div"
              fontWeight="medium"
              sx={{
                fontSize: isVerySmallPortrait ? '0.7rem' :
                         isXs ? (isPortrait ? '0.75rem' : '0.8rem') :
                         isSm ? (isPortrait ? '0.8rem' : '0.875rem') :
                         isMd ? '0.9rem' : '1rem'
              }}
            >
              {user?.full_name || 'Admin User'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap={!(isVerySmallPortrait || (isXs && isPortrait))}
              component="div"
              sx={{
                fontSize: isVerySmallPortrait ? '0.6rem' :
                         isXs ? (isPortrait ? '0.65rem' : '0.7rem') :
                         isSm ? (isPortrait ? '0.7rem' : '0.75rem') :
                         isMd ? '0.75rem' : '0.75rem',
                mt: isVerySmallPortrait || (isXs && isPortrait) ? 0.25 : 0
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{
          minHeight: isXs ? 48 : isSm ? 52 : isMd ? 56 : 64,
          px: isXs ? 1.5 : isSm ? 2 : isMd ? 2.5 : 3
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: isXs ? 0.5 : isSm ? 1 : isMd ? 1.5 : 2,
              display: { md: 'none' },
              padding: isXs ? '6px' : '8px'
            }}
            size={isXs ? "small" : "medium"}
          >
            <MenuIcon sx={{ fontSize: isXs ? '1.25rem' : '1.5rem' }} />
          </IconButton>

                  <Typography
                    variant={isXs ? "body1" : isSm ? "subtitle1" : isMd ? "subtitle1" : "h6"}
                    noWrap
                    component="div"
                    sx={{
                      flexGrow: 1,
                      fontSize: isXs ? '0.9rem' : isSm ? '1rem' : isMd ? '1.1rem' : '1.25rem',
                      fontWeight: isXs || isSm ? 500 : 400
                    }}
                  >
                    {(() => {
                      // Prefer exact child match to show a more specific page title (e.g., Advanced Reports)
                      for (const parent of visibleMenuItems) {
                        if (parent.children && parent.children.length) {
                          const child = parent.children.find(c => isChildActive(c, parent));
                          if (child) return child.text;
                        }
                      }
                      return visibleMenuItems.find(item => isItemActive(item))?.text || 'Dashboard';
                    })()}
                  </Typography>

          {/* Notifications - Hide on very small screens */}
          {!isXs && <NotificationsDropdown />}

          {/* Profile Menu */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{
                ml: isXs ? 0 : isSm ? 0.5 : 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                padding: isXs ? '6px' : '8px'
              }}
              size={isXs ? "small" : "medium"}
            >
              <AccountCircle sx={{ fontSize: isXs ? '1.25rem' : '1.5rem' }} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: isXs || isSm ? 180 : 200,
                '& .MuiAvatar-root': {
                  width: isXs || isSm ? 28 : 32,
                  height: isXs || isSm ? 28 : 32,
                  ml: -0.5,
                  mr: 1,
                },
                '& .MuiMenuItem-root': {
                  fontSize: isXs || isSm ? '0.875rem' : '1rem',
                  py: isXs || isSm ? 1 : 1.5,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => navigate('/settings')}>
              <Avatar sx={{ backgroundColor: 'primary.main' }}>
                {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
              </Avatar>
              Profile Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 }
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e0e0e0',
              backgroundColor: 'background.paper',
              border: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar sx={{
          minHeight: isXs ? 48 : isSm ? 52 : isMd ? 56 : 64,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }} />
        <Box
          sx={{
            flex: 1,
            p: isXs ? (isPortrait ? 1 : 1.5) :
               isSm ? (isPortrait ? 1.5 : 2) :
               isMd ? 2.5 : 3,
            pt: isXs ? (isPortrait ? 0.5 : 1) :
                isSm ? (isPortrait ? 1 : 1.5) :
                isMd ? 1.5 : 2,
            overflow: 'auto',
            '& > *': {
              maxWidth: '100%',
            },
            // Ensure content doesn't get too cramped in very small screens
            minHeight: isVerySmallPortrait ? 'calc(100vh - 48px)' :
                      isXs && isPortrait ? 'calc(100vh - 52px)' :
                      isSm && isPortrait ? 'calc(100vh - 56px)' : 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;