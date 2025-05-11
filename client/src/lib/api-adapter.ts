import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { queryClient } from './queryClient';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  // Get the JWT token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // If token exists, add it to Authorization header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle unauthorized responses (401)
    if (error.response?.status === 401) {
      // Clear token and user data
      localStorage.removeItem('auth_token');
      queryClient.setQueryData(['/api/user'], null);
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/login') {
        window.location.href = '/auth';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    
    // Save token on successful registration
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response.data;
  },
  
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    
    // Save token on successful login
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response.data;
  },
  
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
    queryClient.setQueryData(['/api/user'], null);
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },
  
  updateProfile: async (profileData: any) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },
  
  getCredits: async () => {
    const response = await api.get('/user/credits');
    return response.data;
  },
  
  addCredits: async (amount: number) => {
    const response = await api.post('/user/credits', { amount });
    return response.data;
  },
};

// Contacts API
export const contactsAPI = {
  getAll: async () => {
    const response = await api.get('/contacts');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },
  
  create: async (contactData: any) => {
    const response = await api.post('/contacts', contactData);
    return response.data;
  },
  
  bulkImport: async (contacts: any[]) => {
    const response = await api.post('/contacts/bulk', { contacts });
    return response.data;
  },
  
  update: async (id: number, contactData: any) => {
    const response = await api.put(`/contacts/${id}`, contactData);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },
  
  search: async (query: string) => {
    const response = await api.get('/contacts/search', { params: { q: query } });
    return response.data;
  },
};

// Campaigns API
export const campaignsAPI = {
  getAll: async () => {
    const response = await api.get('/campaigns');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  },
  
  create: async (campaignData: any) => {
    const response = await api.post('/campaigns', campaignData);
    return response.data;
  },
  
  update: async (id: number, campaignData: any) => {
    const response = await api.put(`/campaigns/${id}`, campaignData);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data;
  },
  
  start: async (id: number) => {
    const response = await api.post(`/campaigns/${id}/start`);
    return response.data;
  },
  
  pause: async (id: number) => {
    const response = await api.post(`/campaigns/${id}/pause`);
    return response.data;
  },
  
  complete: async (id: number) => {
    const response = await api.post(`/campaigns/${id}/complete`);
    return response.data;
  },
};

// Calls API
export const callsAPI = {
  getAll: async () => {
    const response = await api.get('/calls');
    return response.data;
  },
  
  getByContact: async (contactId: number) => {
    const response = await api.get(`/calls/contact/${contactId}`);
    return response.data;
  },
  
  getByCampaign: async (campaignId: number) => {
    const response = await api.get(`/calls/campaign/${campaignId}`);
    return response.data;
  },
  
  makeCall: async (callData: any) => {
    const response = await api.post('/calls', callData);
    return response.data;
  },
  
  getStatus: async (sid: string) => {
    const response = await api.get(`/calls/${sid}`);
    return response.data;
  },
  
  endCall: async (sid: string) => {
    const response = await api.post(`/calls/${sid}/end`);
    return response.data;
  },
  
  sendSMS: async (smsData: any) => {
    const response = await api.post('/calls/sms', smsData);
    return response.data;
  },
};

// OpenAI API
export const openAIAPI = {
  chat: async (messages: any[], model: string = 'gpt-4o') => {
    const response = await api.post('/openai/chat', { messages, model });
    return response.data;
  },
  
  multilingualChat: async (messages: any[], conversationLanguage: string, responseLanguage: string, translateUserInput: boolean = true, model: string = 'gpt-4o') => {
    const response = await api.post('/openai/multilingual-chat', { 
      messages, 
      conversationLanguage, 
      responseLanguage, 
      translateUserInput,
      model
    });
    return response.data;
  },
  
  translate: async (text: string, targetLanguage: string, sourceLanguage?: string) => {
    const response = await api.post('/openai/translate', { 
      text, 
      targetLanguage, 
      sourceLanguage 
    });
    return response.data;
  },
  
  analyzeSentiment: async (text: string) => {
    const response = await api.post('/openai/analyze-sentiment', { text });
    return response.data;
  },
  
  parseContacts: async (text: string) => {
    const response = await api.post('/openai/parse-contacts', { text });
    return response.data;
  },
  
  generateScript: async (scriptPrompts: any, language: string = 'en') => {
    const response = await api.post('/openai/generate-script', { 
      ...scriptPrompts,
      language
    });
    return response.data;
  },
  
  transcribeAudio: async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const response = await api.post('/openai/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  getMessages: async () => {
    const response = await api.get('/chat/messages');
    return response.data;
  },
  
  getConversation: async (recipientId: number) => {
    const response = await api.get(`/chat/messages/${recipientId}`);
    return response.data;
  },
  
  sendMessage: async (content: string, recipientId: number, type: string = 'text', metadata: any = {}) => {
    const response = await api.post('/chat/messages', { 
      content, 
      recipientId, 
      type, 
      metadata 
    });
    return response.data;
  },
  
  markAsRead: async (senderId: number) => {
    const response = await api.put(`/chat/messages/read/${senderId}`);
    return response.data;
  },
  
  deleteMessage: async (id: number) => {
    const response = await api.delete(`/chat/messages/${id}`);
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/chat/messages/unread/count');
    return response.data;
  },
};

// Export default API object with all modules
export default {
  auth: authAPI,
  user: userAPI,
  contacts: contactsAPI,
  campaigns: campaignsAPI,
  calls: callsAPI,
  openAI: openAIAPI,
  chat: chatAPI,
};