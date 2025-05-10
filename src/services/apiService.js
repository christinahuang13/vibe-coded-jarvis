// src/services/apiService.js

import axios from 'axios';

/**
 * Calendar API Services
 */
export const calendarService = {
  /**
   * Get calendar events
   * @returns {Promise<Array>} Promise resolving to array of events
   */
  getEvents: async () => {
    try {
      const response = await axios.get('/api/calendar/events');
      return response.data.events;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  },

  /**
   * Respond to a calendar event (accept, decline, maybe)
   * @param {string} eventId - Event ID
   * @param {string} calendarId - Calendar ID
   * @param {string} response - Response type (accept, decline, maybe)
   * @returns {Promise<Object>} Promise resolving to response result
   */
  respondToEvent: async (eventId, calendarId, response) => {
    try {
      const result = await axios.post('/api/calendar/respond', {
        eventId,
        calendarId,
        response
      });
      return result.data;
    } catch (error) {
      console.error('Error responding to event:', error);
      throw error;
    }
  },

  /**
   * Create a new calendar event
   * @param {Object} eventDetails - Event details
   * @returns {Promise<Object>} Promise resolving to new event
   */
  createEvent: async (eventDetails) => {
    try {
      const result = await axios.post('/api/calendar/create', eventDetails);
      return result.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  /**
   * Find available time slots for a meeting
   * @param {Array} attendees - List of attendee emails
   * @param {number} duration - Meeting duration in minutes
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Promise resolving to available time slots
   */
  findAvailableTimeSlots: async (attendees, duration = 60, days = 7) => {
    try {
      const attendeesString = Array.isArray(attendees) ? attendees.join(',') : attendees;
      const result = await axios.get('/api/calendar/find-time', {
        params: {
          attendees: attendeesString,
          duration,
          days
        }
      });
      return result.data.availableSlots;
    } catch (error) {
      console.error('Error finding available time slots:', error);
      throw error;
    }
  }
};

/**
 * Email API Services
 */
export const emailService = {
  /**
   * Get emails
   * @param {number} maxResults - Maximum number of emails to fetch
   * @param {boolean} includeBody - Whether to include email body
   * @returns {Promise<Array>} Promise resolving to array of emails
   */
  getEmails: async (maxResults = 20, includeBody = true) => {
    try {
      const response = await axios.get('/api/emails', {
        params: {
          maxResults,
          includeBody
        }
      });
      return response.data.emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  },

  /**
   * Send an email
   * @param {Object} emailDetails - Email details
   * @returns {Promise<Object>} Promise resolving to send result
   */
  sendEmail: async (emailDetails) => {
    try {
      const result = await axios.post('/api/emails/send', emailDetails);
      return result.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  /**
   * Mark an email with specific labels
   * @param {string} messageId - Message ID
   * @param {Array} addLabels - Labels to add
   * @param {Array} removeLabels - Labels to remove
   * @returns {Promise<Object>} Promise resolving to mark result
   */
  markEmail: async (messageId, addLabels = [], removeLabels = []) => {
    try {
      const result = await axios.post('/api/emails/mark', {
        messageId,
        addLabels,
        removeLabels
      });
      return result.data;
    } catch (error) {
      console.error('Error marking email:', error);
      throw error;
    }
  },

  /**
   * Create an email draft
   * @param {Object} emailDetails - Email details
   * @returns {Promise<Object>} Promise resolving to draft result
   */
  createDraft: async (emailDetails) => {
    try {
      const result = await axios.post('/api/emails/draft', emailDetails);
      return result.data;
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
    }
  }
};

/**
 * AI API Services
 */
export const aiService = {
  /**
   * Generate summary using AI
   * @param {Array} data - Data to summarize (emails or calendar events)
   * @param {string} type - Type of data ('email' or 'calendar')
   * @param {Object} preferences - User preferences
   * @returns {Promise<string>} Promise resolving to summary text
   */
  generateSummary: async (data, type, preferences) => {
    try {
      const result = await axios.post('/api/ai/summarize', {
        data,
        type,
        preferences
      });
      return result.data.summary;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw error;
    }
  },

  /**
   * Parse a voice command using AI
   * @param {string} command - Voice command to parse
   * @returns {Promise<Object>} Promise resolving to parsed command
   */
  parseCommand: async (command) => {
    try {
      const result = await axios.post('/api/ai/parse-command', {
        command
      });
      return result.data;
    } catch (error) {
      console.error('Error parsing command with AI:', error);
      throw error;
    }
  }
};

/**
 * Helper function to create response promises for offline/mock mode
 * @param {*} data - Data to resolve with
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} Promise that resolves after delay
 */
const createMockResponse = (data, delay = 300) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * Create mock calendar events for testing
 * @returns {Array} Array of mock calendar events
 */
const createMockCalendarEvents = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return [
    {
      id: 'event-1',
      calendarId: 'primary',
      title: 'Morning Team Standup',
      start: new Date(today.setHours(9, 30, 0, 0)).toISOString(),
      end: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
      location: 'Zoom Meeting',
      attendees: [
        { email: 'team@example.com', name: 'Team', responseStatus: 'accepted', self: false }
      ],
      responseStatus: 'accepted',
      organizer: { email: 'manager@example.com', name: 'Manager', self: false },
      isRecurring: true,
      source: 'primary'
    },
    {
      id: 'event-2',
      calendarId: 'primary',
      title: 'Project Review with Marketing',
      start: new Date(today.setHours(11, 0, 0, 0)).toISOString(),
      end: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
      location: 'Conference Room A',
      attendees: [
        { email: 'marketing@example.com', name: 'Marketing Team', responseStatus: 'accepted', self: false },
        { email: 'john@example.com', name: 'John', responseStatus: 'accepted', self: false },
        { email: 'me@example.com', name: 'Me', responseStatus: 'needsAction', self: true }
      ],
      responseStatus: 'needsAction',
      organizer: { email: 'marketing@example.com', name: 'Marketing Team', self: false },
      isRecurring: false,
      source: 'primary'
    }
  ];
};

/**
 * Create mock emails for testing
 * @returns {Array} Array of mock emails
 */
const createMockEmails = () => {
  const now = new Date();
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(now.getHours() - 1);
  
  return [
    {
      id: 'email-1',
      threadId: 'thread-1',
      from: {
        name: 'John Smith',
        email: 'john.smith@example.com'
      },
      to: 'me@example.com',
      subject: 'Project Status Update',
      body: 'Hi,\n\nI wanted to give you a quick update on the project status. We\'ve completed the initial phase and are ready to move to the next stage.\n\nBest,\nJohn',
      timestamp: oneHourAgo.toISOString(),
      isRead: false,
      isImportant: true,
      hasAttachments: false,
      attachments: [],
      labels: ['INBOX', 'UNREAD', 'IMPORTANT'],
      snippet: 'I wanted to give you a quick update on the project status...'
    },
    {
      id: 'email-2',
      threadId: 'thread-2',
      from: {
        name: 'Marketing Team',
        email: 'marketing@example.com'
      },
      to: 'all-staff@example.com',
      subject: 'New Brand Guidelines',
      body: 'Hello Team,\n\nWe\'ve updated our brand guidelines for Q2 2025. Please review the attached document.\n\nThank you,\nMarketing Team',
      timestamp: now.toISOString(),
      isRead: true,
      isImportant: false,
      hasAttachments: true,
      attachments: [
        { id: 'att-1', name: 'Brand_Guidelines_Q2_2025.pdf', mimeType: 'application/pdf', size: '2.4 MB' }
      ],
      labels: ['INBOX'],
      snippet: 'We\'ve updated our brand guidelines for Q2 2025...'
    }
  ];
};

/**
 * Check if we're in offline/mock mode
 * @returns {boolean} True if in offline mode
 */
const isOfflineMode = () => {
  return process.env.REACT_APP_OFFLINE_MODE === 'true';
};

// If offline mode is enabled, override the service methods with mock implementations
if (isOfflineMode()) {
  console.log('Running in offline/mock mode');
  
  // Override calendar service methods
  calendarService.getEvents = () => createMockResponse(createMockCalendarEvents());
  calendarService.respondToEvent = () => createMockResponse({ success: true });
  calendarService.createEvent = (details) => createMockResponse({ 
    success: true, 
    event: { id: 'new-event-' + Date.now(), ...details } 
  });
  calendarService.findAvailableTimeSlots = () => createMockResponse([
    {
      start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(15, 0, 0, 0)).toISOString()
    },
    {
      start: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(17, 0, 0, 0)).toISOString()
    }
  ]);
  
  // Override email service methods
  emailService.getEmails = () => createMockResponse(createMockEmails());
  emailService.sendEmail = () => createMockResponse({ success: true });
  emailService.markEmail = () => createMockResponse({ success: true });
  emailService.createDraft = () => createMockResponse({ 
    success: true, 
    draftId: 'draft-' + Date.now() 
  });
  
  // Override AI service methods
  aiService.generateSummary = (data, type, preferences) => {
    if (type === 'email') {
      return createMockResponse(
        `You have ${data.length} emails in your inbox. The most important is from John Smith about "Project Status Update" which is marked as unread and important. There's also an email from the Marketing Team about "New Brand Guidelines" with an attachment.`
      );
    } else {
      return createMockResponse(
        `You have ${data.length} events on your calendar today. You have a "Morning Team Standup" at 9:30 AM on Zoom, and a "Project Review with Marketing" at 11:00 AM in Conference Room A that you haven't responded to yet.`
      );
    }
  };
  aiService.parseCommand = (command) => {
    if (command.toLowerCase().includes('read me my emails')) {
      return createMockResponse({ intent: 'READ_EMAILS' });
    } else if (command.toLowerCase().includes('tell me what i have to do today')) {
      return createMockResponse({ intent: 'READ_AGENDA' });
    } else if (command.toLowerCase().includes('schedule')) {
      return createMockResponse({ 
        intent: 'SCHEDULE',
        entities: {
          what: 'meeting',
          when: 'tomorrow at 3pm',
          withWhom: 'marketing team',
          where: 'conference room'
        }
      });
    } else {
      return createMockResponse({ intent: 'UNKNOWN' });
    }
  };
}

export default {
  calendarService,
  emailService,
  aiService
};