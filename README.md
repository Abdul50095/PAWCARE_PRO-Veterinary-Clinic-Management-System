# 🐾 PAWCARE Pro — Veterinary Clinic Management System

A full-featured, browser-based veterinary clinic management system built with vanilla HTML, CSS, and JavaScript. PAWCARE Pro provides clinic staff with a unified interface to manage every aspect of day-to-day operations — from patient records and appointments to billing, inventory, and kennel management.

---

## ✨ Features

### 📊 Dashboard
- Live operational overview including total pets, owners, veterinarians, and upcoming appointments
- Real-time revenue tracking and pending billing summary
- Low stock alerts and kennel occupancy at a glance
- Recent appointments feed with status badges

### 👤 Owner Management
- Register and manage pet owner profiles with contact details and emergency contacts
- Membership status tracking (Active, Inactive, Premium)

### 🐕 Pet Management
- Comprehensive pet profiles including species, breed, gender, and date of birth
- Direct association with registered owners

### ⚕️ Veterinarian Management
- Staff directory with specialization, license number, and hire date
- Full contact information management

### 📅 Appointment Scheduling
- Schedule, edit, and track appointments with pet and vet assignment
- Status management: Scheduled, Completed, Cancelled, No-Show
- Appointment notes and reason documentation

### 🔬 Clinical Records
- **Procedures** — Define and price clinical procedures
- **Vaccinations** — Track vaccine administration and upcoming due dates per pet
- **Medical Records** — Detailed diagnosis, treatment, and notes linked to appointments (General, Surgery, Wellness)

### 💳 Billing
- Generate and manage bills linked to appointments
- Payment status tracking: Pending, Paid, Overdue, Cancelled
- Multiple payment methods: Cash, Card, Insurance, Online

### 📦 Inventory & Supplies
- Track medications, equipment, consumables, and vaccines
- Reorder level alerts and supplier management
- Unit pricing and restocking date tracking

### 🏠 Kennel Management
- Manage kennel stays with check-in/check-out dates and daily rates
- Room-level availability linked to clinic room records

### 🚪 Clinic Rooms
- Room directory with type classification: Examination, Surgery, Recovery, Kennel
- Real-time status: Available, Occupied, Maintenance

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Fonts | Google Fonts — Playfair Display, Plus Jakarta Sans |
| API | RESTful backend via `http://localhost:8000/api` |
| Architecture | Single Page Application (SPA) with dynamic routing |

---

## 🚀 Getting Started

### Prerequisites
- A running backend API server at `http://localhost:8000/api`
- Any modern web browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pawcare-pro.git
   cd pawcare-pro
   ```

2. Ensure your backend API is running and accessible at `http://localhost:8000/api`.

3. Open `index.html` in your browser or serve it via a local server:
   ```bash
   # Using Python
   python -m http.server 3000

   # Using Node.js (npx)
   npx serve .
   ```

4. Navigate to `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```
pawcare-pro/
├── index.html       # Application shell and sidebar navigation
├── index.css        # Styling — design tokens, layout, components
└── app.js           # Application logic — routing, CRUD, forms, API calls
```

---

## 🔌 API Endpoints

The frontend consumes the following REST endpoints:

| Endpoint | Description |
|---|---|
| `GET /api/dashboard` | Dashboard statistics |
| `CRUD /api/owners` | Pet owner management |
| `CRUD /api/pets` | Pet profile management |
| `CRUD /api/vets` | Veterinarian management |
| `CRUD /api/appointments` | Appointment scheduling |
| `CRUD /api/procedures` | Clinical procedures |
| `CRUD /api/vaccinations` | Vaccination records |
| `CRUD /api/medical-records` | Medical record management |
| `CRUD /api/bills` | Billing management |
| `CRUD /api/supplies` | Inventory management |
| `CRUD /api/kennel-stays` | Kennel stay management |
| `CRUD /api/clinic-rooms` | Clinic room management |

> Each `CRUD` endpoint supports `GET`, `POST`, `PUT /{id}`, and `DELETE /{id}` operations.

---

## 🎨 Design System

- **Theme:** Warm cream background with deep forest green sidebar and gold accents
- **Typography:** Playfair Display (headings) + Plus Jakarta Sans (body)
- **Responsive:** Adapts to tablet and mobile screen sizes with a collapsible sidebar
- **Animations:** Smooth page transitions, fade-in stats, and row entrance animations

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> Built with care for veterinary professionals who put their patients first. 🐾
