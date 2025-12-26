import React from 'react';
import { Navigate } from 'react-router-dom';

// Staff page removed — redirect users to Manage Users under Settings
export default function Staff() {
  return <Navigate to="/settings/manage-users" replace />;
}