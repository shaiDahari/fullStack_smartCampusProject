# Smart Campus Monitoring System 🏫

A full-stack web application for monitoring campus garden environments through IoT sensors, providing real-time data visualization and plant management capabilities.

## 🎯 Project Overview

The Smart Campus Monitoring System enables facilities management to monitor and maintain campus gardens efficiently through:

- **Real-time sensor monitoring** (temperature, humidity, moisture, light)
- **Interactive map visualization** with drag-and-drop sensor placement
- **Building and floor management** with floor plan integration
- **Plant inventory and watering schedule management**
- **Historical data tracking and analytics**
- **Responsive dashboard** with key performance indicators

## 🏗️ System Architecture

### Frontend (React Application)
- **Framework**: React 18 with Vite for fast development
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theming
- **Routing**: React Router DOM v7
- **Charts**: Recharts for data visualization
- **State Management**: React Context and custom hooks

### Backend (Node.js API)
- **Framework**: Express.js REST API
- **Database**: MySQL with connection pooling
- **Architecture**: MVC pattern (Models, Views, Controllers)
- **CORS**: Configured for cross-origin requests

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shaiDahari/fullStack_smartCampusProject.git
   cd fullStack_smartCampusProject
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Database setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE smart_campus;
   ```

4. **Environment configuration**
   ```bash
   # Create .env file in server directory
   cd server
   echo "DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=smart_campus
   DB_PORT=3306" > .env
   ```

### Running the Application

#### Development Mode (Recommended)
```bash
# Terminal 1 - Start backend server (port 8080)
cd server
npm run dev

# Terminal 2 - Start frontend development server (port 5173)
cd client
npm run dev
```

#### Using Batch Scripts (Windows)
```bash
# Start both frontend and backend simultaneously
./client/start-full-stack.bat
```

Access the application at `http://localhost:5173`

## 📱 Key Features

### 🗺️ Interactive Map View
- **Visual sensor placement** on building floor plans
- **Drag-and-drop positioning** with real-time coordinate updates
- **Sensor status indicators** (active, inactive, maintenance)
- **Building → Floor → Map navigation** cascade

### 📊 Dashboard Analytics
- **Real-time metrics** with auto-refresh capabilities
- **Historical trend charts** using Recharts
- **Alert notifications** for sensor anomalies
- **Quick action buttons** for common tasks

### 🏢 Building Management
- **Multi-level hierarchy**: Buildings → Floors → Rooms
- **Floor plan upload** and management
- **Expandable building cards** with integrated floor CRUD operations
- **Large map preview** with responsive overlay dialogs

### 🌱 Sensor & Plant Management
- **Comprehensive sensor CRUD** with form validation
- **Sensor type categorization** (temperature, humidity, moisture, light)
- **Plant inventory tracking** with watering schedules
- **Advanced filtering** by building, floor, status, and type

## 🛠️ Technical Implementation

### Frontend Architecture
```
client/src/
├── pages/           # Main application pages
├── components/
│   ├── ui/         # Reusable shadcn/ui components
│   └── dashboard/  # Dashboard-specific components
├── api/            # API client and entity definitions
├── config/         # Configuration files
├── hooks/          # Custom React hooks
└── lib/           # Utility functions
```

### Backend Architecture
```
server/
├── controllers/    # Request handlers
├── models/        # Database models
├── routes/        # Express route definitions
├── services/      # Business logic layer
├── config/        # Database configuration
└── scripts/       # Database utilities
```

### Key Technologies

**Frontend Stack:**
- React 18 + Vite
- Tailwind CSS + shadcn/ui
- React Router DOM v7
- Recharts for visualization
- Framer Motion for animations

**Backend Stack:**
- Express.js
- MySQL2 with connection pooling
- CORS middleware
- Environment configuration

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/buildings` | GET, POST, PUT, DELETE | Building management |
| `/api/floors` | GET, POST, PUT, DELETE | Floor management |
| `/api/sensors` | GET, POST, PUT, DELETE | Sensor operations |
| `/api/plants` | GET, POST, PUT, DELETE | Plant inventory |
| `/api/measurements` | GET, POST | Sensor data readings |
| `/api/watering-schedules` | GET, POST, PUT, DELETE | Watering management |

## 🎨 UI/UX Highlights

- **Responsive design** optimized for desktop and tablet
- **Hebrew RTL support** for localized interface
- **Toast notifications** with auto-dismiss functionality
- **Modal dialogs** with proper z-index layering
- **Form validation** with comprehensive error handling
- **Drag performance optimization** using requestAnimationFrame

## 🔄 Development Workflow

### Code Quality
- ESLint configuration for consistent code style
- React best practices with hooks and functional components
- Proper error boundaries and loading states

### Performance Optimizations
- Direct DOM manipulation for drag operations
- Connection pooling for database efficiency
- Lazy loading for large datasets
- Optimized re-rendering with React.memo

## 📋 Database Schema

The system manages the following core entities:
- **Buildings** (id, name, slug, description)
- **Floors** (id, building_id, level, name, map_data)
- **Sensors** (id, name, type, status, x_percent, y_percent, floor_id)
- **Plants** (id, name, species, location, care_instructions)
- **Measurements** (id, sensor_id, value, timestamp)

## 🚀 Deployment Considerations

- Environment variables for database configuration
- Static file serving for uploaded maps
- CORS configuration for production domains
- Database migration scripts for updates

## 👥 Team Collaboration

This project demonstrates full-stack development skills including:
- **Frontend development** with modern React patterns
- **Backend API design** following REST principles
- **Database design** with proper relationships
- **UI/UX implementation** with professional components
- **State management** across complex user interactions

## 📈 Future Enhancements

- Real-time WebSocket connections for live sensor updates
- Mobile application development
- Advanced analytics and reporting features
- Integration with IoT hardware sensors
- User authentication and role-based access control

---

**Developed by**: [Your Team Name]  
**Technology Stack**: React + Node.js + MySQL  
**License**: MIT