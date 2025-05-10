// src/services/aiIntegration.js

/**
 * This module provides integration with AI services like OpenAI or Anthropic Claude
 * for enhanced natural language understanding and generation capabilities
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Choose AI provider: 'openai' or 'claude'
const AI_PROVIDER = process.env.REACT_APP_AI_PROVIDER || 'openai';
const API_KEY = process.env.REACT_APP_AI_API_KEY;

// Base URLs for API requests
const API_URLS = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com/v1'
};

/**
 * Make a request to AI service for enhanced understanding/generation
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - AI response
 */
const callAIService = async (options) => {
  const { prompt, maxTokens = 300, temperature = 0.7, system = '' } = options;
  
  try {
    if (AI_PROVIDER === 'openai') {
      return await callOpenAI(prompt, system, maxTokens, temperature);
    } else if (AI_PROVIDER === 'claude') {
      return await callClaude(prompt, system, maxTokens, temperature);
    } else {
      throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
    }
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw error;
  }
};

/**
 * Call OpenAI API
 */
const callOpenAI = async (prompt, system, maxTokens, temperature) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };
  
  const payload = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: system
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: maxTokens,
    temperature: temperature
  };
  
  const response = await axios.post(`${API_URLS.openai}/chat/completions`, payload, { headers });
  return {
    text: response.data.choices[0].message.content,
    raw: response.data
  };
};

/**
 * Call Claude API
 */
const callClaude = async (prompt, system, maxTokens, temperature) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'anthropic-version': '2023-06-01'
  };
  
  const payload = {
    model: 'claude-3-opus-20240229',
    max_tokens: maxTokens,
    temperature: temperature,
    system: system,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };
  
  const response = await axios.post(`${API_URLS.claude}/messages`, payload, { headers });
  return {
    text: response.data.content[0].text,
    raw: response.data
  };
};

/**
 * Generate email summary using AI
 * @param {Array} emails - Array of email objects
 * @param {Object} userPreferences - User preferences for summary style
 * @returns {Promise<string>} - Generated summary
 */
export const generateEmailSummary = async (emails, userPreferences) => {
  // Prepare data for AI processing
  const emailData = emails.map(email => ({
    id: email.id,
    from: email.from,
    subject: email.subject,
    timestamp: email.timestamp,
    isRead: email.isRead,
    isImportant: email.isImportant,
    hasAttachments: email.hasAttachments,
    snippet: email.snippet
  }));
  
  // Create system prompt with instructions
  const systemPrompt = `
    You are Jarvis, a voice-first AI assistant that helps users manage their emails and calendar.
    Summarize the provided emails based on the following style: ${userPreferences.summaryLength}.
    Use a natural, conversational tone appropriate for voice interaction.
    Group similar emails when relevant.
    Prioritize unread, important, and recent emails.
    Mention the number of emails and most important ones first.
    Keep in mind that the user will be listening, not reading.
    Use simple, clear language and keep sentence structure simple.
  `;
  
  // Create user prompt with email data and preferences
  const userPrompt = `
    Please summarize these ${emails.length} emails according to my preferences:
    - Summary style: ${userPreferences.summaryLength}
    - Priority contacts: ${userPreferences.priorityContacts.join(', ')}
    
    Emails:
    ${JSON.stringify(emailData, null, 2)}
  `;
  
  // Call AI service with appropriate parameters
  const maxTokens = {
    concise: 200,
    medium: 400,
    detailed: 800,
    everything: 1500
  }[userPreferences.summaryLength] || 400;
  
  const result = await callAIService({
    prompt: userPrompt,
    system: systemPrompt,
    maxTokens,
    temperature: 0.7
  });
  
  return result.text;
};

/**
 * Generate calendar summary using AI
 * @param {Array} events - Array of calendar events
 * @param {Object} userPreferences - User preferences for summary style
 * @returns {Promise<string>} - Generated summary
 */
export const generateCalendarSummary = async (events, userPreferences) => {
  // Prepare data for AI processing
  const eventData = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    location: event.location,
    attendees: event.attendees,
    responseStatus: event.responseStatus,
    isRecurring: event.isRecurring,
    description: event.description ? event.description.substring(0, 100) : ''
  }));
  
  // Create system prompt with instructions
  const systemPrompt = `
    You are Jarvis, a voice-first AI assistant that helps users manage their emails and calendar.
    Summarize the provided calendar events based on the following style: ${userPreferences.summaryLength}.
    Use a natural, conversational tone appropriate for voice interaction.
    Organize events chronologically.
    Highlight conflicts, unresponded invitations, and high-priority meetings.
    Connect related events when relevant.
    Keep in mind that the user will be listening, not reading.
    Use simple, clear language and keep sentence structure simple.
  `;
  
  // Create user prompt with calendar data and preferences
  const userPrompt = `
    Please summarize my calendar events according to my preferences:
    - Summary style: ${userPreferences.summaryLength}
    - Priority contacts: ${userPreferences.priorityContacts.join(', ')}
    
    Events:
    ${JSON.stringify(eventData, null, 2)}
    
    Current time: ${new Date().toISOString()}
  `;
  
  // Call AI service with appropriate parameters
  const maxTokens = {
    concise: 200,
    medium: 400,
    detailed: 800,
    everything: 1500
  }[userPreferences.summaryLength] || 400;
  
  const result = await callAIService({
    prompt: userPrompt,
    system: systemPrompt,
    maxTokens,
    temperature: 0.7
  });
  
  return result.text;
};

/**
 * Parse natural language commands using AI
 * @param {string} command - User's voice command
 * @returns {Promise<Object>} - Parsed command structure
 */
export const parseVoiceCommand = async (command) => {
  const systemPrompt = `
    You are Jarvis, a voice-first AI assistant that helps users manage their emails and calendar.
    Parse the user's voice command and extract the intent and entities.
    Return a JSON object with the following structure:
    {
      "intent": "command_type",
      "entities": {
        "key1": "value1",
        "key2": "value2"
      }
    }
    
    Command types include:
    - READ_EMAILS
    - READ_AGENDA
    - IGNORE
    - RESPOND (with message text)
    - RESPOND_LATER (with optional time)
    - SET_IMPORTANT (with boolean value)
    - CALENDAR_RESPONSE (accept/decline/maybe/reschedule)
    - SCHEDULE (with event details)
    - REPRIORITIZE (with item id)
    
    Entity keys depend on the command type.
  `;
  
  const result = await callAIService({
    prompt: command,
    system: systemPrompt,
    maxTokens: 300,
    temperature: 0.3
  });
  
  try {
    // Parse the JSON response
    const jsonMatch = result.text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // Fallback if no JSON found
      return { intent: 'UNKNOWN' };
    }
  } catch (error) {
    console.error('Error parsing AI response as JSON:', error);
    return { intent: 'UNKNOWN' };
  }
};

/**
 * Prioritize items (emails or events) using AI
 * @param {Array} items - Items to prioritize
 * @param {Object} userPreferences - User preferences
 * @returns {Promise<Array>} - Prioritized items
 */
export const prioritizeItems = async (items, userPreferences) => {
  const systemPrompt = `
    You are Jarvis, a voice-first AI assistant that helps users manage their emails and calendar.
    Analyze the provided items and return them in priority order.
    Consider importance flags, sender/participant priority, timestamps, and content.
    Return a JSON array of item IDs in priority order.
  `;
  
  const userPrompt = `
    Please prioritize these items according to my preferences:
    - Priority contacts: ${userPreferences.priorityContacts.join(', ')}
    
    Items:
    ${JSON.stringify(items, null, 2)}
  `;
  
  const result = await callAIService({
    prompt: userPrompt,
    system: systemPrompt,
    maxTokens: 500,
    temperature: 0.3
  });
  
  try {
    // Parse the JSON response
    const jsonMatch = result.text.match(/\[.*\]/s);
    if (jsonMatch) {
      const priorityIds = JSON.parse(jsonMatch[0]);
      // Map IDs back to items in priority order
      return priorityIds.map(id => items.find(item => item.id === id)).filter(Boolean);
    } else {
      // Fallback to simple priority algorithm if AI parsing fails
      return items.sort((a, b) => {
        // Prioritize unread/important
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        
        // Check if from priority contact
        const aFromPriority = a.from && userPreferences.priorityContacts.includes(a.from.email);
        const bFromPriority = b.from && userPreferences.priorityContacts.includes(b.from.email);
        if (aFromPriority && !bFromPriority) return -1;
        if (!aFromPriority && bFromPriority) return 1;
        
        // Recency
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    }
  } catch (error) {
    console.error('Error parsing AI prioritization response:', error);
    return items; // Return original order if parsing fails
  }
};

/**
 * Draft email response using AI
 * @param {Object} emailContext - Context from original email
 * @param {string} userRequest - User's verbal response request
 * @returns {Promise<string>} - Generated email draft
 */
export const draftEmailResponse = async (emailContext, userRequest) => {
  const systemPrompt = `
    You are Jarvis, a voice-first AI assistant that helps users manage their emails and calendar.
    Draft an email response based on the user's verbal request.
    Maintain a professional tone while matching the user's intended style.
    Keep responses concise and to the point.
    Include appropriate greeting and closing.
  `;
  
  const userPrompt = `
    Original email:
    From: ${emailContext.from.name} <${emailContext.from.email}>
    Subject: ${emailContext.subject}
    Message: ${emailContext.body.substring(0, 500)}${emailContext.body.length > 500 ? '...' : ''}
    
    My verbal response request: "${userRequest}"
    
    Please draft an appropriate email response.
  `;
  
  const result = await callAIService({
    prompt: userPrompt,
    system: systemPrompt,
    maxTokens: 800,
    temperature: 0.7
  });
  
  return result.text;
};

export default {
  generateEmailSummary,
  generateCalendarSummary,
  parseVoiceCommand,
  prioritizeItems,
  draftEmailResponse
};