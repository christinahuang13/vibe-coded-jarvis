// server/index.js
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// Global variables for API clients
let oauth2Client;
let calendar;
let gmail;

// Test environment data
const testData = {
  calendar: {
    events: [],
  },
  emails: []
};

// Initialize test data with dummy content
const initializeTestData = () => {
  // Generate dummy calendar events
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  testData.calendar.events = [
    {
      id: 'event-1',
      summary: 'Morning Team Standup',
      description: 'Daily team standup to discuss progress and blockers',
      start: {
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
      },
      end: {
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
      },
      location: 'Zoom Meeting',
      attendees: [
        { email: 'team@example.com', self: false, responseStatus: 'accepted' },
        { email: 'user@example.com', self: true, responseStatus: 'accepted' }
      ],
      organizer: { email: 'manager@example.com', displayName: 'Team Manager' },
      recurringEventId: 'recurring-1',
      status: 'confirmed'
    },
    {
      id: 'event-2',
      summary: 'Project Review with Marketing',
      description: 'Review Q2 marketing campaign results',
      start: {
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
      },
      end: {
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(),
      },
      location: 'Conference Room A',
      attendees: [
        { email: 'marketing@example.com', self: false, responseStatus: 'accepted' },
        { email: 'john@example.com', self: false, responseStatus: 'accepted' },
        { email: 'user@example.com', self: true, responseStatus: 'needsAction' }
      ],
      organizer: { email: 'marketing@example.com', displayName: 'Marketing Team' },
      status: 'confirmed'
    },
    {
      id: 'event-3',
      summary: 'Lunch with Alex',
      description: 'Catch-up lunch',
      start: {
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 30).toISOString(),
      },
      end: {
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30).toISOString(),
      },
      location: 'Cafe Deluxe',
      attendees: [
        { email: 'alex@example.com', self: false, responseStatus: 'accepted' },
        { email: 'user@example.com', self: true, responseStatus: 'accepted' }
      ],
      organizer: { email: 'user@example.com', displayName: 'Test User', self: true },
      status: 'confirmed'
    },
    {
      id: 'event-4',
      summary: 'Quarterly Business Review',
      description: 'Quarterly business review for all departments',
      start: {
        dateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0).toISOString(),
      },
      end: {
        dateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0).toISOString(),
      },
      location: 'Executive Boardroom',
      attendees: [
        { email: 'executives@example.com', self: false, responseStatus: 'accepted' },
        { email: 'managers@example.com', self: false, responseStatus: 'accepted' },
        { email: 'user@example.com', self: true, responseStatus: 'needsAction' }
      ],
      organizer: { email: 'ceo@example.com', displayName: 'CEO' },
      status: 'confirmed'
    }
  ];
  
  // Generate dummy emails
  const now = new Date();
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(now.getHours() - 1);
  
  const twoHoursAgo = new Date(now);
  twoHoursAgo.setHours(now.getHours() - 2);
  
  const fourHoursAgo = new Date(now);
  fourHoursAgo.setHours(now.getHours() - 4);
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  testData.emails = [
    {
      id: 'email-1',
      threadId: 'thread-1',
      payload: {
        headers: [
          { name: 'Subject', value: 'Project Status Update' },
          { name: 'From', value: 'John Smith <john.smith@example.com>' },
          { name: 'To', value: 'user@example.com' },
          { name: 'Date', value: twoHoursAgo.toISOString() }
        ],
        body: {
          data: Buffer.from('Hi,\n\nI wanted to give you a quick update on the project status. We\'ve completed the initial phase and are ready to move to the next stage. Can we schedule a meeting to discuss the details?\n\nBest,\nJohn').toString('base64')
        }
      },
      labelIds: ['INBOX', 'UNREAD', 'IMPORTANT'],
      snippet: 'I wanted to give you a quick update on the project status.'
    },
    {
      id: 'email-2',
      threadId: 'thread-2',
      payload: {
        headers: [
          { name: 'Subject', value: 'New Brand Guidelines' },
          { name: 'From', value: 'Marketing Team <marketing@example.com>' },
          { name: 'To', value: 'All Staff <all-staff@example.com>' },
          { name: 'Date', value: fourHoursAgo.toISOString() }
        ],
        body: {
          data: Buffer.from('Hello Team,\n\nWe\'ve updated our brand guidelines for Q2 2025. Please review the attached document and ensure all materials follow the new guidelines starting next week.\n\nThank you,\nMarketing Team').toString('base64')
        },
        parts: [
          {
            filename: 'Brand_Guidelines_Q2_2025.pdf',
            mimeType: 'application/pdf',
            body: {
              attachmentId: 'attachment-1',
              size: '2.4 MB'
            }
          }
        ]
      },
      labelIds: ['INBOX'],
      snippet: 'We\'ve updated our brand guidelines for Q2 2025.'
    },
    {
      id: 'email-3',
      threadId: 'thread-3',
      payload: {
        headers: [
          { name: 'Subject', value: 'Dinner plans for Saturday' },
          { name: 'From', value: 'Sarah Johnson <sarah.j@example.com>' },
          { name: 'To', value: 'user@example.com' },
          { name: 'Date', value: oneHourAgo.toISOString() }
        ],
        body: {
          data: Buffer.from('Hey!\n\nAre we still on for dinner this Saturday? I was thinking we could try that new Italian place downtown. Let me know what time works for you.\n\nSarah').toString('base64')
        }
      },
      labelIds: ['INBOX', 'UNREAD'],
      snippet: 'Are we still on for dinner this Saturday?'
    },
    {
      id: 'email-4',
      threadId: 'thread-4',
      payload: {
        headers: [
          { name: 'Subject', value: 'Meeting notes from yesterday' },
          { name: 'From', value: 'Alex Wong <alex.w@example.com>' },
          { name: 'To', value: 'user@example.com, Project Team <project-team@example.com>' },
          { name: 'Date', value: yesterday.toISOString() }
        ],
        body: {
          data: Buffer.from('Hi everyone,\n\nAttached are the notes from yesterday\'s project meeting. Please review and let me know if I missed anything important.\n\nThanks,\nAlex').toString('base64')
        },
        parts: [
          {
            filename: 'Meeting_Notes_May_9.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            body: {
              attachmentId: 'attachment-2',
              size: '842 KB'
            }
          }
        ]
      },
      labelIds: ['INBOX', 'IMPORTANT'],
      snippet: 'Attached are the notes from yesterday\'s project meeting.'
    },
    {
      id: 'email-5',
      threadId: 'thread-5',
      payload: {
        headers: [
          { name: 'Subject', value: 'Urgent: System Outage Report' },
          { name: 'From', value: 'Client Support <support@client.com>' },
          { name: 'To', value: 'user@example.com' },
          { name: 'Date', value: now.toISOString() }
        ],
        body: {
          data: Buffer.from('Dear Support Team,\n\nWe\'re experiencing a system outage that is affecting our operations. Can you please look into this urgently?\n\nBest regards,\nClient Support Team').toString('base64')
        }
      },
      labelIds: ['INBOX', 'UNREAD', 'IMPORTANT'],
      snippet: 'We\'re experiencing a system outage that is affecting our operations.'
    }
  ];
};

// Initialize test data
initializeTestData();

// Setup based on environment
if (!process.env.USE_TEST_ENV) {
  // Standard setup with Google APIs
  oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Google Calendar API
  calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Google Gmail API
  gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Auth routes
  app.get('/api/auth/google/url', (req, res) => {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ url });
  });

  app.post('/api/auth/google/callback', async (req, res) => {
    const { code } = req.body;

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info
      const peopleApi = google.people({ version: 'v1', auth: oauth2Client });
      const userInfo = await peopleApi.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,photos'
      });

      res.json({ 
        success: true, 
        tokens,
        user: {
          id: userInfo.data.resourceName,
          name: userInfo.data.names?.[0]?.displayName || '',
          email: userInfo.data.emailAddresses?.[0]?.value || '',
          picture: userInfo.data.photos?.[0]?.url || ''
        }
      });
    } catch (error) {
      console.error('Error authenticating with Google:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  app.post('/api/auth/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;

    try {
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      res.json({ success: true, tokens: credentials });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  });
} else {
  // Test environment setup with mock authentication
  console.log('Running in TEST environment mode');
  
  // Mock auth routes
  app.get('/api/auth/google/url', (req, res) => {
    // In test mode, just return a dummy URL
    res.json({ 
      url: '/auth/test-callback' 
    });
  });

  app.post('/api/auth/google/callback', (req, res) => {
    // In test mode, just return dummy tokens
    res.json({ 
      success: true, 
      tokens: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expiry_date: Date.now() + 3600000, // 1 hour from now
        token_type: 'Bearer'
      },
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'user@example.com',
        picture: 'https://via.placeholder.com/100'
      }
    });
  });

  app.post('/api/auth/refresh-token', (req, res) => {
    // In test mode, just return dummy tokens
    res.json({ 
      success: true, 
      tokens: {
        access_token: 'test-access-token-' + Date.now(),
        refresh_token: 'test-refresh-token',
        expiry_date: Date.now() + 3600000, // 1 hour from now
        token_type: 'Bearer'
      }
    });
  });
}

// Calendar routes
app.get('/api/calendar/events', async (req, res) => {
  try {
    if (process.env.USE_TEST_ENV) {
      // Use test data
      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      
      const timeMax = new Date(timeMin);
      timeMax.setDate(timeMax.getDate() + 7);
      
      // Filter events in the requested time range
      const filteredEvents = testData.calendar.events.filter(event => {
        const eventStart = new Date(event.start.dateTime);
        return eventStart >= timeMin && eventStart <= timeMax;
      });
      
      // Map to the expected format
      const events = filteredEvents.map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        start: event.start.dateTime,
        end: event.end.dateTime,
        location: event.location,
        attendees: event.attendees.map(a => a.email),
        responseStatus: event.attendees.find(a => a.self)?.responseStatus || event.status,
        organizer: event.organizer.email,
        isRecurring: !!event.recurringEventId
      }));
      
      res.json({ events });
    } else {
      // Use real Google Calendar API
      const timeMin = new Date();
      timeMin.setHours(0, 0, 0, 0);
      
      const timeMax = new Date(timeMin);
      timeMax.setDate(timeMax.getDate() + 7); // Get events for the next 7 days
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location,
        attendees: event.attendees ? event.attendees.map(a => a.email) : [],
        responseStatus: event.attendees ? 
          event.attendees.find(a => a.self)?.responseStatus : 
          event.status,
        organizer: event.organizer ? event.organizer.email : null,
        isRecurring: !!event.recurringEventId
      }));

      res.json({ events });
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

app.post('/api/calendar/respond', async (req, res) => {
  const { eventId, response } = req.body;

  try {
    if (process.env.USE_TEST_ENV) {
      // Update test data
      const eventIndex = testData.calendar.events.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        return res.status(400).json({ error: 'Event not found' });
      }
      
      const event = testData.calendar.events[eventIndex];
      const selfAttendeeIndex = event.attendees.findIndex(a => a.self);
      
      if (selfAttendeeIndex === -1) {
        return res.status(400).json({ error: 'You are not an attendee of this event' });
      }
      
      // Map response to the format expected by Google Calendar
      const responseMap = {
        'accept': 'accepted',
        'decline': 'declined',
        'maybe': 'tentative'
      };
      
      // Update the response status
      testData.calendar.events[eventIndex].attendees[selfAttendeeIndex].responseStatus = responseMap[response];
      
      res.json({ success: true });
    } else {
      // Use real Google Calendar API
      // Get the event first to find the attendee
      const event = await calendar.events.get({
        calendarId: 'primary',
        eventId
      });

      // Find self in attendees
      const selfAttendee = event.data.attendees?.find(a => a.self);
      
      if (!selfAttendee) {
        return res.status(400).json({ error: 'You are not an attendee of this event' });
      }

      // Map response to the format expected by Google Calendar
      const responseMap = {
        'accept': 'accepted',
        'decline': 'declined',
        'maybe': 'tentative'
      };

      // Update the response status
      await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: {
          attendees: event.data.attendees.map(attendee => {
            if (attendee.self) {
              return { ...attendee, responseStatus: responseMap[response] };
            }
            return attendee;
          })
        }
      });

      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error responding to event:', error);
    res.status(500).json({ error: 'Failed to respond to event' });
  }
});

app.post('/api/calendar/create', async (req, res) => {
  const { title, start, end, location, description, attendees } = req.body;

  try {
    if (process.env.USE_TEST_ENV) {
      // Create new event in test data
      const newEvent = {
        id: 'event-' + Date.now(),
        summary: title,
        description,
        location,
        start: {
          dateTime: new Date(start).toISOString()
        },
        end: {
          dateTime: new Date(end).toISOString()
        },
        attendees: [
          { email: 'user@example.com', self: true, responseStatus: 'accepted' },
          ...(attendees || []).map(email => ({ 
            email, 
            self: false, 
            responseStatus: 'needsAction' 
          }))
        ],
        organizer: { 
          email: 'user@example.com', 
          displayName: 'Test User',
          self: true
        },
        status: 'confirmed'
      };
      
      testData.calendar.events.push(newEvent);
      
      res.json({ 
        success: true, 
        event: {
          id: newEvent.id,
          summary: newEvent.summary,
          description: newEvent.description,
          location: newEvent.location,
          start: { dateTime: newEvent.start.dateTime },
          end: { dateTime: newEvent.end.dateTime },
          attendees: newEvent.attendees
        }
      });
    } else {
      // Use real Google Calendar API
      const event = {
        summary: title,
        location,
        description,
        start: {
          dateTime: new Date(start).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(end).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: attendees ? attendees.map(email => ({ email })) : []
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all'
      });

      res.json({ success: true, event: response.data });
    }
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.get('/api/calendar/find-time', async (req, res) => {
  const { attendees, duration } = req.query;
  const durationMinutes = parseInt(duration) || 60;

  try {
    if (process.env.USE_TEST_ENV) {
      // Generate mock free times
      const startTime = new Date();
      const endTime = new Date(startTime);
      endTime.setDate(endTime.getDate() + 7);
      
      // Create mock free times for the next week
      const freeTimes = [];
      const currentDate = new Date(startTime);
      
      // Skip to next business day and hour if needed
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        // Skip to Monday if it's weekend
        currentDate.setDate(currentDate.getDate() + (currentDate.getDay() === 0 ? 1 : 2));
        currentDate.setHours(9, 0, 0, 0);
      } else if (currentDate.getHours() < 9) {
        // Set to 9 AM if before business hours
        currentDate.setHours(9, 0, 0, 0);
      } else if (currentDate.getHours() >= 17) {
        // Move to next day at 9 AM if after business hours
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
      }
      
      // Generate 5 time slots
      for (let i = 0; i < 5 && currentDate < endTime; i++) {
        // Make sure we're not on a weekend
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          // Skip to Monday
          currentDate.setDate(currentDate.getDate() + (currentDate.getDay() === 0 ? 1 : 2));
          currentDate.setHours(9, 0, 0, 0);
        }
        
        // Make sure we're within business hours
        if (currentDate.getHours() >= 17) {
          // Move to next day at 9 AM
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(9, 0, 0, 0);
          // Skip weekends
          if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + (currentDate.getDay() === 0 ? 1 : 2));
          }
        }
        
        const slotStart = new Date(currentDate);
        const slotEnd = new Date(currentDate);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
        
        freeTimes.push({
          start: slotStart,
          end: slotEnd
        });
        
        // Move pointer to next slot (2 hours later)
        currentDate.setHours(currentDate.getHours() + 2);
      }
      
      res.json({ availableSlots: freeTimes });
    } else {
      // Use real Google Calendar API
      const startTime = new Date();
      const endTime = new Date(startTime);
      endTime.setDate(endTime.getDate() + 7); // Look ahead 7 days

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: [
            { id: 'primary' },
            ...attendees.split(',').map(email => ({ id: email.trim() }))
          ]
        }
      });

      // Process busy times
      const busyTimes = [];
      for (const [email, busy] of Object.entries(response.data.calendars)) {
        busy.busy.forEach(time => {
          busyTimes.push({
            start: new Date(time.start),
            end: new Date(time.end)
          });
        });
      }

      // Find free times (simplified algorithm)
      const freeTimes = [];
      const currentTime = new Date(startTime);
      
      // Move to next business hour if outside working hours
      if (currentTime.getHours() < 9) {
        currentTime.setHours(9, 0, 0, 0);
      } else if (currentTime.getHours() >= 17) {
        currentTime.setDate(currentTime.getDate() + 1);
        currentTime.setHours(9, 0, 0, 0);
      }
      
      while (currentTime < endTime) {
        const potentialEndTime = new Date(currentTime);
        potentialEndTime.setMinutes(potentialEndTime.getMinutes() + durationMinutes);
        
        // Skip if outside business hours (9 AM - 5 PM)
        if (currentTime.getHours() < 9 || currentTime.getHours() >= 17) {
          currentTime.setMinutes(currentTime.getMinutes() + 15);
          continue;
        }
        
        // Skip weekends
        if (currentTime.getDay() === 0 || currentTime.getDay() === 6) {
          currentTime.setDate(currentTime.getDate() + 1);
          currentTime.setHours(9, 0, 0, 0);
          continue;
        }
        
        // Check if this time slot conflicts with any busy times
        const isConflict = busyTimes.some(busy => 
          (currentTime < busy.end && potentialEndTime > busy.start)
        );
        
        if (!isConflict) {
          freeTimes.push({
            start: new Date(currentTime),
            end: new Date(potentialEndTime)
          });
          
          // If we have found enough slots, stop
          if (freeTimes.length >= 5) break;
        }
        
        // Move to next time slot (15-minute increments)
        currentTime.setMinutes(currentTime.getMinutes() + 15);
      }

      res.json({ availableSlots: freeTimes });
    }
  } catch (error) {
    console.error('Error finding available time:', error);
    res.status(500).json({ error: 'Failed to find available time' });
  }
});

// Email routes
app.get('/api/emails', async (req, res) => {
  try {
    // Get emails from Gmail (simplified implementation)
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      q: 'in:inbox',
    });

    const emails = [];
    const messages = response.data.messages || [];

    // Fetch details for each message
    for (const message of messages) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
      });

      const { payload, labelIds } = details.data;
      
      // Process headers
      const headers = payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const to = headers.find(h => h.name === 'To')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      // Process from field to extract name and email
      const fromMatch = from.match(/(.+) <(.+)>/) || [null, from, from];
      const fromName = fromMatch[1] || from;
      const fromEmail = fromMatch[2] || '';
      
      // Process body (simplified)
      let body = '';
      
      if (payload.body.data) {
        // Base64 decode
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } else if (payload.parts) {
        // Handle multipart messages (simplified)
        const textPart = payload.parts.find(part => 
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        
        if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }
      
      // Check if message has attachments
      const hasAttachments = payload.parts ? 
        payload.parts.some(part => part.filename && part.filename.length > 0) : 
        false;
      
      // Process attachments (simplified)
      const attachments = [];
      if (hasAttachments && payload.parts) {
        payload.parts.forEach(part => {
          if (part.filename && part.filename.length > 0) {
            attachments.push({
              id: part.body.attachmentId,
              name: part.filename,
              mimeType: part.mimeType,
              size: part.body.size
            });
          }
        });
      }
      
      emails.push({
        id: message.id,
        threadId: details.data.threadId,
        from: {
          name: fromName,
          email: fromEmail
        },
        to: to,
        subject,
        body,
        timestamp: new Date(date),
        isRead: !labelIds.includes('UNREAD'),
        isImportant: labelIds.includes('IMPORTANT'),
        hasAttachments,
        attachments,
        labels: labelIds,
        snippet: details.data.snippet
      });
    }

    res.json({ emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

app.post('/api/emails/send', async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    // Create message in RFC 2822 format
    const message = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ].join('\r\n');

    // Base64 encode the message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the message
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/emails/mark', async (req, res) => {
  const { messageId, addLabels, removeLabels } = req.body;

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels || [],
        removeLabelIds: removeLabels || []
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking email:', error);
    res.status(500).json({ error: 'Failed to mark email' });
  }
});

app.post('/api/emails/draft', async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    // Create message in RFC 2822 format
    const message = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ].join('\r\n');

    // Base64 encode the message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Create draft
    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage
        }
      }
    });

    res.json({ success: true, draftId: response.data.id });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ error: 'Failed to create draft' });
  }
});

// Fallback route for SPA
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ].join('\r\n');

    // Base64 encode the message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the message
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/emails/mark', async (req, res) => {
  const { messageId, addLabels, removeLabels } = req.body;

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels || [],
        removeLabelIds: removeLabels || []
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking email:', error);
    res.status(500).json({ error: 'Failed to mark email' });
  }
});

app.post('/api/emails/draft', async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    // Create message in RFC 2822 format
    const message = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '']
    }
}