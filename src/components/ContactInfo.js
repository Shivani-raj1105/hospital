import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const CONTACT_INFO = {
  phone: {
    title: 'Contact Numbers',
    icon: <PhoneIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    content: (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Emergency: 108
        </Typography>
        <Typography variant="h6" gutterBottom color="primary">
          Reception: +91 1234567890
        </Typography>
        <Typography variant="h6" gutterBottom color="primary">
          Ambulance: +91 9876543210
        </Typography>
      </Box>
    ),
  },
  email: {
    title: 'Email Address',
    icon: <EmailIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
    content: (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom color="secondary">
          General Inquiries: info@hospital.com
        </Typography>
        <Typography variant="h6" gutterBottom color="secondary">
          Appointments: appointments@hospital.com
        </Typography>
        <Typography variant="h6" gutterBottom color="secondary">
          Emergency: emergency@hospital.com
        </Typography>
      </Box>
    ),
  },
  location: {
    title: 'Hospital Address',
    icon: <LocationOnIcon sx={{ fontSize: 40, color: 'success.main' }} />,
    content: (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom color="success.main">
          Main Hospital
        </Typography>
        <Typography variant="body1" paragraph>
          123 Medical Center Drive
        </Typography>
        <Typography variant="body1" paragraph>
          Healthcare District
        </Typography>
        <Typography variant="body1" paragraph>
          City, State - 123456
        </Typography>
        <Typography variant="body1" paragraph>
          India
        </Typography>
      </Box>
    ),
  },
  hours: {
    title: 'Operating Hours',
    icon: <AccessTimeIcon sx={{ fontSize: 40, color: 'info.main' }} />,
    content: (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom color="info.main">
          Regular Hours
        </Typography>
        <Typography variant="body1" paragraph>
          Monday - Friday: 8:00 AM - 8:00 PM
        </Typography>
        <Typography variant="body1" paragraph>
          Saturday: 9:00 AM - 5:00 PM
        </Typography>
        <Typography variant="body1" paragraph>
          Sunday: Emergency Only
        </Typography>
        <Typography variant="h6" gutterBottom color="info.main" sx={{ mt: 2 }}>
          Emergency Department
        </Typography>
        <Typography variant="body1">
          24/7 Open
        </Typography>
      </Box>
    ),
  },
};

const ContactInfo = ({ open, onClose, type }) => {
  const info = CONTACT_INFO[type];

  if (!info) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(90deg, #f5f7fa 0%, #e4e8eb 100%)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {info.icon}
          <Typography variant="h6" component="div">
            {info.title}
          </Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {info.content}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactInfo; 