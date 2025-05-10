// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Box, Container, Typography, Button, CircularProgress, 
  IconButton, Paper, Divider, Switch, FormControlLabel
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SettingsIcon from '@mui/icons-material/Settings';
import './App.css';
import SettingsPanel from './components/SettingsPanel';
import { processCommand } from './services/voiceProcessor';
import { speak, stopSpeaking, setSpeechRate } from './services/speechService';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    summaryLength: 'medium',
    speechRate: 1,
    voiceType: 'default',
    maxChunkTime: 60,
    priorityContacts: [],
    integratedCalendars: [],
    integratedEmails: [],
    reminderDefaultTime: 60, // minutes
  });
  
  const recognitionRef = useRef(null);
  
  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setTranscript(transcript);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopSpeaking();
    };
  }, [isListening]);
  
  // Apply speech rate from settings
  useEffect(() => {
    setSpeechRate(settings.speechRate);
  }, [settings.speechRate]);
  
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // If we have a transcript, process the command
      if (transcript && transcript.toLowerCase().includes('hey jarvis')) {
        handleCommand(transcript);
      }
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };
  
  const handleCommand = async (command) => {
    setIsLoading(true);
    try {
      // Remove "Hey Jarvis" from the command
      const cleanCommand = command.replace(/hey jarvis/i, '').trim();
      
      // Process the command
      const result = await processCommand(cleanCommand, settings);
      setResponse(result.message);
      
      // Speak the response
      speak(result.message);
    } catch (error) {
      console.error('Error processing command:', error);
      const errorMessage = 'Sorry, I encountered an error processing your request.';
      setResponse(errorMessage);
      speak(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Jarvis
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Your voice-first personal assistant
          </Typography>
          
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              my: 3, 
              minHeight: '200px', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.8)'
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : response ? (
              <Typography variant="body1">{response}</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {isListening 
                  ? transcript || "I'm listening... Say 'Hey Jarvis' followed by your command" 
                  : "Press the microphone button and say 'Hey Jarvis'"}
              </Typography>
            )}
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <IconButton 
              color={isListening ? "error" : "primary"} 
              size="large" 
              onClick={toggleListening}
              sx={{ border: 1, p: 2 }}
            >
              {isListening ? <StopIcon fontSize="large" /> : <MicIcon fontSize="large" />}
            </IconButton>
            
            <IconButton 
              color="secondary" 
              size="large" 
              onClick={() => setShowSettings(!showSettings)}
              sx={{ border: 1, p: 2 }}
            >
              <SettingsIcon fontSize="large" />
            </IconButton>
          </Box>
          
          {showSettings && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
            </Paper>
          )}
          
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="body2" color="text.secondary">
            Example commands:
            <ul style={{ textAlign: 'left' }}>
              <li>"Hey Jarvis, tell me what I have to do today"</li>
              <li>"Hey Jarvis, read me my emails"</li>
              <li>"Hey Jarvis, schedule a meeting with Sarah tomorrow at 3pm"</li>
            </ul>
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;