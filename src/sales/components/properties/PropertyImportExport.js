import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  FileDownload,
  FileUpload,
  CloudDownload,
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { propertiesAPI } from '../../../main-dashboard/services/api';

const PropertyImportExport = ({ open, onClose, onImportComplete }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Export state
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFilters, setExportFilters] = useState({
    includeImages: false,
    includeInactive: false,
    dateRange: 'all',
    propertyType: 'all',
    status: 'all',
  });
  
  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [importProgress, setImportProgress] = useState(0);

  // Sample data for template
  const sampleData = [
    {
      title: 'Modern 2BHK Apartment',
      description: 'Beautiful apartment with modern amenities',
      property_type: 'apartment',
      status: 'available',
      price: '25 lakhs',
      area: '1200',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: '123 Main Street, Andheri West',
      contact_phone: '9876543210',
      contact_email: 'contact@example.com',
      built_year: '2020',
      is_featured: 'false',
    },
    {
      title: '3BHK Villa with Garden',
      description: 'Spacious villa with private garden',
      property_type: 'villa',
      status: 'available',
      price: '1.2 crore',
      area: '2500',
      city: 'Pune',
      state: 'Maharashtra',
      address: '456 Garden Road, Koregaon Park',
      contact_phone: '9876543211',
      contact_email: 'villa@example.com',
      built_year: '2019',
      is_featured: 'true',
    },
  ];

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        format: exportFormat,
        ...exportFilters,
      };
      
      const response = await propertiesAPI.bulkExport(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `properties_${new Date().toISOString().split('T')[0]}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Properties exported successfully!');
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', error);
      setError('Failed to export properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'title', 'description', 'property_type', 'status', 'price', 'area',
      'city', 'state', 'address', 'contact_phone', 'contact_email',
      'built_year', 'is_featured', 'features', 'zip_code', 'location',
      'unit_number', 'outstanding_amount'
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'property_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImportFile(file);
      parseImportFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const parseImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const preview = lines.slice(1, 6).map((line, index) => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const row = { id: index, errors: [], warnings: [] };
        
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        
        // Validate required fields
        if (!row.title) row.errors.push('Title is required');
        if (!row.price) row.errors.push('Price is required');
        if (!row.city) row.errors.push('City is required');
        
        // Validate data formats
        if (row.area && isNaN(parseFloat(row.area))) {
          row.warnings.push('Area should be numeric');
        }
        if (row.built_year && (isNaN(parseInt(row.built_year)) || parseInt(row.built_year) < 1900)) {
          row.warnings.push('Invalid built year');
        }
        if (row.contact_phone && !/^\d{10}$/.test(row.contact_phone.replace(/\D/g, ''))) {
          row.warnings.push('Invalid phone number format');
        }
        
        return row;
      }).filter(row => row.title); // Filter out empty rows
      
      setImportPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    try {
      setLoading(true);
      setError(null);
      setImportProgress(0);
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await propertiesAPI.bulkImport(formData);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setImportResults(response.data);
      setSuccess(`Import completed! ${response.data.success} properties imported successfully.`);
      
      if (onImportComplete) {
        onImportComplete();
      }
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Import failed:', error);
      setError('Failed to import properties. Please check your file format and try again.');
      setImportProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab(0);
    setImportFile(null);
    setImportPreview([]);
    setImportResults(null);
    setImportProgress(0);
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Import / Export Properties
      </DialogTitle>
      
      <DialogContent>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<FileDownload />} label="Export" />
          <Tab icon={<FileUpload />} label="Import" />
        </Tabs>
        
        <Box sx={{ mt: 3 }}>
          {/* Export Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Export Properties
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Export your property data in various formats for backup or analysis.
              </Typography>
              
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Export Options
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Export Format</InputLabel>
                    <Select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      label="Export Format"
                    >
                      <MenuItem value="csv">CSV (Comma Separated Values)</MenuItem>
                      <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                      <MenuItem value="json">JSON</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportFilters.includeImages}
                        onChange={(e) => setExportFilters({
                          ...exportFilters,
                          includeImages: e.target.checked
                        })}
                      />
                    }
                    label="Include image URLs"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportFilters.includeInactive}
                        onChange={(e) => setExportFilters({
                          ...exportFilters,
                          includeInactive: e.target.checked
                        })}
                      />
                    }
                    label="Include inactive properties"
                  />
                </Box>
                
                <Button
                  variant="contained"
                  startIcon={<CloudDownload />}
                  onClick={handleExport}
                  disabled={loading}
                  size="large"
                >
                  {loading ? 'Exporting...' : 'Export Properties'}
                </Button>
              </Paper>
            </Box>
          )}
          
          {/* Import Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Import Properties
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Import properties from CSV, Excel, or JSON files. Download the template to see the required format.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Before importing:</strong> Download the template file to see the required format and column names.
                </Typography>
              </Alert>
              
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Step 1: Download Template
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownload />}
                    onClick={handleDownloadTemplate}
                  >
                    Download Template
                  </Button>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Step 2: Upload Your File
                </Typography>
                
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    mb: 3,
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to select file (CSV, Excel, JSON - Max 10MB)
                  </Typography>
                  {importFile && (
                    <Chip
                      label={importFile.name}
                      color="primary"
                      sx={{ mt: 2 }}
                      onDelete={() => {
                        setImportFile(null);
                        setImportPreview([]);
                      }}
                    />
                  )}
                </Box>
                
                {/* Import Progress */}
                {loading && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Importing properties... {importProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={importProgress} />
                  </Box>
                )}
                
                {/* Import Preview */}
                {importPreview.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Preview (First 5 rows)
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>City</TableCell>
                            <TableCell>Issues</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {importPreview.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>
                                {row.errors.length > 0 ? (
                                  <ErrorIcon color="error" />
                                ) : row.warnings.length > 0 ? (
                                  <Warning color="warning" />
                                ) : (
                                  <CheckCircle color="success" />
                                )}
                              </TableCell>
                              <TableCell>{row.title}</TableCell>
                              <TableCell>{row.property_type}</TableCell>
                              <TableCell>{row.price}</TableCell>
                              <TableCell>{row.city}</TableCell>
                              <TableCell>
                                {row.errors.map((error, i) => (
                                  <Chip key={i} label={error} color="error" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                ))}
                                {row.warnings.map((warning, i) => (
                                  <Chip key={i} label={warning} color="warning" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                
                {/* Import Results */}
                {importResults && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Import completed!</strong><br />
                      • {importResults.success} properties imported successfully<br />
                      • {importResults.failed} properties failed to import<br />
                      • {importResults.skipped} properties skipped (duplicates)
                    </Typography>
                  </Alert>
                )}
                
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={handleImport}
                  disabled={!importFile || loading}
                  size="large"
                >
                  {loading ? 'Importing...' : 'Import Properties'}
                </Button>
              </Paper>
            </Box>
          )}
          
          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertyImportExport;
