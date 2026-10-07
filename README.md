# Project Management Application

A full-stack, cross-platform Project and Task management system. 
Users can register, authenticate, and securely manage their own isolated projects and tasks across a responsive Web App and a native Android App, sharing a unified Backend and Database.

## Architecture & Tech Stack

- **Backend**: Node.js, Express, TypeScript, Zod, Prisma, PostgreSQL, JWT (Authentication), bcrypt (Hashing)
- **Web App**: React 18, Vite, TypeScript, React Router, TailwindCSS-inspired custom CSS
- **Mobile App**: React Native, Expo, Expo Router, TypeScript, SecureStore
- **Database**: PostgreSQL

## Folder Structure

- `/backend` - The Node.js Express server and Prisma ORM.
- `/web` - The React Vite web application.
- `/mobile` - The Expo React Native mobile application.
- `/docs` - Contains API documentation, ER diagrams, and final checklist.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- Expo CLI (`npm install -g expo-cli`)

## Setup & Local Development

### 1. PostgreSQL Setup
Ensure you have a local or hosted PostgreSQL instance running. Create an empty database.

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
JWT_SECRET="super-secret-key-change-me"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

Run database migrations:
```bash
npm run migrate
```

Start the backend:
```bash
npm run dev
```

### 3. Web Setup
Navigate to the `web` directory:
```bash
cd ../web
npm install
```

Create a `.env` file:
```env
VITE_API_URL="http://localhost:5000/api"
```

Start the web app:
```bash
npm run dev
```

### 4. Mobile Setup
Navigate to the `mobile` directory:
```bash
cd ../mobile
npm install
```

Create a `.env` file:
```env
EXPO_PUBLIC_API_URL="http://10.0.2.2:5000/api" # Use your machine's IP address if testing on a physical device on your LAN
```

Start the mobile app:
```bash
npx expo start
```

## Testing

Backend test suite (requires `DATABASE_URL` for full integration):
```bash
cd backend
npm run test
```

## Deployment Instructions

### Backend (Recommended: Render or Heroku)
- **Environment Variables**: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` (set to your web app's domain), `NODE_ENV=production`.
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Prisma Migration**: Run `npx prisma migrate deploy` during the build phase.

### Web (Recommended: Vercel or Netlify)
- **Environment Variable**: `VITE_API_URL` (set to your deployed backend URL).
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Mobile (EAS / Expo)
- **Environment Variable**: `EXPO_PUBLIC_API_URL` (set to your deployed backend URL).
- **Android APK Build Command**: `eas build -p android --profile preview`

## Security Notes
- Passwords are systematically hashed with bcrypt before storing.
- JWTs are short-lived/configurable and securely parsed.
- IDOR (Insecure Direct Object Reference) is prevented at the DB query level using strict `userId` bindings on all protected endpoints.
- Mobile stores auth tokens in `SecureStore` instead of insecure Async Storage.
- `helmet`, `cors`, and `express-rate-limit` middlewares defend against standard attack vectors in the backend.

## Troubleshooting
- **Mobile app fails to connect to backend**: Ensure `EXPO_PUBLIC_API_URL` uses your computer's local network IP (e.g. `192.168.x.x`) instead of `localhost` if running on a physical phone. `10.0.2.2` works for Android Emulator.
- **Prisma initialization errors**: Verify `DATABASE_URL` is perfectly correct and the database server is running.
