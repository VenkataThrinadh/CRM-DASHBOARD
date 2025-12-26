import React, { useState } from 'react';
import { Card, CardContent, Typography, TextField, InputAdornment, IconButton, Box } from '@mui/material';
import { ContentCopy, OpenInNew } from '@mui/icons-material';

const ContactCloneUrl = ({ cloneUrl }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!cloneUrl) return;
    try {
      await navigator.clipboard.writeText(cloneUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  const handleOpen = () => {
    if (!cloneUrl) return;
    window.open(cloneUrl, '_blank', 'noopener');
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Clone URL
        </Typography>
        {cloneUrl ? (
          <Box>
            <TextField
              fullWidth
              value={cloneUrl}
              size="small"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopy} size="small" aria-label="copy clone url">
                      <ContentCopy />
                    </IconButton>
                    <IconButton onClick={handleOpen} size="small" aria-label="open clone url">
                      <OpenInNew />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {copied && (
              <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                Copied to clipboard
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No clone URL configured
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCloneUrl;
