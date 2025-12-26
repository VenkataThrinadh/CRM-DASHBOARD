import React from 'react';
import { formatDateDDMMYYYY } from '../../../loans/utils/dateFormatter';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Image as ImageIcon,
  TextSnippet as TextIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

const DocumentCard = ({ 
  document, 
  onView, 
  onEdit, 
  onDelete, 
  onDownload 
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return <PdfIcon sx={{ color: '#d32f2f' }} />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <DocIcon sx={{ color: '#1976d2' }} />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <ExcelIcon sx={{ color: '#388e3c' }} />;
    if (mimeType.includes('image')) return <ImageIcon sx={{ color: '#f57c00' }} />;
    if (mimeType.includes('text')) return <TextIcon sx={{ color: '#616161' }} />;
    return <FileIcon sx={{ color: '#757575' }} />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'archived': return 'warning';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header with file icon and menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'transparent', width: 40, height: 40 }}>
            {getFileIcon(document.mime_type)}
          </Avatar>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            aria-label="more options"
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Document Title */}
        <Typography variant="h6" component="h3" gutterBottom sx={{ fontSize: '1.1rem' }}>
          {truncateText(document.title, 50)}
        </Typography>

        {/* Description */}
        {document.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {truncateText(document.description, 80)}
          </Typography>
        )}

        {/* Category and Status */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={document.category_name}
            size="small"
            sx={{ 
              bgcolor: document.category_color || '#007bff', 
              color: 'white',
              fontSize: '0.75rem'
            }}
          />
          <Chip
            label={document.status}
            size="small"
            color={getStatusColor(document.status)}
          />
        </Box>

        {/* Property Info */}
        {document.property_title && (
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Property: {truncateText(document.property_title, 30)}
          </Typography>
        )}

        {/* File Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(document.file_size)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDateDDMMYYYY(document.created_at)}
          </Typography>
        </Box>

        {/* Original filename */}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {truncateText(document.original_filename, 40)}
        </Typography>
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 0.5, width: '100%', justifyContent: 'center' }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => onView(document)}
              color="primary"
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton
              size="small"
              onClick={() => onDownload(document.id, document.original_filename)}
              color="info"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => onEdit(document)}
              color="warning"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete(document.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 180,
          },
        }}
      >
        <MenuItem onClick={() => { onView(document); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { onDownload(document.id, document.original_filename); handleMenuClose(); }}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { onEdit(document); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => { onDelete(document.id); handleMenuClose(); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default DocumentCard;