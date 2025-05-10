// src/services/aiService.js

/**
 * Summarize data (emails, calendar events) using AI
 * @param {Object} options - Options for summarization
 * @param {string} options.type - Type of data ('emails' or 'calendar')
 * @param {Array} options.data - Data to summarize
 * @param {Object} options.settings - User settings
 * @returns {Promise<string>} Promise resolving to summary text
 */
export const summarizeWithAI = async (options) => {
    const { type, data, settings } = options;
    
    // In a real implementation, this would call an AI API like OpenAI or Claude
    // For demo purposes, we're creating summaries with predefined templates
    
    let summary = '';
    
    if (type === 'emails') {
      summary = generateEmailSummary(data, settings);
    } else if (type === 'calendar') {
      summary = generateCalendarSummary(data, settings);
    }
    
    return Promise.resolve(summary);
  };
  
  /**
   * Prioritize a list of items (emails, events) based on importance
   * @param {Array} items - Items to prioritize
   * @param {Object} settings - User settings
   * @returns {Promise<Array>} Promise resolving to prioritized items
   */
  export const prioritizeItems = async (items, settings) => {
    // In a real implementation, this would use AI to analyze and prioritize items
    // For demo purposes, we're using simple rules
    
    // Sort items by importance and then by time (newer first)
    const prioritizedItems = [...items].sort((a, b) => {
      // First, check if this person is in priority contacts
      const aPriorityContact = a.from && settings.priorityContacts.includes(a.from.email);
      const bPriorityContact = b.from && settings.priorityContacts.includes(b.from.email);
      
      if (aPriorityContact && !bPriorityContact) return -1;
      if (!aPriorityContact && bPriorityContact) return 1;
      
      // Then, check importance flag
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      
      // If both are equal in importance, sort by time (newer first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    return Promise.resolve(prioritizedItems);
  };
  
  /**
   * Generate a summary of emails
   * @param {Array} emails - Email data
   * @param {Object} settings - User settings
   * @returns {string} Email summary
   */
  const generateEmailSummary = (emails, settings) => {
    // Count unread emails
    const unreadCount = emails.filter(email => !email.isRead).length;
    
    // Count urgent/important emails
    const importantCount = emails.filter(email => email.isImportant).length;
    
    // Generate intro
    let summary = `You have ${emails.length} emails in your inbox, ${unreadCount} unread`;
    if (importantCount > 0) {
      summary += `, with ${importantCount} marked as important`;
    }
    summary += `. Would you like to hear about them?\n\n`;
    
    // Prioritize emails if needed
    let emailsToSummarize = [...emails];
    if (settings.summaryLength !== 'everything') {
      // Sort by importance and recency
      emailsToSummarize.sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      // Limit number based on summary length
      const limits = {
        concise: 3,
        medium: 5,
        detailed: 7
      };
      
      if (settings.summaryLength !== 'everything') {
        emailsToSummarize = emailsToSummarize.slice(0, limits[settings.summaryLength]);
      }
    }
    
    // Generate email summaries
    emailsToSummarize.forEach((email, index) => {
      const timeString = formatTime(email.timestamp);
      const importanceMarker = email.isImportant ? ' (Important)' : '';
      const readStatus = email.isRead ? '' : ' (Unread)';
      const attachmentInfo = email.hasAttachments ? ' (Has attachments)' : '';
      
      summary += `${index + 1}. From ${email.from.name} at ${timeString}, subject: ${email.subject}${importanceMarker}${readStatus}${attachmentInfo}.\n`;
      
      // Add body preview based on detail level
      if (settings.summaryLength === 'detailed' || settings.summaryLength === 'everything') {
        // In detailed mode, include a preview of the email body
        const bodyPreview = email.body.length > 100 ? 
          email.body.substring(0, 100) + '...' : 
          email.body;
        
        summary += `   Preview: ${bodyPreview}\n`;
      }
      
      // Add a gap between emails
      summary += '\n';
    });
    
    // Add instructions for interaction
    summary += `You can say "ignore", "respond now", "respond later", or "mark as important" after each email.`;
    
    return summary;
  };
  
  /**
   * Generate a summary of calendar events
   * @param {Array} events - Calendar events
   * @param {Object} settings - User settings
   * @returns {string} Calendar summary
   */
  const generateCalendarSummary = (events, settings) => {
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start) - new Date(b.start)
    );
    
    // Separate events into today and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const todayEvents = sortedEvents.filter(event => 
      new Date(event.start) >= today && new Date(event.start) < tomorrow
    );
    
    const tomorrowEvents = sortedEvents.filter(event => 
      new Date(event.start) >= tomorrow && new Date(event.start) < dayAfterTomorrow
    );
    
    // Generate summary
    let summary = '';
    
    // Today's events
    if (todayEvents.length > 0) {
      summary += `You have ${todayEvents.length} event${todayEvents.length === 1 ? '' : 's'} scheduled for today.\n\n`;
      
      todayEvents.forEach((event, index) => {
        const startTime = formatTime(event.start);
        const endTime = formatTime(event.end);
        const duration = calculateDuration(event.start, event.end);
        const location = event.location ? ` at ${event.location}` : '';
        const responseStatus = event.responseStatus === 'needsAction' ? 
          " (You haven't responded to this invitation yet)" : '';
        
        summary += `${index + 1}. At ${startTime}: ${event.title}${location}, for ${duration}${responseStatus}.\n`;
        
        // Add attendees for detailed view
        if (settings.summaryLength === 'detailed' || settings.summaryLength === 'everything') {
          if (event.attendees && event.attendees.length > 0) {
            const attendeeList = event.attendees.join(', ');
            summary += `   With: ${attendeeList}\n`;
          }
          
          // Add description for detailed view
          if (event.description) {
            const descriptionPreview = event.description.length > 100 ? 
              event.description.substring(0, 100) + '...' : 
              event.description;
            
            summary += `   Details: ${descriptionPreview}\n`;
          }
        }
        
        summary += '\n';
      });
    } else {
      summary += 'You have no events scheduled for today.\n\n';
    }
    
    // Tomorrow's events
    if (settings.summaryLength !== 'concise' && tomorrowEvents.length > 0) {
      summary += `For tomorrow, you have ${tomorrowEvents.length} event${tomorrowEvents.length === 1 ? '' : 's'} scheduled.\n\n`;
      
      if (settings.summaryLength !== 'medium') {
        tomorrowEvents.forEach((event, index) => {
          const startTime = formatTime(event.start);
          const location = event.location ? ` at ${event.location}` : '';
          
          summary += `${index + 1}. At ${startTime}: ${event.title}${location}.\n`;
        });
        
        summary += '\n';
      }
    }
    
    // Check for conflicts
    const conflicts = findScheduleConflicts(sortedEvents);
    if (conflicts.length > 0) {
      summary += 'Attention: I found the following schedule conflicts:\n';
      conflicts.forEach((conflict, index) => {
        summary += `${index + 1}. "${conflict.event1.title}" and "${conflict.event2.title}" overlap at ${formatTime(conflict.overlapStart)}.\n`;
      });
      summary += '\n';
    }
    
    // Add key priorities (for all but concise)
    if (settings.summaryLength !== 'concise') {
      const highPriorityEvents = sortedEvents.filter(event => event.importance === 'high');
      
      if (highPriorityEvents.length > 0) {
        summary += 'Top priorities for today:\n';
        highPriorityEvents
          .filter(event => new Date(event.start) < tomorrow)
          .forEach((event, index) => {
            summary += `${index + 1}. ${event.title} at ${formatTime(event.start)}.\n`;
          });
        summary += '\n';
      }
    }
    
    // Add instructions for interaction
    summary += `You can say "accept", "decline", "maybe", or "find me a new time" for any meeting that needs a response.`;
    
    return summary;
  };
  
  /**
   * Find schedule conflicts between events
   * @param {Array} events - Calendar events
   * @returns {Array} Array of conflicts
   */
  const findScheduleConflicts = (events) => {
    const conflicts = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        const start1 = new Date(event1.start);
        const end1 = new Date(event1.end);
        const start2 = new Date(event2.start);
        const end2 = new Date(event2.end);
        
        // Check if events overlap
        if (start1 < end2 && start2 < end1) {
          const overlapStart = start1 > start2 ? start1 : start2;
          const overlapEnd = end1 < end2 ? end1 : end2;
          
          conflicts.push({
            event1,
            event2,
            overlapStart,
            overlapEnd,
            duration: (overlapEnd - overlapStart) / (1000 * 60) // in minutes
          });
        }
      }
    }
    
    return conflicts;
  };
  
  /**
   * Format a date object into a readable time string
   * @param {Date} date - Date object
   * @returns {string} Formatted time string
   */
  const formatTime = (date) => {
    date = new Date(date);
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12am
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${hours12}:${minutesStr}${ampm}`;
  };
  
  /**
   * Calculate duration between two dates
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {string} Duration string
   */
  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
    
    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      if (minutes === 0) {
        return `${hours} hour${hours === 1 ? '' : 's'}`;
      } else {
        return `${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'}`;
      }
    }
  };