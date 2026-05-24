# PawCare Pro Deployment Guide

Deploy in this order:

1. Railway MySQL database
2. Railway backend API
3. Vercel frontend
4. Final Railway environment update

## 1. Create Railway MySQL

1. Go to Railway and create a new project.
2. Add a MySQL database service.
3. Import the database using `sql/00complete.sql`.

The backend supports Railway MySQL variables automatically:

- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`

## 2. Deploy Backend On Railway

Create a Railway service from this GitHub repo.

Use:

```txt
Root Directory: server
Start Command: npm start
```

Add these variables to the Railway backend service:

```env
JWT_SECRET=replace_with_a_long_random_secret
ALLOW_REGISTRATION=true
VERIFY_EMAIL_EXPIRES_SECONDS=86400

ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_strong_admin_password

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=PawCare Pro <onboarding@resend.dev>
```

After deploy, generate a public Railway domain for the backend. It will look similar to:

```txt
https://your-backend.up.railway.app
```

## 3. Deploy Frontend On Vercel

Before deploying frontend, update `frontend/config.js`:

```js
window.PAWCARE_API_URL = 'https://your-backend.up.railway.app/api';
```

Then import this GitHub repo in Vercel.

Use:

```txt
Root Directory: frontend
Framework Preset: Other
Build Command: leave empty
Output Directory: leave empty
```

Deploy the frontend and copy the Vercel URL.

## 4. Final Backend Environment Update

After Vercel gives you the frontend URL, update the Railway backend variables:

```env
PUBLIC_APP_URL=https://your-vercel-site.vercel.app
CORS_ORIGIN=https://your-vercel-site.vercel.app
```

Redeploy the Railway backend.

## 5. Verify

Open the Vercel frontend and test:

1. Register a new account.
2. Confirm that the verification email arrives.
3. Open the verification link.
4. Sign in.
5. Confirm dashboard data loads.

## Notes

- Do not commit `server/.env`.
- `server/.env.example` is safe to commit.
- Registration requires `RESEND_API_KEY`; without it, the backend refuses to register users because verification email cannot be sent automatically.
