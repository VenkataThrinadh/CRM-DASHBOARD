import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './main-dashboard/App';
import reportWebVitals from './main-dashboard/reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
