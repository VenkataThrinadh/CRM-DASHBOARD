import React, { useState, useEffect, useCallback } from 'react';
import { formatDateDDMMYYYY } from '../../../loans/utils/dateFormatter';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Send, Refresh } from '@mui/icons-material';
import { enquiriesAPI } from '../../../main-dashboard/services/api';

const EnquiryDetail = ({ enquiryId, onClose, embedded = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [enquiry, setEnquiry] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const fetchEnquiryDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch enquiry details
      const enquiryResponse = await enquiriesAPI.getById(enquiryId);
      setEnquiry(enquiryResponse.data);
      
      // Fetch enquiry replies
      const repliesResponse = await enquiriesAPI.getReplies(enquiryId);
      setReplies(repliesResponse.data.replies || []);
      
    } catch (err) {
      setError('Failed to load enquiry details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [enquiryId]);
  
  useEffect(() => {
    if (enquiryId) {
      fetchEnquiryDetails();
    }
  }, [enquiryId, fetchEnquiryDetails]);
  
  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    
    try {
      setSending(true);
      setError(null);
      
      // Send the reply
      const response = await enquiriesAPI.respond(enquiryId, replyMessage);
      
      // Add the new reply to the list
      setReplies(prev => [...prev, response.data.reply]);
      
      // Clear the input
      setReplyMessage('');
      
    } catch (err) {
      setError('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: embedded ? (isMobile ? '200px' : '250px') : (isMobile ? '300px' : '400px')
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!enquiry) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Enquiry not found</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: embedded ? 'auto' : '100%' }}>
      {/* Header (hidden when embedded) */}
      {!embedded && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant={isMobile ? "h6" : "h5"} component="h2">
              Enquiry Details
            </Typography>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchEnquiryDetails} size={isMobile ? "small" : "medium"}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Property: {enquiry.property_title}
          </Typography>
          {enquiry.plot_number && (
            <Typography variant="subtitle2" gutterBottom>
              Plot: {enquiry.plot_number}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            From: {enquiry.name || enquiry.user_name || 'Unknown'}
            {enquiry.email && ` (${enquiry.email})`}
          </Typography>
        </Paper>
      )}
      
      {/* Original Message (hide when embedded; page already shows it) */}
      {!embedded && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Original Message:
          </Typography>
          <Typography variant="body1">{enquiry.message}</Typography>
        </Paper>
      )}
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Conversation */}
      <Paper sx={{ 
        flex: embedded ? 'none' : 1, 
        mb: 2, 
        p: 2,
        maxHeight: embedded ? (isMobile ? '240px' : '300px') : (isMobile ? '300px' : '400px'),
        overflow: 'auto'
      }}>
        <Typography variant="subtitle1" gutterBottom>
          {embedded ? 'Conversation' : 'Conversation History'}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {replies.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            No replies yet
          </Typography>
        ) : (
          replies.map((reply, index) => (
            <Box key={reply.id || index} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                <Avatar
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: reply.sender_type === 'admin' ? 'primary.main' : 'secondary.main'
                  }}
                >
                  {reply.sender_type === 'admin' ? 'A' : 'U'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">
                    {reply.sender_type === 'admin' ? 'Admin' : 'User'}
                  </Typography>
                  <Paper sx={{ 
                    p: 1.5,
                    bgcolor: reply.sender_type === 'admin' ? 'primary.50' : 'grey.50'
                  }}>
                    <Typography variant="body1">{reply.message}</Typography>
                  </Paper>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateDDMMYYYY(reply.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Paper>
      
      {/* Reply Input */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Type your reply..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            disabled={sending}
            size={isMobile ? "small" : "medium"}
          />
          <Button
            variant="contained"
            onClick={handleSendReply}
            disabled={!replyMessage.trim() || sending}
            sx={{ minWidth: isMobile ? 'auto' : 100 }}
          >
            {sending ? (
              <CircularProgress size={24} />
            ) : (
              <>
                {isMobile ? <Send /> : 'Send'}
              </>
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EnquiryDetail;
