// src/components/SettingsPanel.js
import React, { useState } from 'react';
import { 
  Box, Typography, Slider, Select, MenuItem, FormControl,
  InputLabel, TextField, Button, Chip, FormControlLabel, Switch,
  List, ListItem, ListItemText, Divider
} from '@mui/material';

const SettingsPanel = ({ settings, onSettingsChange }) => {
  const [newContact, setNewContact] = useState('');
  const [newCalendar, setNewCalendar] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  const handleChange = (name, value) => {
    onSettingsChange({ ...settings, [name]: value });
  };
  
  const addPriorityContact = () => {
    if (newContact && !settings.priorityContacts.includes(newContact)) {
      handleChange('priorityContacts', [...settings.priorityContacts, newContact]);
      setNewContact('');
    }
  };
  
  const removePriorityContact = (contact) => {
    handleChange('priorityContacts', settings.priorityContacts.filter(c => c !== contact));
  };
  
  const addIntegratedCalendar = () => {
    if (newCalendar && !settings.integratedCalendars.includes(newCalendar)) {
      handleChange('integratedCalendars', [...settings.integratedCalendars, newCalendar]);
      setNewCalendar('');
    }
  };
  
  const removeIntegratedCalendar = (calendar) => {
    handleChange('integratedCalendars', settings.integratedCalendars.filter(c => c !== calendar));
  };
  
  const addIntegratedEmail = () => {
    if (newEmail && !settings.integratedEmails.includes(newEmail)) {
      handleChange('integratedEmails', [...settings.integratedEmails, newEmail]);
      setNewEmail('');
    }
  };
  
  const removeIntegratedEmail = (email) => {
    handleChange('integratedEmails', settings.integratedEmails.filter(e => e !== email));
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Assistant Settings
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Summary Length
        </Typography>
        <FormControl fullWidth margin="dense">
          <InputLabel>Detail Level</InputLabel>
          <Select
            value={settings.summaryLength}
            label="Detail Level"
            onChange={(e) => handleChange('summaryLength', e.target.value)}
          >
            <MenuItem value="concise">Concise</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="detailed">Detailed</MenuItem>
            <MenuItem value="everything">Everything</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Speech Rate: {settings.speechRate}x
        </Typography>
        <Slider
          value={settings.speechRate}
          min={0.5}
          max={2}
          step={0.1}
          onChange={(_, value) => handleChange('speechRate', value)}
          valueLabelDisplay="auto"
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Voice Type
        </Typography>
        <FormControl fullWidth margin="dense">
          <InputLabel>Voice</InputLabel>
          <Select
            value={settings.voiceType}
            label="Voice"
            onChange={(e) => handleChange('voiceType', e.target.value)}
          >
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="british">British</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Max Summary Chunk Time (seconds)
        </Typography>
        <Slider
          value={settings.maxChunkTime}
          min={30}
          max={300}
          step={15}
          onChange={(_, value) => handleChange('maxChunkTime', value)}
          valueLabelDisplay="auto"
        />
        <Typography variant="body2" color="text.secondary">
          {settings.maxChunkTime} seconds
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Default Reminder Time (minutes before event)
        </Typography>
        <Slider
          value={settings.reminderDefaultTime}
          min={5}
          max={120}
          step={5}
          onChange={(_, value) => handleChange('reminderDefaultTime', value)}
          valueLabelDisplay="auto"
        />
        <Typography variant="body2" color="text.secondary">
          {settings.reminderDefaultTime} minutes
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Priority Contacts
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            label="Add contact email"
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            sx={{ flexGrow: 1, mr: 1 }}
          />
          <Button 
            variant="outlined" 
            size="small" 
            onClick={addPriorityContact}
          >
            Add
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {settings.priorityContacts.map((contact) => (
            <Chip 
              key={contact} 
              label={contact} 
              onDelete={() => removePriorityContact(contact)} 
            />
          ))}
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Integrated Calendars
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            label="Add calendar"
            value={newCalendar}
            onChange={(e) => setNewCalendar(e.target.value)}
            sx={{ flexGrow: 1, mr: 1 }}
          />
          <Button 
            variant="outlined" 
            size="small" 
            onClick={addIntegratedCalendar}
          >
            Add
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {settings.integratedCalendars.map((calendar) => (
            <Chip 
              key={calendar} 
              label={calendar} 
              onDelete={() => removeIntegratedCalendar(calendar)} 
            />
          ))}
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Integrated Email Accounts
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            label="Add email account"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            sx={{ flexGrow: 1, mr: 1 }}
          />
          <Button 
            variant="outlined" 
            size="small" 
            onClick={addIntegratedEmail}
          >
            Add
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {settings.integratedEmails.map((email) => (
            <Chip 
              key={email} 
              label={email} 
              onDelete={() => removeIntegratedEmail(email)} 
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPanel;