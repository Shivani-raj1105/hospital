import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Avatar,
  Fade,
  useTheme,
  useMediaQuery,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { QRCodeCanvas } from 'qrcode.react';

const CONVERSATION_STAGES = {
  GREETING: 'greeting',
  ASK_NAME: 'ask_name',
  ASK_AGE: 'ask_age',
  ASK_GENDER: 'ask_gender',
  ASK_DOCTOR: 'ask_doctor',
  SHOW_TOKEN: 'show_token',
  MAIN_CONVERSATION: 'main_conversation',
};

const DOCTORS = {
  'Dr. Sharma': 'Cardiology',
  'Dr. Patel': 'Neurology',
  'Dr. Gupta': 'Orthopedics',
  'Dr. Singh': 'Pediatrics',
  'Dr. Verma': 'Dermatology',
  'Dr. Kumar': 'General Medicine',
};

const Chatbot = ({ onTokenUpdate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationStage, setConversationStage] = useState(CONVERSATION_STAGES.GREETING);
  const [userInfo, setUserInfo] = useState({
    name: '',
    age: '',
    gender: '',
  });
  const [tokenNumber, setTokenNumber] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // Add localStorage key for persistence
  const QR_CODE_STORAGE_KEY = 'hospital_token_data';

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      synthRef.current = synth;
      
      const loadVoices = () => {
        const voices = synth.getVoices();
        const preferredVoice = voices.find(
          voice => voice.lang.includes('en') && voice.name.includes('Female')
        ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
        
        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        }
      };

      // Force Chrome to load voices
      loadVoices();
      
      // Handle Chrome's async voice loading
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Add function to load saved token data
  useEffect(() => {
    const savedTokenData = localStorage.getItem(QR_CODE_STORAGE_KEY);
    if (savedTokenData) {
      try {
        const parsedData = JSON.parse(savedTokenData);
        setQrCodeData(parsedData);
        setTokenNumber(parsedData.tokenNumber);
        setSelectedDoctor(parsedData.doctorInfo.name);
        setUserInfo(parsedData.patientInfo);
        setConversationStage(CONVERSATION_STAGES.MAIN_CONVERSATION);
      } catch (error) {
        console.error('Error loading saved token data:', error);
        localStorage.removeItem(QR_CODE_STORAGE_KEY);
      }
    }
  }, []);

  const speakMessage = useCallback((text) => {
    if (!synthRef.current || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [selectedVoice]);

  const generateTokenNumber = useCallback(() => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `T${day}${month}${random}`;
  }, []);

  const generateTokenData = useCallback(() => {
    const date = new Date();
    const tokenData = {
      tokenNumber: generateTokenNumber(),
      timestamp: date.toISOString(),
      patientInfo: {
        name: userInfo.name,
        age: userInfo.age,
        gender: userInfo.gender
      },
      doctorInfo: {
        name: selectedDoctor,
        specialty: DOCTORS[selectedDoctor]
      }
    };
    
    // Save to localStorage
    localStorage.setItem(QR_CODE_STORAGE_KEY, JSON.stringify(tokenData));
    return tokenData;
  }, [generateTokenNumber, userInfo, selectedDoctor]);

  const generateResponse = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('token')) {
      return `Your token number is ${tokenNumber} for ${selectedDoctor}. Please keep this for your reference.`;
    } else if (lowerMessage.includes('doctor')) {
      return `You are scheduled to meet ${selectedDoctor} (${DOCTORS[selectedDoctor]}). Your token number is ${tokenNumber}.`;
    } else if (lowerMessage.includes('thank')) {
      return `You're welcome, ${userInfo.name}! Is there anything else I can help you with?`;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello ${userInfo.name}! How can I assist you today?`;
    } else {
      return `I understand you're asking about ${message}, ${userInfo.name}. Could you please provide more details about what you need?`;
    }
  }, [tokenNumber, selectedDoctor, userInfo.name]);

  const normalizeString = (str) => {
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  const findMatchingDoctor = (input) => {
    const normalizedInput = normalizeString(input);
    
    // Try exact match first
    const exactMatch = Object.keys(DOCTORS).find(
      name => normalizeString(name) === normalizedInput
    );
    if (exactMatch) return exactMatch;

    // Try matching by first name or last name
    const nameMatch = Object.keys(DOCTORS).find(name => {
      const [firstName, lastName] = name.split(' ').map(normalizeString);
      return firstName === normalizedInput || lastName === normalizedInput;
    });
    if (nameMatch) return nameMatch;

    // Try matching by specialty
    const specialtyMatch = Object.entries(DOCTORS).find(
      ([_, specialty]) => normalizeString(specialty).includes(normalizedInput)
    );
    if (specialtyMatch) return specialtyMatch[0];

    // Try partial match with doctor's name
    const partialNameMatch = Object.keys(DOCTORS).find(name => {
      const normalizedName = normalizeString(name);
      return normalizedName.includes(normalizedInput) || 
             normalizedInput.includes(normalizedName);
    });
    if (partialNameMatch) return partialNameMatch;

    // Try matching by specialty keywords
    const specialtyKeywords = {
      'cardio': 'Cardiology',
      'heart': 'Cardiology',
      'neuro': 'Neurology',
      'brain': 'Neurology',
      'ortho': 'Orthopedics',
      'bone': 'Orthopedics',
      'pediatric': 'Pediatrics',
      'child': 'Pediatrics',
      'derma': 'Dermatology',
      'skin': 'Dermatology',
      'general': 'General Medicine',
      'medicine': 'General Medicine'
    };

    const specialtyKeywordMatch = Object.entries(specialtyKeywords).find(
      ([keyword, _]) => normalizedInput.includes(normalizeString(keyword))
    );
    if (specialtyKeywordMatch) {
      const specialty = specialtyKeywordMatch[1];
      return Object.entries(DOCTORS).find(([_, s]) => s === specialty)?.[0];
    }

    return null;
  };

  const generateQRCodeFromConversation = useCallback(() => {
    // Find the last doctor selection and user info from messages
    let doctorInfo = null;
    let patientInfo = null;
    let lastToken = null;

    // Search messages in reverse to find the most recent relevant information
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      
      // Look for doctor selection
      if (!doctorInfo && message.sender === 'bot' && message.text.includes("I've matched you with")) {
        const match = message.text.match(/matched you with (Dr\. \w+) \(([^)]+)\)/);
        if (match) {
          doctorInfo = {
            name: match[1],
            specialty: match[2]
          };
        }
      }

      // Look for token number
      if (!lastToken && message.sender === 'bot' && message.text.includes("token number is")) {
        const match = message.text.match(/token number is (T\d+)/);
        if (match) {
          lastToken = match[1];
        }
      }

      // Look for user information
      if (!patientInfo && message.sender === 'user') {
        // Check previous bot messages for context
        if (i > 0 && messages[i-1].sender === 'bot') {
          const prevMessage = messages[i-1].text.toLowerCase();
          if (prevMessage.includes("tell me your age")) {
            patientInfo = { ...patientInfo, age: message.text };
          } else if (prevMessage.includes("know your gender")) {
            patientInfo = { ...patientInfo, gender: message.text.toLowerCase() };
          } else if (prevMessage.includes("know your name")) {
            patientInfo = { ...patientInfo, name: message.text };
          }
        }
      }

      // If we have all the information, we can stop searching
      if (doctorInfo && lastToken && patientInfo && patientInfo.name && patientInfo.age && patientInfo.gender) {
        break;
      }
    }

    // If we found all necessary information, generate QR code data
    if (doctorInfo && lastToken && patientInfo && patientInfo.name && patientInfo.age && patientInfo.gender) {
      const tokenData = {
        tokenNumber: lastToken,
        timestamp: new Date().toISOString(),
        patientInfo: patientInfo,
        doctorInfo: doctorInfo
      };
      
      // Save to localStorage
      localStorage.setItem(QR_CODE_STORAGE_KEY, JSON.stringify(tokenData));
      setQrCodeData(tokenData);
      setTokenNumber(lastToken);
      setSelectedDoctor(doctorInfo.name);
      setUserInfo(patientInfo);
      return tokenData;
    }

    return null;
  }, [messages]);

  const handleSendMessage = useCallback((message) => {
    if (!message.trim()) return;

    const userMessage = { text: message, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      let botResponse = '';
      
      switch (conversationStage) {
        case CONVERSATION_STAGES.GREETING:
          botResponse = "Welcome to our hospital! To help you better, I need some information. May I know your name, please?";
          setConversationStage(CONVERSATION_STAGES.ASK_NAME);
          break;

        case CONVERSATION_STAGES.ASK_NAME:
          if (message.length < 2) {
            botResponse = "Please enter a valid name (at least 2 characters).";
            break;
          }
          setUserInfo(prev => ({ ...prev, name: message }));
          botResponse = `Thank you, ${message}! Could you please tell me your age?`;
          setConversationStage(CONVERSATION_STAGES.ASK_AGE);
          break;

        case CONVERSATION_STAGES.ASK_AGE:
          const age = parseInt(message);
          if (isNaN(age) || age <= 0 || age > 120) {
            botResponse = "Please enter a valid age between 1 and 120.";
            break;
          }
          setUserInfo(prev => ({ ...prev, age: age.toString() }));
          botResponse = "Thank you! And may I know your gender? (Male/Female/Other)";
          setConversationStage(CONVERSATION_STAGES.ASK_GENDER);
          break;

        case CONVERSATION_STAGES.ASK_GENDER:
          const gender = message.toLowerCase();
          if (!['male', 'female', 'other'].includes(gender)) {
            botResponse = "Please enter a valid gender (Male/Female/Other).";
            break;
          }
          setUserInfo(prev => ({ ...prev, gender: gender }));
          botResponse = "Thank you for providing your information. Here are our available doctors:\n\n" +
            Object.entries(DOCTORS).map(([name, specialty]) => 
              `• ${name} (${specialty})`
            ).join('\n') + 
            "\n\nWhich doctor would you like to meet? You can refer to them by their name or specialty.";
          setConversationStage(CONVERSATION_STAGES.ASK_DOCTOR);
          break;

        case CONVERSATION_STAGES.ASK_DOCTOR:
          const doctorName = findMatchingDoctor(message);

          if (!doctorName) {
            botResponse = "I couldn't find an exact match. Here are our available doctors:\n\n" +
              Object.entries(DOCTORS).map(([name, specialty]) => 
                `• ${name} (${specialty})`
              ).join('\n') + 
              "\n\nPlease select a doctor from the list above. You can refer to them by their name (e.g., 'Dr. Sharma' or just 'Sharma') or specialty (e.g., 'Cardiology' or 'heart doctor').";
            break;
          }

          // Verify we have all required information
          if (!userInfo.name || !userInfo.age || !userInfo.gender) {
            botResponse = "I'm missing some of your information. Let's start over. May I know your name, please?";
            setConversationStage(CONVERSATION_STAGES.ASK_NAME);
            setUserInfo({ name: '', age: '', gender: '' });
            break;
          }

          setSelectedDoctor(doctorName);
          const tokenData = generateTokenData();
          setTokenNumber(tokenData.tokenNumber);
          setQrCodeData(tokenData);
          onTokenUpdate(tokenData.tokenNumber, `${doctorName} (${DOCTORS[doctorName]})`);
          
          botResponse = `Perfect! I have all the information I need:\n\n` +
            `• Name: ${userInfo.name}\n` +
            `• Age: ${userInfo.age}\n` +
            `• Gender: ${userInfo.gender}\n` +
            `• Doctor: ${doctorName} (${DOCTORS[doctorName]})\n\n` +
            `Your token number is ${tokenData.tokenNumber}.\n\n` +
            `I've generated a QR code for you. Would you like to see it now?`;
          
          setConversationStage(CONVERSATION_STAGES.MAIN_CONVERSATION);
          break;

        case CONVERSATION_STAGES.MAIN_CONVERSATION:
          const lowerMessage = message.toLowerCase();
          if (lowerMessage.includes('qr') || lowerMessage.includes('code') || lowerMessage.includes('show') || 
              lowerMessage.includes('token') || lowerMessage.includes('yes') || lowerMessage.includes('sure')) {
            if (qrCodeData) {
              setShowQRCode(true);
              botResponse = "I've displayed your QR code. You can show this to the reception desk for quick check-in. You can also download it for later use.";
            } else {
              botResponse = "I don't see your token information. Would you like to start over and generate a new token?";
              setConversationStage(CONVERSATION_STAGES.GREETING);
              setUserInfo({ name: '', age: '', gender: '' });
              setQrCodeData(null);
              setTokenNumber(null);
              setSelectedDoctor(null);
            }
          } else if (lowerMessage.includes('new token') || lowerMessage.includes('generate') || lowerMessage.includes('start over')) {
            botResponse = "I'll help you generate a new token. May I know your name, please?";
            setConversationStage(CONVERSATION_STAGES.ASK_NAME);
            setUserInfo({ name: '', age: '', gender: '' });
            setQrCodeData(null);
            setTokenNumber(null);
            setSelectedDoctor(null);
            localStorage.removeItem(QR_CODE_STORAGE_KEY);
          } else {
            botResponse = generateResponse(message);
          }
          break;

        default:
          botResponse = "I'm not sure how to proceed. Let's start over. May I know your name, please?";
          setConversationStage(CONVERSATION_STAGES.ASK_NAME);
          setUserInfo({ name: '', age: '', gender: '' });
      }

      const botMessage = { text: botResponse, sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
      speakMessage(botResponse);
    }, 1000);
  }, [conversationStage, generateTokenNumber, speakMessage, generateResponse, onTokenUpdate, findMatchingDoctor, generateTokenData, qrCodeData, userInfo]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage = {
        text: "Namaste! Welcome to our hospital. I'm your virtual assistant. How may I help you today?",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      speakMessage(initialMessage.text);
    }

    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSendMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          speakMessage("I need permission to use your microphone. Please enable it in your browser settings.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [messages.length, speakMessage, handleSendMessage]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        speakMessage("I'm having trouble accessing the microphone. Please check your browser settings.");
      }
    }
  }, [isListening, speakMessage]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear the token data on unmount to persist it
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={9}>
        <Box 
          sx={{ 
            height: {
              xs: '50vh',
              sm: '55vh',
              md: '60vh'
            },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            position: 'relative',
            backgroundColor: '#E3F2FD',
            borderRadius: 2,
            p: 2,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(33, 150, 243, 0.1) 0%, transparent 60%)',
              pointerEvents: 'none',
              borderRadius: 2,
            },
          }}
        >
          <List
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              px: { xs: 1, sm: 2 },
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 2,
              '&::-webkit-scrollbar': {
                width: { xs: '4px', sm: '8px' },
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(33, 150, 243, 0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(33, 150, 243, 0.2)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(33, 150, 243, 0.3)',
                },
              },
            }}
          >
            {messages.map((message, index) => (
              <Fade in={true} key={index}>
                <ListItem
                  sx={{
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: { xs: 1.5, sm: 2 },
                    px: { xs: 0.5, sm: 1 },
                    animation: 'fadeIn 0.3s ease-out',
                    '@keyframes fadeIn': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(10px)',
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
                    },
                  }}
                >
                  {message.sender === 'bot' && (
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        mr: { xs: 0.5, sm: 1 },
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        display: { xs: 'none', sm: 'flex' },
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                      }}
                    >
                      <SmartToyIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    </Avatar>
                  )}
                  <Paper
                    elevation={2}
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      maxWidth: { xs: '85%', sm: '70%' },
                      backgroundColor: message.sender === 'user' 
                        ? 'primary.main' 
                        : 'white',
                      color: message.sender === 'user' 
                        ? 'white' 
                        : 'text.primary',
                      borderRadius: 3,
                      position: 'relative',
                      boxShadow: message.sender === 'user'
                        ? '0 4px 16px rgba(46, 125, 50, 0.2)'
                        : '0 4px 16px rgba(0, 0, 0, 0.08)',
                      border: message.sender === 'user' 
                        ? 'none'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        [message.sender === 'user' ? 'right' : 'left']: -8,
                        transform: 'translateY(-50%)',
                        borderStyle: 'solid',
                        borderWidth: '8px 8px 8px 0',
                        borderColor: message.sender === 'user'
                          ? 'transparent primary.main transparent transparent'
                          : 'transparent white transparent transparent',
                        display: message.sender === 'user' ? 'none' : 'block',
                        [theme.breakpoints.down('sm')]: {
                          display: 'none',
                        },
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        [message.sender === 'user' ? 'left' : 'right']: -8,
                        transform: 'translateY(-50%)',
                        borderStyle: 'solid',
                        borderWidth: '8px 0 8px 8px',
                        borderColor: message.sender === 'user'
                          ? 'transparent transparent transparent primary.main'
                          : 'transparent transparent transparent white',
                        display: message.sender === 'user' ? 'block' : 'none',
                        [theme.breakpoints.down('sm')]: {
                          display: 'none',
                        },
                      },
                    }}
                  >
                    <ListItemText 
                      primary={message.text}
                      primaryTypographyProps={{
                        sx: {
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-line',
                          ...(tokenNumber && message.text.includes(tokenNumber) && {
                            '& strong': {
                              color: 'primary.main',
                              fontSize: '1.1em',
                            },
                          }),
                        },
                      }}
                    />
                  </Paper>
                  {message.sender === 'user' && (
                    <Avatar
                      sx={{
                        bgcolor: 'secondary.main',
                        ml: { xs: 0.5, sm: 1 },
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        display: { xs: 'none', sm: 'flex' },
                        boxShadow: '0 4px 12px rgba(255, 143, 0, 0.2)',
                      }}
                    >
                      <PersonIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    </Avatar>
                  )}
                </ListItem>
              </Fade>
            ))}
            <div ref={messagesEndRef} />
          </List>

          <Paper
            elevation={4}
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderTop: '1px solid',
              borderColor: 'rgba(33, 150, 243, 0.1)',
              borderRadius: '16px 16px 0 0',
              boxShadow: '0 -4px 20px rgba(33, 150, 243, 0.08)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(33, 150, 243, 0.2), transparent)',
              },
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                gap: { xs: 1, sm: 1.5 }, 
                alignItems: 'center',
                flexWrap: 'nowrap',
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder={isListening ? "Listening..." : "Type your message or click the microphone..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage(input);
                  }
                }}
                disabled={isListening}
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'rgba(33, 150, 243, 0.02)',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.04)',
                      '& > fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      '& > fieldset': {
                        borderWidth: 2,
                        borderColor: 'primary.main',
                      },
                    },
                  },
                }}
              />
              <IconButton
                color={isListening ? 'error' : 'primary'}
                onClick={toggleListening}
                disabled={!('webkitSpeechRecognition' in window)}
                size={isMobile ? "small" : "medium"}
                sx={{
                  transition: 'all 0.2s',
                  minWidth: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  backgroundColor: isListening ? 'error.light' : 'primary.main',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  '&:hover': {
                    backgroundColor: isListening ? 'error.main' : 'primary.dark',
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 16px rgba(46, 125, 50, 0.3)',
                  },
                  animation: isListening ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? (
                  <CircularProgress size={isMobile ? 20 : 24} color="inherit" />
                ) : (
                  <MicIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                )}
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isListening}
                size={isMobile ? "small" : "medium"}
                sx={{
                  transition: 'all 0.2s',
                  minWidth: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  backgroundColor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 16px rgba(46, 125, 50, 0.3)',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'grey.200',
                    color: 'grey.400',
                    boxShadow: 'none',
                  },
                }}
              >
                <SendIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              </IconButton>
              {isSpeaking && (
                <IconButton 
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  onClick={() => {
                    if (synthRef.current) {
                      synthRef.current.cancel();
                      setIsSpeaking(false);
                    }
                  }}
                  sx={{
                    minWidth: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    backgroundColor: 'primary.main',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' },
                      '100%': { transform: 'scale(1)' },
                    },
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                      animation: 'none',
                    },
                  }}
                  title="Stop speaking"
                >
                  <VolumeUpIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                </IconButton>
              )}
            </Box>
          </Paper>
        </Box>
      </Grid>

      <Dialog 
        open={showQRCode} 
        onClose={() => setShowQRCode(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(90deg, #1976D2 0%, #2196F3 100%)',
          color: 'white',
          py: 2
        }}>
          <Typography variant="h6" component="div" align="center">
            Patient Token QR Code
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2,
            py: 3,
            px: 2
          }}>
            {qrCodeData && (
              <>
                <QRCodeCanvas 
                  value={JSON.stringify(qrCodeData)}
                  size={256}
                  level="H"
                  includeMargin={true}
                  style={{
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Typography variant="h6" color="primary" align="center" sx={{ mt: 1 }}>
                  Token: {qrCodeData.tokenNumber}
                </Typography>
                <Typography variant="body1" align="center">
                  {qrCodeData.patientInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {qrCodeData.doctorInfo.name} ({qrCodeData.doctorInfo.specialty})
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Generated on: {new Date(qrCodeData.timestamp).toLocaleString()}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setShowQRCode(false)} 
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const link = document.createElement('a');
                link.download = `token-${qrCodeData.tokenNumber}.png`;
                link.href = canvas.toDataURL();
                link.click();
              }
            }} 
            color="primary"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Download QR Code
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Chatbot; 