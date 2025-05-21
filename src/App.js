import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { QRCodeSVG } from 'qrcode.react';
import Chatbot from './components/Chatbot';
import ContactInfo from './components/ContactInfo';

const DOCTORS = {
  'Dr. Sharma': 'Cardiology',
  'Dr. Patel': 'Neurology',
  'Dr. Gupta': 'Orthopedics',
  'Dr. Singh': 'Pediatrics',
  'Dr. Verma': 'Dermatology',
  'Dr. Kumar': 'General Medicine',
};

const App = () => {
  const theme = useTheme();
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [showTokenGenerator, setShowTokenGenerator] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    age: '',
    gender: '',
    doctor: '',
  });

  const handleContactClick = (type) => {
    setSelectedContact(type);
    setShowContactInfo(true);
  };

  const handleTokenUpdate = (token, doctor) => {
    setCurrentToken(token);
    setCurrentDoctor(doctor);
  };

  const handleTokenGeneratorOpen = () => {
    setShowTokenGenerator(true);
    setQrCodeData(null);
  };

  const handleTokenGeneratorClose = () => {
    setShowTokenGenerator(false);
    setTokenForm({
      name: '',
      age: '',
      gender: '',
      doctor: '',
    });
  };

  const generateTokenNumber = () => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `T${day}${month}${random}`;
  };

  const handleTokenSubmit = () => {
    if (tokenForm.name && tokenForm.age && tokenForm.gender && tokenForm.doctor) {
      const newToken = generateTokenNumber();
      const doctorInfo = `${tokenForm.doctor} (${DOCTORS[tokenForm.doctor]})`;
      
      const qrData = {
        token: newToken,
        name: tokenForm.name,
        age: tokenForm.age,
        gender: tokenForm.gender,
        doctor: tokenForm.doctor,
        specialty: DOCTORS[tokenForm.doctor],
        timestamp: new Date().toISOString()
      };
      
      setQrCodeData(qrData);
      setCurrentToken(newToken);
      setCurrentDoctor(doctorInfo);
      
      handleTokenGeneratorClose();
      
      setTimeout(() => {
        setShowQRCode(true);
      }, 100);
    }
  };

  const renderQRCode = (qrData) => {
    return (
      <Box sx={{ 
        p: 2, 
        bgcolor: 'white', 
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        width: 'fit-content',
        margin: '0 auto'
      }}>
        <Box sx={{ 
          position: 'relative',
          width: 'fit-content',
          margin: '0 auto'
        }}>
          <QRCodeSVG
            value={JSON.stringify(qrData)}
            size={200}
            level="H"
            includeMargin={true}
            style={{ display: 'block' }}
          />
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'white',
            borderRadius: '8px',
            padding: '4px 8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '2px solid #1976D2',
            textAlign: 'center',
            minWidth: '120px'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#1976D2',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                letterSpacing: '0.5px'
              }}
            >
              {qrData.token}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ 
          textAlign: 'center',
          mt: 2,
          p: 1,
          bgcolor: '#f5f5f5',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {qrData.name} • {qrData.age} years • {qrData.gender}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {qrData.doctor} ({qrData.specialty})
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      pb: 4,
    }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(90deg, #2E7D32 0%, #43A047 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar>
          <LocalHospitalIcon sx={{ mr: 2, fontSize: { xs: '2rem', sm: '2.5rem' } }} />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '2rem' },
              background: 'linear-gradient(45deg, #FFFFFF 30%, #E3F2FD 90%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Hospital Front Desk AI
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Token Display Bar */}
      {currentToken && (
        <Paper
          elevation={3}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            mt: 2,
            mx: 2,
            p: 2,
            background: 'linear-gradient(90deg, #1976D2 0%, #2196F3 100%)',
            color: 'white',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(33, 150, 243, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalHospitalIcon sx={{ fontSize: '2rem' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Current Token: {currentToken}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Doctor: {currentDoctor}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<QrCode2Icon />}
              onClick={() => setShowQRCode(true)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Show QR Code
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleTokenGeneratorOpen}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Generate New Token
            </Button>
          </Box>
        </Paper>
      )}

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={3}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Chatbot onTokenUpdate={handleTokenUpdate} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Quick Access
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <IconButton 
                        onClick={() => handleContactClick('phone')}
                        sx={{ 
                          width: '100%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'primary.light',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.main' },
                        }}
                      >
                        <PhoneIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs={6}>
                      <IconButton 
                        onClick={() => handleContactClick('email')}
                        sx={{ 
                          width: '100%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'secondary.light',
                          color: 'white',
                          '&:hover': { bgcolor: 'secondary.main' },
                        }}
                      >
                        <EmailIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs={6}>
                      <IconButton 
                        onClick={() => handleContactClick('location')}
                        sx={{ 
                          width: '100%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'success.light',
                          color: 'white',
                          '&:hover': { bgcolor: 'success.main' },
                        }}
                      >
                        <LocationOnIcon />
                      </IconButton>
                    </Grid>
                    <Grid item xs={6}>
                      <IconButton 
                        onClick={() => handleContactClick('hours')}
                        sx={{ 
                          width: '100%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'info.light',
                          color: 'white',
                          '&:hover': { bgcolor: 'info.main' },
                        }}
                      >
                        <AccessTimeIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Hospital Hours
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Monday - Friday: 8:00 AM - 8:00 PM
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Saturday: 9:00 AM - 5:00 PM
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sunday: Emergency Only
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* QR Code Dialog */}
      <Dialog
        open={showQRCode}
        onClose={() => setShowQRCode(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(90deg, #1976D2 0%, #2196F3 100%)',
          color: 'white',
        }}>
          Patient QR Code
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2,
          pt: 3,
          pb: 2
        }}>
          {qrCodeData ? (
            renderQRCode(qrCodeData)
          ) : (
            <Typography color="error">
              No QR code data available. Please generate a new token.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowQRCode(false)}
            variant="outlined"
          >
            Close
          </Button>
          {qrCodeData && (
            <Button
              variant="contained"
              onClick={() => {
                // Create a canvas element
                const canvas = document.createElement('canvas');
                const svg = document.querySelector('svg');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                // Convert SVG to data URL
                const svgData = new XMLSerializer().serializeToString(svg);
                const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(svgBlob);
                
                img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                  
                  // Add token number text
                  ctx.font = 'bold 24px Arial';
                  ctx.fillStyle = '#1976D2';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(qrCodeData.token, canvas.width/2, canvas.height/2);
                  
                  // Convert to PNG and download
                  const pngFile = canvas.toDataURL('image/png');
                  const downloadLink = document.createElement('a');
                  downloadLink.download = `patient-token-${qrCodeData.token}.png`;
                  downloadLink.href = pngFile;
                  downloadLink.click();
                };
                
                img.src = url;
              }}
            >
              Download QR Code
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Token Generator Dialog */}
      <Dialog 
        open={showTokenGenerator} 
        onClose={handleTokenGeneratorClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(90deg, #1976D2 0%, #2196F3 100%)',
          color: 'white',
        }}>
          Generate New Token
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Patient Name"
                value={tokenForm.name}
                onChange={(e) => setTokenForm(prev => ({ ...prev, name: e.target.value }))}
                required
                error={!tokenForm.name && tokenForm.doctor !== ''}
                helperText={!tokenForm.name && tokenForm.doctor !== '' ? "Name is required" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={tokenForm.age}
                onChange={(e) => setTokenForm(prev => ({ ...prev, age: e.target.value }))}
                required
                error={!tokenForm.age && tokenForm.doctor !== ''}
                helperText={!tokenForm.age && tokenForm.doctor !== '' ? "Age is required" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={tokenForm.gender}
                onChange={(e) => setTokenForm(prev => ({ ...prev, gender: e.target.value }))}
                required
                error={!tokenForm.gender && tokenForm.doctor !== ''}
                helperText={!tokenForm.gender && tokenForm.doctor !== '' ? "Gender is required" : ""}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Select Doctor"
                value={tokenForm.doctor}
                onChange={(e) => setTokenForm(prev => ({ ...prev, doctor: e.target.value }))}
                required
                error={!tokenForm.doctor && tokenForm.name !== ''}
                helperText={!tokenForm.doctor && tokenForm.name !== '' ? "Doctor is required" : ""}
              >
                {Object.entries(DOCTORS).map(([name, specialty]) => (
                  <MenuItem key={name} value={name}>
                    {name} ({specialty})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleTokenGeneratorClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleTokenSubmit}
            variant="contained"
            color="primary"
            disabled={!tokenForm.name || !tokenForm.age || !tokenForm.gender || !tokenForm.doctor}
          >
            Generate Token
          </Button>
        </DialogActions>
      </Dialog>

      <ContactInfo
        open={showContactInfo}
        onClose={() => setShowContactInfo(false)}
        type={selectedContact}
      />
    </Box>
  );
};

export default App; 