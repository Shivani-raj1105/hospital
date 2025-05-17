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
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

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

    // Try partial match
    const partialMatch = Object.keys(DOCTORS).find(
      name => {
        const normalizedName = normalizeString(name);
        return normalizedName.includes(normalizedInput) || 
               normalizedInput.includes(normalizedName) ||
               // Check if input contains doctor's last name
               normalizedName.split(' ')[1] === normalizedInput ||
               // Check if input contains specialty
               normalizeString(DOCTORS[name]).includes(normalizedInput);
      }
    );
    if (partialMatch) return partialMatch;

    // Try matching by specialty
    const specialtyMatch = Object.entries(DOCTORS).find(
      ([_, specialty]) => normalizeString(specialty).includes(normalizedInput)
    );
    if (specialtyMatch) return specialtyMatch[0];

    return null;
  };

  const handleSendMessage = useCallback((message) => {
    if (!message.trim()) return;

    const userMessage = { text: message, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      let botResponse = '';
      
      switch (conversationStage) {
        case CONVERSATION_STAGES.GREETING:
          botResponse = "May I know your name, please?";
          setConversationStage(CONVERSATION_STAGES.ASK_NAME);
          break;

        case CONVERSATION_STAGES.ASK_NAME:
          setUserInfo(prev => ({ ...prev, name: message }));
          botResponse = `Nice to meet you, ${message}! Could you please tell me your age?`;
          setConversationStage(CONVERSATION_STAGES.ASK_AGE);
          break;

        case CONVERSATION_STAGES.ASK_AGE:
          if (isNaN(message) || parseInt(message) <= 0 || parseInt(message) > 120) {
            botResponse = "Please enter a valid age between 1 and 120.";
            break;
          }
          setUserInfo(prev => ({ ...prev, age: message }));
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
          botResponse = "Which doctor would you like to meet? Here are our available doctors:\n\n" +
            Object.entries(DOCTORS).map(([name, specialty]) => 
              `• ${name} (${specialty})`
            ).join('\n');
          setConversationStage(CONVERSATION_STAGES.ASK_DOCTOR);
          break;

        case CONVERSATION_STAGES.ASK_DOCTOR:
          const doctorName = findMatchingDoctor(message);

          if (!doctorName) {
            botResponse = "Please select a valid doctor from the list provided:\n\n" +
              Object.entries(DOCTORS).map(([name, specialty]) => 
                `• ${name} (${specialty})`
              ).join('\n');
            break;
          }

          setSelectedDoctor(doctorName);
          const newToken = generateTokenNumber();
          setTokenNumber(newToken);
          onTokenUpdate(newToken, `${doctorName} (${DOCTORS[doctorName]})`);
          botResponse = `Thank you! Your token number is ${newToken} for ${doctorName} (${DOCTORS[doctorName]}).\n\nPlease keep this token number for your reference. You can now proceed to the waiting area. How else can I help you today?`;
          setConversationStage(CONVERSATION_STAGES.MAIN_CONVERSATION);
          break;

        case CONVERSATION_STAGES.MAIN_CONVERSATION:
          botResponse = generateResponse(message);
          break;

        default:
          botResponse = "I'm not sure how to proceed. Could you please rephrase that?";
      }

      const botMessage = { text: botResponse, sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
      speakMessage(botResponse);
    }, 1000);
  }, [conversationStage, generateTokenNumber, speakMessage, generateResponse, onTokenUpdate, findMatchingDoctor]);

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
        speakMessage("I'm listening...");
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
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(33, 150, 243, 0.05) 0%, transparent 60%)',
              pointerEvents: 'none',
            },
          }}
        >
          <List
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              px: { xs: 1, sm: 2 },
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
    </Grid>
  );
};

export default Chatbot; 