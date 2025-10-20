# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack Smart Campus monitoring application with a React frontend and Node.js Express backend. The system manages buildings, floors, sensors, plants, and watering schedules for campus garden monitoring.

## Architecture

### Frontend (client/)
- **Framework**: React 18 with Vite build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme
- **Routing**: React Router DOM v7
- **API Client**: Custom implementation in `src/api/apiClient.js`
- **State Management**: React hooks with context patterns

### Backend (server/)
- **Framework**: Express.js with CORS enabled
- **Database**: MySQL with mysql2/promise driver (connection pooling)
- **Architecture Pattern**: MVC (Models, Controllers, Routes, Services)
- **API Structure**: RESTful APIs under `/api` prefix

## Development Commands

### Frontend Development
```bash
cd client
npm install          # Install dependencies
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend Development
```bash
cd server
npm install          # Install dependencies
npm run dev          # Start development server
npm start           # Start production server
```

### Full Stack Development
- Use `start-full-stack.bat` (Windows) or `start-full-stack.sh` (Unix) to start both frontend and backend
- Frontend runs on port 5173 (Vite default)
- Backend runs on port 8080

## Database Configuration

The MySQL database configuration is handled in `server/config/db.js`:
- Default database: `smart_campus`
- Connection pooling with 10 connections max
- Auto-creates database if it doesn't exist
- Uses environment variables for configuration (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)

## API Structure

All API endpoints are prefixed with `/api`:
- `/api/buildings` - Building management
- `/api/floors` - Floor management  
- `/api/sensors` - Sensor data and filtering
- `/api/plants` - Plant management
- `/api/measurements` - Sensor measurements
- `/api/watering-schedules` - Watering schedule management
- `/api/maps` - Map data

## Component Architecture

### Frontend Structure
- `pages/` - Main application pages (Dashboard, Sensors, Plants, etc.)
- `components/ui/` - Reusable shadcn/ui components
- `components/dashboard/` - Dashboard-specific components
- `api/` - API client and entity definitions
- `config/` - Configuration files (API endpoints)
- `lib/` - Utility functions
- `hooks/` - Custom React hooks

### Backend Structure
- `models/` - Database models for each entity
- `controllers/` - Request handlers for each resource
- `services/` - Business logic layer
- `routes/` - Express route definitions
- `config/` - Database and other configuration

## Key Files

- `client/src/config/api.js` - API endpoint configuration with auto-detection
- `server/config/db.js` - Database connection setup with pooling
- `client/components.json` - shadcn/ui component configuration
- `client/tailwind.config.js` - Tailwind CSS configuration
- `client/vite.config.js` - Vite build configuration with path aliases

## Recent Development Updates

### Sensor Management Improvements (Previous Sessions)
- **Enhanced Sensor Creation Workflow**: Redesigned to be form-first (fill details → select location on map) instead of map-first
- **Edit Sensor Functionality**: Added comprehensive edit functionality to both MapView and Sensors pages with forms for name, status, building, floor, and room
- **Drag Performance Optimization**: Implemented direct DOM manipulation for smooth sensor dragging on MapView without lag
- **Dialog Transparency**: Fixed dialog overlays to be transparent for better map visibility during sensor placement
- **Delete Functionality**: Added delete confirmation dialogs with proper error handling and toast notifications
- **Tooltip Improvements**: Fixed tooltip behavior during drag operations and click events
- **Import Fixes**: Corrected useToast import paths across components

### Emergency Rollback Session (09/07/2025 Checkpoint)
- **Fixed JSX Structure Error**: Resolved missing closing div tag in MapView that caused JSX parsing errors
- **Enhanced Dropdown Visibility**: Fixed Select dropdown clipping issues by adding `overflow-visible` to DialogContent and proper z-index layering
- **Added Sensor Type Field**: Implemented sensor type selection with auto-populated units across both MapView and Sensors pages
- **Type-Based Unit Assignment**: Automatic unit assignment (moisture→%, temperature→°C, humidity→%, light→lux)
- **Improved Drag Performance**: Enhanced sensor dragging with requestAnimationFrame throttling for smoother fast movements
- **Form Validation Enhancement**: Added type field validation to sensor forms with proper error messaging in Hebrew
- **Consistent UX Patterns**: Applied same dropdown positioning and z-index fixes across all Select components

### Map View Selection Flow Improvements (Task 1)
- **Building → Floor Selection Flow**: Replaced single "map" dropdown with Building → Floor cascade selection
- **Auto-Selection Logic**: Automatically selects first available floor when building is selected
- **No Map Handling**: Added "No map assigned" message for floors without maps
- **Map Card Title Updates**: Updated map card titles to show building-floor names for clarity
- **Proper State Management**: Enhanced state handling for building/floor/map selection cascade

### Buildings Page Comprehensive Enhancements (Task 2-2.3)
- **Duplicate Building Resolution**: Implemented deduplication logic and database merge scripts with transaction handling
- **Building Uniqueness Constraints**: Added unique indexes on building slug and floor building_id+level combination
- **Floor/Map Management Integration**: Added expandable floor sections within building cards with full CRUD operations
- **Floor CRUD Operations**: Implemented complete create, edit, delete functionality for floors with validation
- **Map Assignment System**: Added assign/replace/remove map functionality for floors with file upload support
- **Large Map Preview Overlay**: Implemented responsive Dialog with w-[90vw] sizing and max-h-[70vh] image scaling
- **Map Button Integration**: Added MapPin button for each floor row with large preview functionality
- **Transaction-Based Merging**: Created comprehensive standalone merge scripts with proper rollback handling

### Database Integrity and Infrastructure
- **Unique Constraints Implementation**: Added database constraints preventing duplicate buildings and floors
- **Merge Script Creation**: Developed standalone scripts for merging duplicate buildings and floors with backup creation
- **Transaction Support**: Implemented proper database transaction handling with rollback capabilities
- **Connection Pool Management**: Enhanced database connection handling in standalone scripts with retry logic
- **Cascade Delete Support**: Proper foreign key relationships for building/floor/sensor hierarchy

### Key Technical Implementation Details
- **shadcn/ui Dialog Components**: Extensive use with proper z-index layering (z-[1000]) for overlays and dropdowns
- **Responsive Design**: Large map overlay with w-[90vw] and max-h-[85vh] dimensions with object-contain scaling
- **File Upload Integration**: Base64 conversion for map images with FileReader and proper error handling
- **Form Validation**: Hebrew error messages with comprehensive validation logic and duplicate detection
- **State Management**: Proper expansion state handling for building cards and cascade selection flows
- **Database Scripts**: Standalone merge utilities with backup creation, transaction support, and verification
- **Error Handling**: Comprehensive try-catch blocks with user-friendly Hebrew messages and proper rollback
- **MapView Performance**: Direct DOM manipulation during drag with cached bounding rectangles and requestAnimationFrame throttling
- **UI Components**: Extensive use of shadcn/ui Dialog, Select, AlertDialog components with proper z-index layering
- **Event Handling**: Proper event bubbling control with `stopPropagation()` for overlay interactions

## Development Notes

- The frontend uses path alias `@/` pointing to `src/`
- Database connection uses a proxy pattern for lazy initialization
- CORS is configured to allow multiple common development ports
- The application supports both `.js` and `.jsx` extensions with JSX compilation
- **Performance**: Direct DOM manipulation is used for drag operations to avoid React re-render lag
- **UX Design**: Form-first approach for sensor creation provides better user experience

## Memories

### Session 09/09/2025 - M1-D: Edit Modal + Move Overlay Stabilization

**Critical Issues Fixed:**
1. **Edit Modal Auto-Closing on Building Selection**: Modal was closing immediately on first open when Building changed
2. **Move Overlay Sensor Positioning**: Sensor wasn't appearing on new maps for positioning during edit workflow  
3. **Move Overlay Map Click Behavior**: Map clicks were inappropriately closing the overlay

**Implementation Summary:**

#### Missing Edit Functions Added
- **`handleEditSensor`**: Populates edit form with sensor data, handles legacy sensors by deriving building/floor from map_id
- **`handleEditLocationChange`**: Manages Building/Floor/Map cascade with pending move detection for repositioning workflow
- **`handleSetEditPosition`**: Opens Move overlay from Edit modal when "Set position" clicked
- **`handleEditPositionSet`**: Callback when Move overlay confirms position back to Edit modal
- **`handleEditFormSubmit`**: Complete form submission with location changes, position updates, and server sync

#### Dialog State & Event Management  
- **Controlled Dialog States**: Both Edit and Move dialogs use proper boolean controls (`showEditForm`, `showMoveDialog`)
- **Event Propagation**: `handleMapClick` and drag handlers use `e.stopPropagation()` preventing unintended dialog closes
- **Pending Move Pattern**: Shows "New map selected → Set position" banner instead of auto-opening overlay
- **Click Isolation**: Move overlay only closes via Confirm/Cancel buttons, never from map interactions

#### Sensor Display Logic
- **Dynamic Sensor Loading**: Move overlay includes moving sensor on target map even if not originally there
- **Draft Position Handling**: Sensor appears at current position or sensible default for repositioning
- **Map Integration**: Immediate sensor visibility when new map selected for smooth positioning workflow

#### Technical Fixes
- **Toast DOM Props**: Removed invalid `onOpenChange` props from Toast component causing React warnings
- **Data Type Safety**: Number conversion for `pendingMove` values before server submission  
- **Form Validation**: Hebrew error messages with proper required field validation
- **State Cleanup**: Proper cleanup of `pendingMove` and `editDraftPosition` states

**Files Modified:**
- `client/src/pages/Sensors.jsx` - Complete edit functionality implementation
- `client/src/components/ui/toaster.jsx` - Removed invalid DOM props

**Final Status:**
- ✅ Edit modal stable on first open with Building selection
- ✅ Move overlay shows sensor on any map for positioning
- ✅ Map clicks and drags work without closing overlay
- ✅ Complete edit workflow: Edit → location change → position → save
- ✅ No build errors, no React warnings, no server errors

## Latest Session Updates (09/09/2025)

### P2.2 - Sensors Move Dialog Card Width Fix
- **Fixed 3-Column Grid Issue**: Sensors page move dialog map Card was not filling the full width of its lg:col-span-3 container
- **Root Cause**: Card had implicit max-width constraints preventing it from using full grid space
- **Solution**: Added `max-w-none` class to Card element to remove width limitations
- **Result**: Map Card now properly fills all 3 columns with only grid gap remaining on the right

### P3 - Move Overlay Drag + Save Implementation
- **Full Drag Functionality**: Implemented complete sensor dragging system in move overlay using dedicated drag handlers
- **Draft Position System**: Added `draftPosition` state to track live sensor positioning without API calls during drag
- **Save/Cancel Pattern**: Explicit Save button persists changes via API, Cancel discards all changes
- **MapView Parity**: Reused exact drag mathematics and performance optimizations from MapView
- **Container Structure**: Maintained exact CardContent layout as MapView to prevent visual regressions
- **Sensor Highlighting**: Restored `highlightedSensorId` prop to visually indicate which sensor is being moved
- **Coordinate Consistency**: Both MapView and Sensors move overlay now use same coordinate system and positioning

### P4 - MapDisplay Object-Fit Conflict Resolution  
- **Fixed Rendering Issue**: Resolved conflicting object-fit declarations in MapDisplay component
- **Root Cause**: Map image had both `object-cover` CSS class and `object-contain` inline style
- **Solution**: Removed conflict by using single `object-contain` class for consistent rendering
- **Result**: Eliminated gutters and ensured proper aspect ratio maintenance across all map displays

### MapView Drag System Restoration
- **Fixed Broken Dragging**: Restored missing `dragRafId` ref and corrected drag handler signatures
- **Performance Fix**: Re-implemented requestAnimationFrame optimization for smooth sensor dragging
- **State Management**: Corrected `cachedRect` from useRef to useState for proper state handling
- **Handler Flow**: Restored proper `onStartDrag(sensor, e)` → `onMapMouseMove` → `onStopDrag` chain

### Toast System Complete Overhaul
- **Auto-Dismiss Implementation**: Toasts now automatically disappear after 3 seconds with proper timing
- **Working Close Button**: Fixed ✕ button to immediately dismiss toasts with proper state cleanup
- **Default Duration**: Added 3000ms default duration for all toasts, removed need for per-page duration settings
- **DOM Cleanup**: Reduced `TOAST_REMOVE_DELAY` to 1000ms for quick DOM element removal after animation
- **Open/Close State**: Implemented proper `open`/`onOpenChange` props flow between Toaster and Toast components
- **Single Instance**: Verified only one `<Toaster />` exists in App.jsx root to prevent conflicts

### Technical Implementation Details
- **Drag Performance**: Direct DOM manipulation with requestAnimationFrame throttling for 60fps dragging
- **Coordinate Systems**: Unified handling of `x_percent/y_percent` vs `location_x/location_y` across pages
- **State Patterns**: Draft position pattern for non-destructive editing with explicit save/cancel actions
- **Visual Consistency**: Maintained exact CardContent structure and sizing between MapView and move overlay
- **Error Handling**: Comprehensive error handling with Hebrew toast messages and proper cleanup
- **Event Management**: Proper mouse event handling with preventDefault and coordinate caching for performance

### Session Checkpoint Created
- **Backup Location**: `backup/checkpoint-20250909-181807/`
- **Contents**: Complete client source code, CLAUDE.md, and restoration instructions
- **Status**: All features working - drag functionality, toast system, visual consistency achieved

## Session Checkpoint (09/07/2025)

### Emergency Rollback Summary
- **Task M1 Attempted**: Coordinate alignment between Sensors page overlay and MapView for consistent sensor positioning
- **M1 Changes Made**: Modified coordinate field handling from `location_x/location_y` fallbacks to `x_percent/y_percent` only, changed container aspect ratios
- **Emergency Rollback Executed**: User requested complete revert to 06:00 state, forgetting M1 task entirely
- **System Restored**: Reverted all M1 changes - MapView uses `x_percent ?? location_x` fallbacks, Sensors page uses `aspect-video` container
- **Original Coordinate Inconsistency**: Restored pre-M1 state where sensor positions may differ between pages (this was the intended behavior)
- **Map Interactivity Confirmed**: Sensor dragging functionality verified as working in restored state
- **Backup Created**: M1 state preserved in `backup/post-M1-state-20250907-193905/` for potential future reference

### Current System State
- **MapView.jsx**: Uses `sensor.x_percent ?? sensor.location_x ?? fallback` for positioning, dynamic container (`w-full h-full`)
- **Sensors.jsx**: Uses `aspect-video` container for move sensor dialog, maintains original coordinate handling
- **Coordinate Fields**: Backend provides both `x_percent/y_percent` (database) and `location_x/location_y` (computed) fields
- **Build Status**: All files compile successfully, no syntax errors
- **Functionality**: Sensor dragging works, sensor filtering works, map interactivity confirmed

### Key Files Modified During Session
- `client/src/pages/MapView.jsx` - Reverted coordinate field priorities and container sizing
- `client/src/pages/Sensors.jsx` - Reverted move dialog container to aspect-video
- `backup/post-M1-state-20250907-193905/` - Contains M1 completed state for future reference