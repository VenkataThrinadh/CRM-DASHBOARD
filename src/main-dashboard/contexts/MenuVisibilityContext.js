import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const MenuVisibilityContext = createContext();

export const useMenuVisibility = () => {
  const context = useContext(MenuVisibilityContext);
  if (!context) {
    throw new Error('useMenuVisibility must be used within a MenuVisibilityProvider');
  }
  return context;
};

export const MenuVisibilityProvider = ({ children }) => {
  const [menuVisibility, setMenuVisibility] = useState({});
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();

  // Initial load
  useEffect(() => {
    loadMenuVisibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when user changes (e.g., after login/logout)
  useEffect(() => {
    if (user) {
      loadMenuVisibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadMenuVisibility = async () => {
    const token = localStorage.getItem('adminToken');

    // If not authenticated yet, skip server call and use localStorage only
    if (!token) {
      try {
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.menuVisibility) {
            setMenuVisibility(parsed.menuVisibility);
          }
        }
      } catch (_e) {}
      setLoaded(true);
      return;
    }

    try {
      // Try server first (per-user persistence across devices)
      const resp = await settingsAPI.getMenuVisibility();
      let serverVis = resp?.data?.menuVisibility;
      // Handle JSON coming back as string or object
      if (typeof serverVis === 'string') {
        try { serverVis = JSON.parse(serverVis); } catch (_) { serverVis = null; }
      }
      if (serverVis && typeof serverVis === 'object') {
        setMenuVisibility(serverVis);
        // Also mirror to localStorage for quick access
        const currentSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
        localStorage.setItem('adminSettings', JSON.stringify({ ...currentSettings, menuVisibility: serverVis }));
        setLoaded(true);
        return;
      }
    } catch (_e) {
      // Fallback to local storage if server unavailable
    }

    // Fallback: localStorage
    try {
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.menuVisibility) {
          setMenuVisibility(parsed.menuVisibility);
        }
      }
    } catch (_e2) {
      // ignore
    } finally {
      setLoaded(true);
    }
  };

  const updateMenuVisibility = async (newVisibility) => {
    setMenuVisibility(newVisibility);

    // Persist locally for fast UX
    try {
      const currentSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
      localStorage.setItem('adminSettings', JSON.stringify({ ...currentSettings, menuVisibility: newVisibility }));
    } catch (_e) {}

    // Persist to server for cross-device persistence
    try {
      await settingsAPI.updateMenuVisibility(newVisibility);
    } catch (_e) {
      // ignore network errors; local copy remains
    }
  };

  return (
    <MenuVisibilityContext.Provider value={{ menuVisibility, updateMenuVisibility, loadMenuVisibility, loaded }}>
      {children}
    </MenuVisibilityContext.Provider>
  );
};