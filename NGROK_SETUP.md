# Smart Campus - ngrok Setup Guide

## Quick Setup for Team Sharing

### 1. Install ngrok
Download from: https://ngrok.com/download
- Extract to `C:\ngrok\` 
- Add to Windows PATH or use directly

### 2. Authenticate ngrok
```bash
# Sign up at ngrok.com and get your authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

### 3. Start Your Applications (in separate terminals)

**Terminal 1 - Backend API:**
```bash
cd server
npm run dev
# Should start on http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
cd client  
npm run dev
# Should start on http://localhost:5173
```

### 4. Expose Backend with ngrok

**Terminal 3 - ngrok for Backend:**
```bash
ngrok http 8080 --region=us
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### 5. Update Frontend for ngrok

**Option A - Environment Variable (Recommended):**
Create `client/.env.local`:
```env
VITE_API_BASE_URL=https://YOUR_NGROK_URL_HERE/api
```

**Option B - Temporary API Config Update:**
Edit `client/src/config/api.js`:
```javascript
export const API_CONFIG = {
  SERVER_PORT: 443, // HTTPS port
  SERVER_HOST: 'YOUR_NGROK_URL_HERE', // without https://
  
  get API_BASE_URL() {
    return `https://${this.SERVER_HOST}/api`;
  },
  // ... rest unchanged
};
```

### 6. Expose Frontend with ngrok (Optional)

**Terminal 4 - ngrok for Frontend:**
```bash
ngrok http 5173 --region=us
```

### 7. Share URLs with Team

**Full Stack URLs:**
- **Frontend**: `https://YOUR_FRONTEND_NGROK_URL.ngrok-free.app`
- **Backend API**: `https://YOUR_BACKEND_NGROK_URL.ngrok-free.app/api`

**If only backend exposed:**
- **Frontend**: `http://localhost:5173` (team accesses your local IP)
- **Backend API**: `https://YOUR_BACKEND_NGROK_URL.ngrok-free.app/api`

## Quick Commands Reference

```bash
# Start backend with ngrok
cd server && npm run dev &
ngrok http 8080

# Start frontend (in another terminal)  
cd client && npm run dev

# Check ngrok tunnels
ngrok status
```

## Troubleshooting

### CORS Issues
Add your ngrok URL to backend CORS config in `server/config/cors.js` or similar.

### ngrok Free Plan Limits
- Tunnel expires after 8 hours
- Limited concurrent tunnels
- May show warning page (teammates can click "Visit Site")

### Network Access
- Teammates can access via the ngrok URLs from anywhere
- Your computer must stay running
- Keep all terminals open (server, client, ngrok)

## Production Alternative
For longer-term sharing, consider deploying to:
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, Heroku
- **Database**: Railway PostgreSQL, MongoDB Atlas