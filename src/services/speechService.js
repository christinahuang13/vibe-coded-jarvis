// src/services/speechService.js

// Default speech settings
let speechRate = 1;
let speechVoice = null;

// Initialize speech synthesis
const initSpeechSynthesis = () => {
  if ('speechSynthesis' in window) {
    // Get available voices
    const getVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Set a default voice
        speechVoice = voices.find(voice => voice.lang === 'en-US');
      }
      return voices;
    };

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = getVoices;
    }
    
    getVoices();
  } else {
    console.error('Speech synthesis is not supported in this browser.');
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  initSpeechSynthesis();
}

/**
 * Split text into smaller chunks for better speech synthesis
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length of each chunk
 * @returns {Array} Array of text chunks
 */
const splitTextIntoChunks = (text, maxLength = 200) => {
  // If text is short enough, return as a single chunk
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks = [];
  let currentChunk = '';
  
  // Split by sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    // If the sentence is too long, split by commas
    if (sentence.length > maxLength) {
      const clauseChunks = sentence.split(/(?<=,)\s+/);
      
      for (const clause of clauseChunks) {
        if (currentChunk.length + clause.length <= maxLength) {
          currentChunk += (currentChunk ? ' ' : '') + clause;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
          }
          
          // If a single clause is longer than maxLength, force-split it
          if (clause.length > maxLength) {
            let remainingClause = clause;
            while (remainingClause.length > 0) {
              const chunkSize = Math.min(remainingClause.length, maxLength);
              chunks.push(remainingClause.slice(0, chunkSize));
              remainingClause = remainingClause.slice(chunkSize);
            }
            currentChunk = '';
          } else {
            currentChunk = clause;
          }
        }
      }
    } else if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  
  // Add the final chunk if there is one
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

/**
 * Speak text using speech synthesis
 * @param {string} text - Text to speak
 * @param {Function} onEnd - Optional callback when speech ends
 */
export const speak = (text, onEnd = null) => {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis is not supported.');
    return;
  }
  
  // Cancel any ongoing speech
  stopSpeaking();
  
  // Split text into smaller chunks for better performance
  const textChunks = splitTextIntoChunks(text, 200);
  
  let utteranceIndex = 0;
  
  const speakNextChunk = () => {
    if (utteranceIndex >= textChunks.length) {
      if (onEnd) onEnd();
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(textChunks[utteranceIndex]);
    
    // Set rate and voice
    utterance.rate = speechRate;
    if (speechVoice) {
      utterance.voice = speechVoice;
    }
    
    // Handle end of chunk
    utterance.onend = () => {
      utteranceIndex++;
      speakNextChunk();
    };
    
    // Handle error
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      utteranceIndex++;
      speakNextChunk();
    };
    
    // Speak the chunk
    window.speechSynthesis.speak(utterance);
  };
  
  // Start speaking
  speakNextChunk();
};

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Set the speech rate
 * @param {number} rate - Rate from 0.1 to 10
 */
export const setSpeechRate = (rate) => {
  speechRate = rate;
};

/**
 * Set the speech voice by type
 * @param {string} voiceType - Voice type (default, male, female, british, etc.)
 */
export const setSpeechVoice = (voiceType) => {
  if (!('speechSynthesis' in window)) return;
  
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) return;
  
  // Map voice type to voice selection logic
  switch (voiceType) {
    case 'male':
      // Try to find a male English voice
      speechVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') && voice.lang.startsWith('en')
      ) || voices.find(voice => voice.lang === 'en-US');
      break;
    
    case 'female':
      // Try to find a female English voice
      speechVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en')
      ) || voices.find(voice => voice.lang === 'en-US');
      break;
    
    case 'british':
      // Try to find a British English voice
      speechVoice = voices.find(voice => voice.lang === 'en-GB');
      break;
      
    case 'default':
    default:
      // Default to a US English voice
      speechVoice = voices.find(voice => voice.lang === 'en-US');
      break;
  }
};