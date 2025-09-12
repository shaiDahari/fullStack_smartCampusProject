// API Configuration
export const API_CONFIG = {
  // Server configuration - supports ngrok override
  SERVER_PORT: 8080,
  SERVER_HOST: 'localhost',
  
  // API URLs
  get API_BASE_URL() {
    // Check for environment override (ngrok support)
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
    
    // All backend APIs are mounted under /api
    return `http://${this.SERVER_HOST}:${this.SERVER_PORT}/api`;
  },
  
  // Endpoints
  ENDPOINTS: {
    SENSORS: '/sensors',
    SENSORS_FILTER: '/sensors/filter',
    PLANTS: '/plants',
    MEASUREMENTS: '/measurements', 
    WATERING_SCHEDULES: '/watering-schedules',
    MAPS: '/maps',
    API_DOCS: '/api/docs'
  },
  
  // Frontend configuration - auto-detect current port
  get FRONTEND_PORT() {
    // Try to detect current port from window.location if available
    if (typeof window !== 'undefined' && window.location) {
      return parseInt(window.location.port) || 5173;
    }
    return 5173; // Default fallback
  },
  
  get FRONTEND_URL() {
    return `http://${this.SERVER_HOST}:${this.FRONTEND_PORT}`;
  },
  
  // CORS origins for backend - multiple common ports
  get CORS_ORIGINS() {
    const commonPorts = [5173, 5174, 3000, 3001];
    const origins = [];
    
    commonPorts.forEach(port => {
      origins.push(`http://localhost:${port}`);
      origins.push(`http://127.0.0.1:${port}`);
    });
    
    // Add detected current frontend URL
    origins.push(this.FRONTEND_URL);
    
    return origins;
  },
  
  // Request configuration
  REQUEST_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

export default API_CONFIG;