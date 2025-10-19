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
- **Visual sensor placement** on building floor plans with accurate positioning
- **Drag-and-drop positioning** with real-time coordinate updates and smooth performance
- **Sensor status indicators** with unified color scheme (green=active, red=inactive)
- **Building → Floor → Map navigation** cascade with persistent state management
- **Session persistence** - maintains floor selection across page refreshes
- **Support for floors without maps** with appropriate messaging

### 📊 Real-time Statistics & Analytics
- **Live sensor counts** with automatic updates after data changes
- **Building-level statistics** with accurate sensor counts per floor
- **Real-time data synchronization** across map deletions and sensor modifications
- **Responsive dashboard** with key performance indicators

### 🏢 Advanced Building Management
- **Complete building hierarchy**: Buildings → Floors → Maps → Sensors
- **Integrated infrastructure wizard** for guided building/floor/map creation
- **Smart auto-naming** - automatic map naming using building_floor pattern when name field is empty
- **Expandable building cards** with comprehensive floor CRUD operations
- **Large map preview** with responsive overlay dialogs (90vw sizing)
- **Map assignment system** with upload, replace, and remove functionality

### 🌱 Enhanced Sensor & Plant Management
- **Advanced sensor CRUD** with comprehensive edit functionality including location changes
- **Drag-and-drop sensor positioning** with move overlay for precise placement
- **Sensor type categorization** with automatic unit assignment (moisture→%, temperature→°C, etc.)
- **Advanced filtering** by building, floor, status, and sensor type
- **Cascade deletion protection** ensuring data integrity across the hierarchy

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
| `/api/buildings` | GET, POST, PUT, DELETE | Building management with cascade deletion |
| `/api/floors` | GET, POST, PUT, DELETE | Floor management with map integration |
| `/api/sensors` | GET, POST, PUT, DELETE | Sensor operations with location tracking |
| `/api/maps` | GET, POST, DELETE | Map management with floor assignment |
| `/api/filter-sensors` | GET | Advanced sensor filtering by map/building/floor |
| `/api/plants` | GET, POST, PUT, DELETE | Plant inventory management |
| `/api/measurements` | GET, POST | Sensor data readings and historical data |
| `/api/watering-schedules` | GET, POST, PUT, DELETE | Watering schedule management |
| `/api/cleanup-orphaned-data` | POST | Database maintenance and cleanup utility |

## 🎨 UI/UX Highlights

- **Responsive design** optimized for desktop and tablet with mobile-friendly dropdowns
- **Hebrew RTL support** for localized interface with proper text alignment
- **Enhanced toast notifications** with auto-dismiss (3 seconds) and working close buttons
- **Advanced modal dialogs** with proper z-index layering (z-[1000]) and transparent overlays
- **Comprehensive form validation** with Hebrew error messages and duplicate detection
- **Smooth drag performance** using requestAnimationFrame for 60fps sensor positioning
- **Unified color scheme** for consistent sensor status indicators across all pages
- **Persistent state management** with localStorage for seamless user experience

## 🔄 Development Workflow

### Code Quality
- ESLint configuration for consistent code style
- React best practices with hooks and functional components
- Proper error boundaries and loading states

### Performance Optimizations
- **Direct DOM manipulation** for smooth drag operations using requestAnimationFrame
- **Connection pooling** for database efficiency with mysql2/promise
- **LocalStorage persistence** for maintaining user state across sessions
- **Optimized re-rendering** with React.memo and proper state management
- **Cascade deletion optimization** with transaction-based operations

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

## 🔧 Recent Major Updates

### MapView Improvements (Latest Release)
- **Fixed refresh issue** - Now maintains correct floor selection across page refreshes
- **localStorage enhancement** - Supports floors without maps with proper state persistence
- **Building wizard improvements** - Removed map name requirement and added auto-naming
- **Enhanced navigation** - Prevents auto-selection interference during state restoration

### Data Integrity & Performance
- **Complete cascade deletion** - Properly handles building/floor/map/sensor hierarchy
- **Database cleanup utilities** - Automated orphaned data detection and removal
- **Real-time statistics** - Live updates across all map and sensor modifications
- **Optimized drag operations** - Smooth sensor positioning with performance improvements

### UI/UX Enhancements
- **Unified color scheme** - Consistent green/red indicators for active/inactive sensors
- **Enhanced error handling** - Comprehensive validation with Hebrew error messages
- **Improved mobile support** - Fixed dropdown visibility and responsive design issues
- **Toast system overhaul** - Auto-dismiss functionality with working close buttons

## 📈 Future Enhancements

- Real-time WebSocket connections for live sensor updates
- Mobile application development with React Native
- Advanced analytics and reporting dashboard
- Integration with physical IoT hardware sensors
- User authentication and role-based access control
- API rate limiting and security enhancements

---

**Developed by**: [Your Team Name]  
**Technology Stack**: React + Node.js + MySQL  
**License**: MIT