import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material';
import { Smartphone, Computer, AdminPanelSettings } from '@mui/icons-material';
import {
  isMobileDevice,
  isDesktopDevice,
  shouldShowAdminInterface,
  shouldRedirectToMobileApp,
  getMobileAppUrl,
} from '../../utils/deviceDetection';

const MobileRedirectScreen = () => {
  const [countdown, setCountdown] = useState(5);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRedirecting(true);
          // Redirect to mobile app
          window.location.href = getMobileAppUrl();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleStayOnDesktop = () => {
    // Add admin parameter to URL to force desktop interface
    const url = new URL(window.location);
    url.searchParams.set('admin', 'true');
    window.location.href = url.toString();
  };

  const handleGoToMobile = () => {
    window.location.href = getMobileAppUrl();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: 500,
          width: '100%',
        }}
      >
        <Smartphone
          sx={{
            fontSize: 64,
            color: 'primary.main',
            mb: 2,
          }}
        />
        
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Mobile Device Detected
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          We've detected you're using a mobile device. For the best experience, 
          we recommend using our mobile-optimized interface.
        </Typography>

        {redirecting ? (
          <Box sx={{ my: 3 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Redirecting to mobile interface...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Redirecting in {countdown} seconds...
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<Smartphone />}
                onClick={handleGoToMobile}
                size="large"
              >
                Go to Mobile App
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<AdminPanelSettings />}
                onClick={handleStayOnDesktop}
                size="large"
              >
                Use Admin Panel
              </Button>
            </Box>
          </Box>
        )}
        
        <Typography variant="caption" color="text.secondary">
          You can always access the admin panel by adding ?admin=true to the URL
        </Typography>
      </Paper>
    </Box>
  );
};

const DesktopOnlyScreen = () => {
  const handleGoToMobile = () => {
    window.location.href = getMobileAppUrl();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: 500,
          width: '100%',
        }}
      >
        <Computer
          sx={{
            fontSize: 64,
            color: 'primary.main',
            mb: 2,
          }}
        />
        
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Desktop Interface Required
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          The admin dashboard is optimized for desktop use. Please access this 
          interface from a desktop or laptop computer for the best experience.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<Smartphone />}
          onClick={handleGoToMobile}
          size="large"
          sx={{ mt: 2 }}
        >
          Go to Mobile Interface
        </Button>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Or add ?admin=true to the URL to force desktop interface
        </Typography>
      </Paper>
    </Box>
  );
};

const DeviceRouter = ({ children }) => {
  const [deviceChecked, setDeviceChecked] = useState(false);
  const [showAdminInterface, setShowAdminInterface] = useState(false);

  useEffect(() => {
    // Check device type and determine which interface to show
    const checkDevice = () => {
      const shouldShowAdmin = shouldShowAdminInterface();
      const shouldRedirect = shouldRedirectToMobileApp();
      
      setShowAdminInterface(shouldShowAdmin);
      setDeviceChecked(true);
      
      // If mobile user should be redirected and no admin override
      if (shouldRedirect) {
        // Don't show redirect screen, just redirect immediately
        // window.location.href = getMobileAppUrl();
        return;
      }
    };

    checkDevice();
  }, []);

  // Show loading while checking device
  if (!deviceChecked) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Show mobile redirect screen for mobile devices
  if (shouldRedirectToMobileApp()) {
    return <MobileRedirectScreen />;
  }

  // Show desktop-only message for mobile devices trying to access admin without override
  if (isMobileDevice() && !shouldShowAdminInterface()) {
    return <DesktopOnlyScreen />;
  }

  // Show admin interface for desktop or when forced
  if (showAdminInterface || isDesktopDevice()) {
    return children;
  }

  // Default fallback
  return <MobileRedirectScreen />;
};

export default DeviceRouter;