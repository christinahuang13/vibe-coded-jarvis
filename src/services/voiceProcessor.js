// src/services/voiceProcessor.js
import { fetchCalendarEvents } from './calendarService';
import { fetchEmails } from './emailService';
import { summarizeWithAI } from './aiService';

const COMMAND_TYPES = {
  READ_EMAILS: 'READ_EMAILS',
  READ_AGENDA: 'READ_AGENDA',
  IGNORE: 'IGNORE',
  RESPOND: 'RESPOND',
  RESPOND_LATER: 'RESPOND_LATER',
  SET_IMPORTANT: 'SET_IMPORTANT',
  CALENDAR_RESPONSE: 'CALENDAR_RESPONSE',
  SCHEDULE: 'SCHEDULE',
  REPRIORITIZE: 'REPRIORITIZE',
  UNKNOWN: 'UNKNOWN'
};

const parseCommand = (command) => {
  command = command.toLowerCase().trim();
  
  // Parse command type
  if (command.includes('read me my emails') || command.includes('read my emails')) {
    return { type: COMMAND_TYPES.READ_EMAILS };
  } else if (command.includes('tell me what i have to do today') || 
             command.includes('what do i have to do today') || 
             command.includes('read my agenda') || 
             command.includes('read my calendar')) {
    return { type: COMMAND_TYPES.READ_AGENDA };
  } else if (command.includes('ignore')) {
    return { type: COMMAND_TYPES.IGNORE };
  } else if (command.includes('respond') && !command.includes('respond later')) {
    // Extract message for response
    const responseMatch = command.match(/respond:?\s*(.*)/i);
    const message = responseMatch ? responseMatch[1] : '';
    return { 
      type: COMMAND_TYPES.RESPOND, 
      payload: { message }
    };
  } else if (command.includes('respond later')) {
    // Extract time if specified
    const timeMatch = command.match(/later\s+at\s+(\d+(?::\d+)?(?:\s*[ap]m)?)/i);
    const time = timeMatch ? timeMatch[1] : null;
    return { 
      type: COMMAND_TYPES.RESPOND_LATER, 
      payload: { time }
    };
  } else if (command.includes('mark') && 
            (command.includes('important') || command.includes('not important'))) {
    const isImportant = !command.includes('not important');
    return { 
      type: COMMAND_TYPES.SET_IMPORTANT, 
      payload: { isImportant }
    };
  } else if (command.includes('accept') || 
             command.includes('decline') || 
             command.includes('maybe') || 
             command.includes('find me a new time')) {
    let response = 'accept';
    if (command.includes('decline')) response = 'decline';
    if (command.includes('maybe')) response = 'maybe';
    if (command.includes('find me a new time')) response = 'reschedule';
    
    return { 
      type: COMMAND_TYPES.CALENDAR_RESPONSE, 
      payload: { response }
    };
  } else if (command.includes('schedule')) {
    // Extract scheduling details (placeholder - would be more complex in real implementation)
    const whatMatch = command.match(/schedule\s+(.*?)(?=\s+(?:at|on|with|tomorrow|today|in|for))/i);
    const what = whatMatch ? whatMatch[1] : '';
    
    const whenMatch = command.match(/(?:at|on)\s+(.*?)(?=\s+(?:with|at|in|for)|$)/i);
    const when = whenMatch ? whenMatch[1] : '';
    
    const withWhomMatch = command.match(/with\s+(.*?)(?=\s+(?:at|in|for)|$)/i);
    const withWhom = withWhomMatch ? withWhomMatch[1] : '';
    
    const whereMatch = command.match(/(?:at|in)\s+(.*?)(?=\s+for|$)/i);
    const where = whereMatch ? whereMatch[1] : '';
    
    return { 
      type: COMMAND_TYPES.SCHEDULE, 
      payload: { what, when, withWhom, where }
    };
  } else if (command.includes('reprioritize')) {
    // Extract ID to reprioritize
    const idMatch = command.match(/reprioritize\s+(.*)/i);
    const id = idMatch ? idMatch[1] : '';
    
    return { 
      type: COMMAND_TYPES.REPRIORITIZE, 
      payload: { id }
    };
  } else {
    return { type: COMMAND_TYPES.UNKNOWN };
  }
};

export const processCommand = async (command, settings) => {
  const parsedCommand = parseCommand(command);
  
  switch (parsedCommand.type) {
    case COMMAND_TYPES.READ_EMAILS:
      return await handleReadEmails(settings);
    
    case COMMAND_TYPES.READ_AGENDA:
      return await handleReadAgenda(settings);
    
    case COMMAND_TYPES.IGNORE:
      return { message: "I'll ignore that item." };
    
    case COMMAND_TYPES.RESPOND:
      return await handleRespond(parsedCommand.payload, settings);
    
    case COMMAND_TYPES.RESPOND_LATER:
      return await handleRespondLater(parsedCommand.payload, settings);
    
    case COMMAND_TYPES.SET_IMPORTANT:
      return await handleSetImportant(parsedCommand.payload, settings);
    
    case COMMAND_TYPES.CALENDAR_RESPONSE:
      return await handleCalendarResponse(parsedCommand.payload, settings);
    
    case COMMAND_TYPES.SCHEDULE:
      return await handleSchedule(parsedCommand.payload, settings);
    
    case COMMAND_TYPES.REPRIORITIZE:
      return await handleReprioritize(parsedCommand.payload, settings);
    
    default:
      return { 
        message: "I'm sorry, I didn't understand that command. Please try again."
      };
  }
};

const handleReadEmails = async (settings) => {
  try {
    // Fetch emails
    const emails = await fetchEmails(settings);
    
    // Get AI summary based on settings
    const summary = await summarizeWithAI({
      type: 'emails',
      data: emails,
      settings
    });
    
    return { message: summary };
  } catch (error) {
    console.error('Error reading emails:', error);
    return { 
      message: "I'm sorry, I couldn't read your emails at this time. Please try again later."
    };
  }
};

const handleReadAgenda = async (settings) => {
  try {
    // Fetch calendar events
    const events = await fetchCalendarEvents(settings);
    
    // Get AI summary based on settings
    const summary = await summarizeWithAI({
      type: 'calendar',
      data: events,
      settings
    });
    
    return { message: summary };
  } catch (error) {
    console.error('Error reading agenda:', error);
    return { 
      message: "I'm sorry, I couldn't read your agenda at this time. Please try again later."
    };
  }
};

const handleRespond = async (payload, settings) => {
  // This would interact with email or calendar APIs to send responses
  // Simplified implementation for demo purposes
  return { 
    message: `I've drafted your response: "${payload.message}". Would you like me to send it now?`
  };
};

const handleRespondLater = async (payload, settings) => {
  const time = payload.time || `in ${settings.reminderDefaultTime} minutes`;
  
  return { 
    message: `I'll remind you to respond to this ${time}.`
  };
};

const handleSetImportant = async (payload, settings) => {
  const status = payload.isImportant ? 'important' : 'not important';
  
  return { 
    message: `I've marked this as ${status}.`
  };
};

const handleCalendarResponse = async (payload, settings) => {
  const responseMap = {
    'accept': "I've accepted the meeting invitation.",
    'decline': "I've declined the meeting invitation.",
    'maybe': "I've tentatively accepted the meeting invitation.",
    'reschedule': "I'll look for alternative times for this meeting."
  };
  
  return { 
    message: responseMap[payload.response] || "I've processed your calendar response."
  };
};

const handleSchedule = async (payload, settings) => {
  const { what, when, withWhom, where } = payload;
  
  // This would interact with calendar APIs to schedule events
  // Simplified implementation for demo purposes
  let message = `I'm scheduling `;
  
  if (what) message += `"${what}" `;
  if (when) message += `for ${when} `;
  if (withWhom) message += `with ${withWhom} `;
  if (where) message += `at ${where} `;
  
  message += `. Is that correct?`;
  
  return { message };
};

const handleReprioritize = async (payload, settings) => {
  return { 
    message: `I've reprioritized item ${payload.id}.`
  };
};