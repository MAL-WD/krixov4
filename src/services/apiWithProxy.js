import axios from 'axios';
import { getConfigWithProxy } from '../config/backend';
import { handleApiError, logError } from '../utils/errorHandler';

// Create axios instance with CORS proxy
const createApiInstance = (useProxy = false) => {
  const config = getConfigWithProxy(useProxy);
  
  return axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Create both instances
const apiDirect = createApiInstance(false);
const apiWithProxy = createApiInstance(true);

// Request interceptor to add auth token if available
const addRequestInterceptors = (apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Response interceptor to handle common errors
const addResponseInterceptors = (apiInstance) => {
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      logError(error, 'API Request');
      return Promise.reject(error);
    }
  );
};

// Add interceptors to both instances
addRequestInterceptors(apiDirect);
addRequestInterceptors(apiWithProxy);
addResponseInterceptors(apiDirect);
addResponseInterceptors(apiWithProxy);

// Command API functions with proxy option
export const commandAPIWithProxy = {
  // Create a new command
  createCommand: async (commandData, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      
      // Transform data to match backend format
      const backendData = {
        firstName: commandData.name,
        number: commandData.phone,
        service: commandData.services.join(', '),
        workers: commandData.workers.toString(),
        start: commandData.start,
        distination: commandData.end
      };
      
      console.log("backendData:", backendData);
      console.log("Sending request to:", api.defaults.baseURL + '/CreateCommand');
      console.log("Using proxy:", useProxy);
      
      const response = await api.post('/CreateCommand', backendData);
      console.log("Response received:", response);
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'CreateCommand');
      throw new Error(userMessage);
    }
  },

  // Get all commands
  getCommands: async (useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const response = await api.get('/GetCommands');
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'GetCommands');
      throw new Error(userMessage);
    }
  },

  // Update command status (approve/reject)
  updateCommandStatus: async (commandId, status, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const response = await api.put(`/commands/${commandId}/status`, { status });
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'UpdateCommandStatus');
      throw new Error(userMessage);
    }
  },

  // Delete command
  deleteCommand: async (commandId, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const response = await api.delete(`/commands/${commandId}`);
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'DeleteCommand');
      throw new Error(userMessage);
    }
  }
};

// Worker API functions with proxy option
export const workerAPIWithProxy = {
  // Create a new worker registration
  createWorker: async (workerData, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      
      // Transform data to match backend format
      const backendData = {
        fullname: workerData.name,
        number: workerData.phone,
        email: workerData.email,
        password: workerData.password || "defaultPassword123!",
        position: workerData.position,
        experience: workerData.experience,
        message: workerData.message,
        isaccepted: workerData.isAccepted
      };
      
      const response = await api.post('/CreateWorker', backendData);
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'CreateWorker');
      throw new Error(userMessage);
    }
  },

  // Get all workers
  getWorkers: async (useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const response = await api.get('/GetWorkers');
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'GetWorkers');
      throw new Error(userMessage);
    }
  },

  // Update worker status (approve/reject)
  updateWorkerStatus: async (workerId, status, password = null, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const data = { status };
      if (password) {
        data.password = password;
      }
      const response = await api.put(`/workers/${workerId}/status`, data);
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'UpdateWorkerStatus');
      throw new Error(userMessage);
    }
  },

  // Delete worker
  deleteWorker: async (workerId, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const response = await api.delete(`/workers/${workerId}`);
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'DeleteWorker');
      throw new Error(userMessage);
    }
  }
};

// User registration and authentication with proxy option
export const authAPIWithProxy = {
  // User registration
  register: async (userData, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const response = await api.post('/Regestration', userData);
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'Registration');
      throw new Error(userMessage);
    }
  },

  // Get account by ID
  getAccount: async (accountId, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const response = await api.get(`/account/${accountId}`);
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'GetAccount');
      throw new Error(userMessage);
    }
  },

  // Login (if you have a login endpoint)
  login: async (credentials, useProxy = false) => {
    try {
      const api = useProxy ? apiWithProxy : apiDirect;
      const response = await api.post('/login', credentials);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      const userMessage = handleApiError(error, 'Login');
      throw new Error(userMessage);
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
  }
};

// Export default API instances for convenience
export { apiDirect, apiWithProxy }; 