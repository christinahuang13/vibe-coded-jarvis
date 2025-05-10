// src/services/emailService.js

/**
 * Fetch emails from integrated email accounts
 * @param {Object} settings - User settings
 * @returns {Promise<Array>} Promise resolving to array of emails
 */
export const fetchEmails = async (settings) => {
    // In a real implementation, this would connect to Gmail, Outlook, etc.
    // For demo purposes, we're using mock data
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getMockEmails());
      }, 300);
    });
  };
  
  /**
   * Send an email
   * @param {Object} emailDetails - Email details (to, subject, body, etc.)
   * @returns {Promise<Object>} Promise resolving to send result
   */
  export const sendEmail = async (emailDetails) => {
    // In a real implementation, this would send an email via API
    // For demo purposes, we're using a mock implementation
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Email sent successfully'
        });
      }, 300);
    });
  };
  
  /**
   * Mark an email with a specific flag (important, read, etc.)
   * @param {string} emailId - Email ID
   * @param {string} flag - Flag to set (important, read, unread, etc.)
   * @param {boolean} value - Flag value
   * @returns {Promise<Object>} Promise resolving to update result
   */
  export const markEmail = async (emailId, flag, value) => {
    // In a real implementation, this would update the email via API
    // For demo purposes, we're using a mock implementation
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Email successfully marked as ${flag}: ${value}`
        });
      }, 300);
    });
  };
  
  /**
   * Draft an email (save to drafts)
   * @param {Object} emailDetails - Email details (to, subject, body, etc.)
   * @returns {Promise<Object>} Promise resolving to draft result
   */
  export const draftEmail = async (emailDetails) => {
    // In a real implementation, this would save a draft via API
    // For demo purposes, we're using a mock implementation
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Email saved to drafts',
          draftId: 'draft-' + Date.now()
        });
      }, 300);
    });
  };
  
  // Mock data functions
  
  /**
   * Generate mock emails for demo purposes
   * @returns {Array} Array of mock emails
   */
  const getMockEmails = () => {
    const now = new Date();
    const oneHourAgo = new Date(now);
    oneHourAgo.setHours(now.getHours() - 1);
    
    const twoHoursAgo = new Date(now);
    twoHoursAgo.setHours(now.getHours() - 2);
    
    const fourHoursAgo = new Date(now);
    fourHoursAgo.setHours(now.getHours() - 4);
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    return [
      {
        id: 'email-1',
        from: {
          name: 'John Smith',
          email: 'john.smith@example.com'
        },
        to: [
          {
            name: 'Me',
            email: 'me@example.com'
          }
        ],
        subject: 'Project Status Update',
        body: 'Hi,\n\nI wanted to give you a quick update on the project status. We\'ve completed the initial phase and are ready to move to the next stage. Can we schedule a meeting to discuss the details?\n\nBest,\nJohn',
        timestamp: twoHoursAgo,
        isRead: false,
        isImportant: true,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['work', 'project'],
        source: 'work'
      },
      {
        id: 'email-2',
        from: {
          name: 'Marketing Team',
          email: 'marketing@example.com'
        },
        to: [
          {
            name: 'All Staff',
            email: 'all-staff@example.com'
          }
        ],
        subject: 'New Brand Guidelines',
        body: 'Hello Team,\n\nWe\'ve updated our brand guidelines for Q3 2024. Please review the attached document and ensure all materials follow the new guidelines starting next week.\n\nThank you,\nMarketing Team',
        timestamp: fourHoursAgo,
        isRead: true,
        isImportant: false,
        hasAttachments: true,
        attachments: [
          {
            name: 'Brand_Guidelines_Q3_2024.pdf',
            size: '2.4 MB'
          }
        ],
        folder: 'inbox',
        labels: ['work', 'announcement'],
        source: 'work'
      },
      {
        id: 'email-3',
        from: {
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com'
        },
        to: [
          {
            name: 'Me',
            email: 'me@example.com'
          }
        ],
        subject: 'Dinner plans for Saturday',
        body: 'Hey!\n\nAre we still on for dinner this Saturday? I was thinking we could try that new Italian place downtown. Let me know what time works for you.\n\nSarah',
        timestamp: oneHourAgo,
        isRead: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['personal'],
        source: 'personal'
      },
      {
        id: 'email-4',
        from: {
          name: 'Alex Wong',
          email: 'alex.w@example.com'
        },
        to: [
          {
            name: 'Me',
            email: 'me@example.com'
          },
          {
            name: 'Project Team',
            email: 'project-team@example.com'
          }
        ],
        subject: 'Meeting notes from yesterday',
        body: 'Hi everyone,\n\nAttached are the notes from yesterday\'s project meeting. Please review and let me know if I missed anything important.\n\nThanks,\nAlex',
        timestamp: yesterday,
        isRead: true,
        isImportant: true,
        hasAttachments: true,
        attachments: [
          {
            name: 'Meeting_Notes_May_9.docx',
            size: '842 KB'
          }
        ],
        folder: 'inbox',
        labels: ['work', 'project'],
        source: 'work'
      },
      {
        id: 'email-5',
        from: {
          name: 'LinkedIn',
          email: 'notifications@linkedin.com'
        },
        to: [
          {
            name: 'Me',
            email: 'me@example.com'
          }
        ],
        subject: 'You have 5 new connection requests',
        body: 'You have 5 new connection requests waiting for your response on LinkedIn.',
        timestamp: yesterday,
        isRead: true,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['social'],
        source: 'personal'
      },
      {
        id: 'email-6',
        from: {
          name: 'Client Support',
          email: 'support@client.com'
        },
        to: [
          {
            name: 'Me',
            email: 'me@example.com'
          }
        ],
        subject: 'Urgent: System Outage Report',
        body: 'Dear Support Team,\n\nWe\'re experiencing a system outage that is affecting our operations. Can you please look into this urgently?\n\nBest regards,\nClient Support Team',
        timestamp: now,
        isRead: false,
        isImportant: true,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['work', 'urgent'],
        source: 'work'
      },
      {
        id: 'email-7',
        from: {
          name: 'Amazon',
          email: 'orders@amazon.com'
        },
        to: [
          {
            name: 'Me',
            email: 'me@example.com'
          }
        ],
        subject: 'Your Amazon Order Has Shipped',
        body: 'Your recent order #102-3956284-1236734 has shipped and is on its way to you. Expected delivery: Thursday, May 12.',
        timestamp: twoHoursAgo,
        isRead: true,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['shopping'],
        source: 'personal'
      }
    ];
  };