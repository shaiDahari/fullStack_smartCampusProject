// API client for Node.js Express backend
import { API_CONFIG } from '../config/api.js';

class APIClient {
  constructor() {
    this.baseURL = API_CONFIG.API_BASE_URL;
    this.timeout = API_CONFIG.REQUEST_TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    console.log(`🔗 API Request: ${url}`);

    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error ${response.status} for ${endpoint}:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`✅ API Success for ${endpoint}:`, data.length ? `${data.length} items` : 'response received');
        return data;
      } catch (error) {
        lastError = error;
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.error(`🔌 Network Error: Cannot connect to backend server at ${this.baseURL}`);
          console.error(`   Make sure the backend server is running on port ${API_CONFIG.SERVER_PORT}`);
          
          if (attempt < this.retryAttempts) {
            console.log(`   Retrying in 2 seconds... (attempt ${attempt + 1}/${this.retryAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          throw new Error('Backend server is not running or not accessible');
        }
        
        console.error(`❌ API request failed: ${endpoint}`, error.message);
        break;
      }
    }
    
    throw lastError;
  }

  // Sensors
  async getSensors() {
    return await this.request('/sensors');
  }

  async filterSensors(params) {
    const searchParams = new URLSearchParams(params);
    return await this.request(`/filter-sensors?${searchParams}`);
  }

  // Buildings
  async getBuildings() {
    return await this.request('/buildings');
  }

  async createBuilding(data) {
    return await this.request('/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Floors
  async getFloors() {
    return await this.request('/floors');
  }

  async createFloor(data) {
    return await this.request('/floors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Plants  
  async getPlants() {
    return await this.request('/plants');
  }

  async updatePlant(id, data) {
    return await this.request(`/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Measurements
  async getMeasurements(sort = '-timestamp', limit = 100) {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', limit.toString());
    
    return await this.request(`/measurements?${params}`);
  }

  // Watering schedules
  async getWateringSchedules(sort = '-created_date', limit = 100) {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', limit.toString());
    
    return await this.request(`/watering-schedules?${params}`);
  }

  async createWateringSchedule(data) {
    return await this.request('/watering-schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Maps
  async getMaps() {
    return await this.request('/maps');
  }

  async createMap(data) {
    return await this.request('/maps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMeasurementsBySensor(sensorId, limit = 20) {
    const params = new URLSearchParams({ sensor_id: String(sensorId), limit: String(limit) });
    return await this.request(`/measurements?${params}`);
  }
}

// Create API client instance
export const apiClient = new APIClient();

// Entity-like interface for API operations
export const entities = {
  Sensor: {
    list: () => apiClient.getSensors(),
    filter: (params) => apiClient.filterSensors(params),
    create: (data) => apiClient.request('/sensors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiClient.request(`/sensors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiClient.request(`/sensors/${id}`, { method: 'DELETE' }),
  },
  Building: {
    list: () => apiClient.getBuildings(),
    create: (data) => apiClient.createBuilding(data),
    update: (id, data) => apiClient.request(`/buildings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiClient.request(`/buildings/${id}`, { method: 'DELETE' }),
  },
  Floor: {
    list: () => apiClient.getFloors(),
    create: (data) => apiClient.createFloor(data),
    update: (id, data) => apiClient.request(`/floors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiClient.request(`/floors/${id}`, { method: 'DELETE' }),
  },
  Plant: {
    list: () => apiClient.getPlants(),
    update: (id, data) => apiClient.updatePlant(id, data),
  },
  Measurement: {
    list: (sort, limit) => apiClient.getMeasurements(sort, limit),
    listBySensor: (sensorId, limit) => apiClient.getMeasurementsBySensor(sensorId, limit),
  },
  WateringSchedule: {
    list: (sort, limit) => apiClient.getWateringSchedules(sort, limit),
    create: (data) => apiClient.createWateringSchedule(data),
  },
  Map: {
    list: () => apiClient.getMaps(),
    create: (data) => apiClient.createMap(data),
    delete: (id) => apiClient.request(`/maps/${id}`, { method: 'DELETE' }),
  },
};// Export entities as default
export default { entities };