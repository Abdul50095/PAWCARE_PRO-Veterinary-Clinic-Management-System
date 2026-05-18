# 🐾 Veterinary Clinic Management System

A comprehensive, full-stack database application designed to manage the operations of a modern veterinary clinic. Built as an academic/professional project demonstrating advanced database concepts, RESTful API design, and a responsive frontend interface.

## 🚀 Features

### 🗄️ Advanced Database Architecture
- **Normalized Schema**: 19 tables rigorously designed to 3NF/BCNF standards.
- **Enhanced ERD Implementation**: Handles generalization/specialization hierarchies (e.g., separating Pets into Mammal, Avian, and Reptile; Medical Records into Surgery and Wellness).
- **Advanced SQL Queries**: Implementation of complex joins, correlated/non-correlated subqueries, and set operations (UNION, INTERSECT, EXCEPT).
- **Programmability (PL/SQL equivalent)**:
  - **Triggers**: Automated billing upon appointment completion, double-booking prevention, audit logging.
  - **Stored Procedures**: Automated appointment scheduling, checkout calculation, monthly revenue reports.
  - **Cursors**: Automated vaccination reminders and low-stock inventory alerts.
  - **Functions**: Dynamic age calculation and bill totaling.
- **Security**: Robust Data Control Language (DCL) scripts establishing granular roles (`clinic_admin`, `vet_user`, `receptionist`, `report_viewer`).

### 💻 Full-Stack Web Application
- **Backend**: Node.js & Express REST API managing comprehensive CRUD operations across all entities. MySQL connection pooling for high performance.
- **Frontend**: A modern Single Page Application (SPA) built with Vanilla JavaScript, HTML5, and CSS3. Features a premium dark theme utilizing glassmorphism, responsive data tables, modals, and toast notifications.
- **Dashboard**: Real-time analytical dashboard showing metrics like total revenue, upcoming appointments, kennel occupancy, and low-stock warnings.

## 🛠️ Technology Stack
* **Database**: MySQL 8.0+
* **Backend**: Node.js, Express.js, `mysql2`
* **Frontend**: HTML5, CSS3 (Custom Design System), Vanilla JavaScript

## 📂 Project Structure

```text
├── sql/                        # Database Definition & Scripts
│   ├── 01_ddl_create_tables.sql
│   ├── 02_dcl_permissions.sql
│   ├── 03_data_population.sql
│   ├── 04_indexes.sql
│   ├── 05_views.sql
│   ├── 06_advanced_queries.sql
│   └── 07_stored_procedures.sql
├── server/                     # Node.js Express Backend
│   ├── server.js               # REST API & Database connection
│   └── package.json
├── frontend/                   # Vanilla JS Frontend Client
│   ├── index.html
│   ├── index.css
│   └── app.js
├── EERDqq.drawio               # Enhanced Entity Relationship Diagram
└── Project Manual.pdf          # Initial Project Requirements
```

## ⚙️ Setup & Installation

### 1. Database Setup
1. Open **MySQL Workbench** or your preferred MySQL client.
2. Run the provided combined script (or run the scripts sequentially from `01` to `07` in the `sql/` folder) to create the schema, populate mock data, and initialize the stored procedures.
   *(Note: You can combine `01`, `03`, `04`, `05`, and `07` into a single run to instantly set up the database for the application).*

### 2. Backend Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install the required Node.js dependencies:
   ```bash
   npm install
   ```
3. Update the database credentials:
   Open `server/server.js` and update the MySQL connection pool (around line 17) with your local MySQL `user` and `password`.
   ```javascript
   const pool = mysql.createPool({
     host: 'localhost',
     user: 'root',
     password: 'YOUR_PASSWORD',
     database: 'vet_clinic',
     // ...
   });
   ```

### 3. Run the Application
1. Start the Express server:
   ```bash
   npm start
   # or
   node server.js
   ```
2. Open your web browser and navigate to:
   ```text
   http://localhost:3000
   ```


## 📝 License
This project is open-source and available under the MIT License.
