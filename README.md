# PawCare Pro - Veterinary Clinic Management System

PawCare Pro is a veterinary clinic management project with a static frontend, an Express API, and a MySQL database.

## Project Structure

- `frontend/` - HTML, CSS, JavaScript, UI assets, and frontend deployment config.
- `server/` - Express + MySQL backend API.
- `sql/` - database schema, sample data, views, indexes, and procedures.

## Local Setup

1. Install Node.js and MySQL.
2. Import `sql/00complete.sql` into MySQL.
3. Copy `server/.env.example` to `server/.env`.
4. Fill in your local database credentials and auth settings in `server/.env`.
5. Start the backend:

```powershell
cd server
npm install
npm start
```

6. Open `frontend/index.html` through a local static server. The default `frontend/config.js` points to:

```js
window.PAWCARE_API_URL = 'http://localhost:8000/api';
```

## Deployment

Recommended deployment:

- Backend + MySQL: Railway
- Frontend: Vercel
- Email verification: Resend

Read `DEPLOYMENT.md` for the full step-by-step deployment checklist.
