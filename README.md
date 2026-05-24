# PawCare Pro - Veterinary Clinic Management System

PawCare Pro is a full-stack veterinary clinic management system designed to help clinics manage daily operations from one clean dashboard. It includes pet and owner records, veterinarian management, appointments, medical records, billing, inventory, kennel tracking, authentication, and email verification.

The project uses a responsive animated frontend, an Express.js REST API, and a MySQL database. It is prepared for deployment with Vercel for the frontend and Railway for the backend and database.

## Live Deployment

- Frontend: https://pawcarepro.vercel.app
- Backend API: https://pawcarepro.up.railway.app
- Health Check: https://pawcarepro.up.railway.app/api/health

## Features

- Secure login and account registration
- Automated email verification for new users
- Password visibility toggle on the login screen
- Dynamic dashboard with clinic statistics
- Animated, responsive user interface
- Retractable sidebar navigation
- Pet owner management
- Pet records and species classification
- Veterinarian records and specializations
- Appointment scheduling and tracking
- Procedures and vaccination records
- Medical record management
- Billing and payment status tracking
- Inventory and low-stock monitoring
- Kennel room and occupancy tracking
- Protected API routes using JWT authentication
- MySQL schema, sample data, views, indexes, and stored procedures

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Lucide icons
- Responsive custom UI
- Vercel static deployment

### Backend

- Node.js
- Express.js
- MySQL2
- JWT-style token authentication using Node crypto
- Resend API for automated verification emails
- Railway backend deployment

### Database

- MySQL
- Railway MySQL
- SQL scripts for schema, data, views, indexes, permissions, and stored procedures

## Project Structure

```text
PAWCARE_PRO-Veterinary-Clinic-Management-System/
├── frontend/
│   ├── assets/
│   │   └── login-background.png
│   ├── app.js
│   ├── config.js
│   ├── index.css
│   ├── index.html
│   └── vercel.json
├── server/
│   ├── package.json
│   ├── railway.json
│   ├── server.js
│   └── .env.example
├── sql/
│   ├── 00complete.sql
│   ├── 01_ddl_create_tables.sql
│   ├── 02_dcl_permissions.sql
│   ├── 03_data_population.sql
│   ├── 04_indexes.sql
│   ├── 05_views.sql
│   ├── 06_advanced_queries.sql
│   └── 07_stored_procedures.sql
├── DEPLOYMENT.md
├── README.md
└── .gitignore
```

## Getting Started Locally

### Prerequisites

- Node.js 20 or newer
- MySQL Server
- MySQL Workbench or another MySQL client
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Abdul50095/PAWCARE_PRO-Veterinary-Clinic-Management-System.git
cd PAWCARE_PRO-Veterinary-Clinic-Management-System
```

### 2. Import the Database

Create a MySQL database and import the complete SQL script:

```sql
CREATE DATABASE IF NOT EXISTS vet_clinic;
USE vet_clinic;
```

Then run:

```text
sql/00complete.sql
```

This script contains the database schema and the supporting database objects needed by the application.

### 3. Configure the Backend

Go to the server directory:

```bash
cd server
npm install
```

Create a `.env` file using `.env.example` as a reference:

```env
PORT=8000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vet_clinic

CORS_ORIGIN=http://localhost:8000,http://127.0.0.1:5178
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_SECONDS=28800

ALLOW_REGISTRATION=true
VERIFY_EMAIL_EXPIRES_SECONDS=86400
PUBLIC_APP_URL=http://127.0.0.1:5178

RESEND_API_KEY=
EMAIL_FROM=PawCare Pro <onboarding@resend.dev>

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisPassword123!
```

Start the backend:

```bash
npm start
```

The API should be available at:

```text
http://localhost:8000/api/health
```

### 4. Configure the Frontend

For local development, update `frontend/config.js`:

```js
window.PAWCARE_API_URL = 'http://localhost:8000/api';
```

Then open `frontend/index.html` in a browser or serve the frontend with a local static server.

## Authentication

PawCare Pro includes a simple authentication system with:

- Admin account seeding through environment variables
- User registration
- Email verification token generation
- Login with verified accounts
- Protected clinic API routes

For production registration, configure `RESEND_API_KEY` and a valid `EMAIL_FROM` sender. Without email configuration, new users cannot complete automated verification.

## Deployment

### Backend and Database on Railway

1. Create a Railway project.
2. Add a MySQL service.
3. Import the database SQL into the Railway MySQL database.
4. Add a backend service from the GitHub repository.
5. Set the backend root directory to `server`.
6. Add the required backend environment variables.
7. Generate a public Railway domain for the backend.

Required backend variables:

```env
JWT_SECRET=replace_with_a_long_random_secret
ALLOW_REGISTRATION=true
VERIFY_EMAIL_EXPIRES_SECONDS=86400
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisPassword123!
PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
CORS_ORIGIN=https://your-vercel-domain.vercel.app
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=PawCare Pro <onboarding@resend.dev>
```

Railway MySQL variables should also be available to the backend:

```env
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
```

### Frontend on Vercel

1. Import the GitHub repository into Vercel.
2. Set the root directory to `frontend`.
3. Use `Other` as the framework preset.
4. Leave build and output commands empty for the static frontend.
5. Deploy the project.

For production, `frontend/config.js` should point to the Railway API:

```js
window.PAWCARE_API_URL = 'https://your-railway-backend.up.railway.app/api';
```

After Vercel deploys, update Railway:

```env
PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

## API Overview

Main API groups include:

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/verify-email`
- `/api/auth/resend-verification`
- `/api/dashboard`
- `/api/owners`
- `/api/pets`
- `/api/vets`
- `/api/appointments`
- `/api/procedures`
- `/api/vaccinations`
- `/api/medical-records`
- `/api/bills`
- `/api/supplies`
- `/api/kennel-stays`
- `/api/clinic-rooms`
- `/api/views/*`

Most clinic routes require an authenticated request.

## Security Notes

- Do not commit `.env` files.
- Use a strong `JWT_SECRET` in production.
- Use a strong admin password.
- Restrict `CORS_ORIGIN` to the deployed frontend URL.
- Keep database credentials inside Railway or local environment variables only.
- Configure Resend with a verified sender/domain for reliable production email delivery.

## Author

Developed by Abdul Rehman as a Database Lab project.

## License

This project is intended for academic and portfolio use. Add a license file if you plan to distribute or reuse it publicly.
