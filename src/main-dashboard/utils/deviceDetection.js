// Device detection utilities for routing between mobile and desktop interfaces

export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check for mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(userAgent);
  
  // Check screen size
  const isMobileScreen = window.innerWidth <= 768;
  
  // Check touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isMobileScreen && isTouchDevice);
};

export const isTabletDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;
  const isTabletUA = tabletRegex.test(userAgent);
  const isTabletScreen = window.innerWidth >= 768 && window.innerWidth <= 1024;
  
  return isTabletUA || isTabletScreen;
};

export const isDesktopDevice = () => {
  return !isMobileDevice() && !isTabletDevice();
};

export const getDeviceType = () => {
  if (isMobileDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
};

export const shouldShowAdminInterface = () => {
  // Allow admin interface on all devices for now
  // Users can access the admin dashboard from any device

  // Always show admin interface unless explicitly disabled
  return true;
  
  // Original logic (commented out):
  // return isDesktopDevice() || forceAdmin;
};

export const shouldRedirectToMobileApp = () => {
  // For now, disable mobile app redirection to prevent infinite loops
  // Mobile users can access the admin interface directly
  return false;
  
  // Original logic (commented out to prevent redirect loops):
  // const isMobile = isMobileDevice();
  // const isAdminRoute = window.location.pathname.includes('/admin') || 
  //                     window.location.pathname.includes('/dashboard') ||
  //                     window.location.pathname.includes('/login');
  // 
  // // Don't redirect if user is trying to access admin interface
  // const urlParams = new URLSearchParams(window.location.search);
  // const forceAdmin = urlParams.get('admin') === 'true';
  // 
  // return isMobile && !isAdminRoute && !forceAdmin;
};

export const getMobileAppUrl = () => {
  // Return the URL for the mobile app interface
  // This could be a different subdomain or path
  return 'https://mobileapplication.creativeethics.co.in/app';
};

export const getAdminUrl = () => {
  // Return the URL for the admin interface
  return 'https://mobileapplication.creativeethics.co.in/';
};

// Screen size breakpoints
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

export const getScreenSize = () => {
  const width = window.innerWidth;
  
  if (width < breakpoints.mobile) return 'mobile';
  if (width < breakpoints.tablet) return 'tablet';
  if (width < breakpoints.desktop) return 'desktop';
  return 'large-desktop';
};

// Responsive utilities
export const useResponsive = () => {
  // This will be implemented when React is imported in components that use it
  // For now, return static values for non-React usage
  return {
    screenSize: getScreenSize(),
    deviceType: getDeviceType(),
    isMobile: getDeviceType() === 'mobile',
    isTablet: getDeviceType() === 'tablet',
    isDesktop: getDeviceType() === 'desktop',
  };
};