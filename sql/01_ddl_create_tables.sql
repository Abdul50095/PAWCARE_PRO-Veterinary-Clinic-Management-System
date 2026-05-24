-- ============================================================
-- VETERINARY CLINIC DATABASE — DDL (Data Definition Language)
-- Database Engine: MySQL 8.x
-- ============================================================
-- This script creates all tables for the Veterinary Clinic
-- Management System, including EERD specialization/generalization
-- hierarchies and junction tables.
-- ============================================================

CREATE DATABASE IF NOT EXISTS vet_clinic;
USE vet_clinic;

-- ============================================================
-- 1. PERSON (Supertype for Owner and Vet — Generalization)
-- ============================================================
CREATE TABLE person (
    person_id   INT AUTO_INCREMENT PRIMARY KEY,
    first_name  VARCHAR(50)  NOT NULL,
    last_name   VARCHAR(50)  NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    address     VARCHAR(255),
    person_type ENUM('Owner', 'Vet') NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. OWNER (Subtype of Person — Specialization)
-- ============================================================
CREATE TABLE owner (
    owner_id          INT PRIMARY KEY,
    emergency_contact VARCHAR(20),
    membership_status ENUM('Active', 'Inactive', 'Premium') NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_owner_person FOREIGN KEY (owner_id) REFERENCES person(person_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 3. VET / VETERINARIAN (Subtype of Person — Specialization)
-- ============================================================
CREATE TABLE vet (
    vet_id         INT PRIMARY KEY,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50)  NOT NULL UNIQUE,
    hire_date      DATE         NOT NULL,
    CONSTRAINT fk_vet_person FOREIGN KEY (vet_id) REFERENCES person(person_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 4. PET (Supertype for Mammal, Avian, Reptile)
-- ============================================================
CREATE TABLE pet (
    pet_id        INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(50)  NOT NULL,
    species       ENUM('Mammal', 'Avian', 'Reptile') NOT NULL,
    breed         VARCHAR(50),
    gender        ENUM('Male', 'Female') NOT NULL,
    date_of_birth DATE,
    owner_id      INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pet_owner FOREIGN KEY (owner_id) REFERENCES owner(owner_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 5. MAMMAL (Subtype of Pet — Disjoint Specialization)
-- ============================================================
CREATE TABLE mammal (
    pet_id     INT PRIMARY KEY,
    fur_type   VARCHAR(30),
    is_neutered BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_mammal_pet FOREIGN KEY (pet_id) REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 6. AVIAN (Subtype of Pet — Disjoint Specialization)
-- ============================================================
CREATE TABLE avian (
    pet_id         INT PRIMARY KEY,
    wingspan       DECIMAL(5,2),
    beak_condition VARCHAR(50),
    CONSTRAINT fk_avian_pet FOREIGN KEY (pet_id) REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 7. REPTILE (Subtype of Pet — Disjoint Specialization)
-- ============================================================
CREATE TABLE reptile (
    pet_id           INT PRIMARY KEY,
    venom_status     VARCHAR(30),
    heat_requirement VARCHAR(50),
    CONSTRAINT fk_reptile_pet FOREIGN KEY (pet_id) REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 8. CLINIC ROOM
-- ============================================================
CREATE TABLE clinic_room (
    room_id     INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL UNIQUE,
    type        ENUM('Examination', 'Surgery', 'Recovery', 'Kennel') NOT NULL,
    status      ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available'
);

-- ============================================================
-- 9. APPOINTMENT
-- ============================================================
CREATE TABLE appointment (
    appointment_id   INT AUTO_INCREMENT PRIMARY KEY,
    pet_id           INT  NOT NULL,
    vet_id           INT  NOT NULL,
    appointment_date DATETIME NOT NULL,
    status           ENUM('Scheduled', 'Completed', 'Cancelled', 'No-Show') NOT NULL DEFAULT 'Scheduled',
    reason           VARCHAR(255),
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appt_pet FOREIGN KEY (pet_id) REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_appt_vet FOREIGN KEY (vet_id) REFERENCES vet(vet_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 10. PROCEDURES (medical procedures catalog)
-- ============================================================
CREATE TABLE procedures (
    procedure_id INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    cost         DECIMAL(10,2) NOT NULL CHECK (cost >= 0)
);

-- ============================================================
-- 11. APPOINTMENT_PROCEDURE (M:N Junction Table)
-- ============================================================
CREATE TABLE appointment_procedure (
    appointment_id INT NOT NULL,
    procedure_id   INT NOT NULL,
    PRIMARY KEY (appointment_id, procedure_id),
    CONSTRAINT fk_ap_appointment FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ap_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(procedure_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 12. VACCINATION
-- ============================================================
CREATE TABLE vaccination (
    vaccination_id   INT AUTO_INCREMENT PRIMARY KEY,
    pet_id           INT NOT NULL,
    vet_id           INT NOT NULL,
    name             VARCHAR(100) NOT NULL,
    date_administered DATE NOT NULL,
    next_due_date    DATE,
    CONSTRAINT fk_vacc_pet FOREIGN KEY (pet_id) REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vacc_vet FOREIGN KEY (vet_id) REFERENCES vet(vet_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 13. MEDICAL RECORD (Supertype for Surgery/Wellness)
-- ============================================================
CREATE TABLE medical_record (
    record_id      INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    diagnosis      TEXT,
    treatment      TEXT,
    notes          TEXT,
    record_date    DATE NOT NULL,
    record_type    ENUM('Surgery', 'Wellness', 'General') NOT NULL DEFAULT 'General',
    CONSTRAINT fk_medrec_appt FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 14. SURGERY RECORD (Subtype of Medical Record)
-- ============================================================
CREATE TABLE surgery_record (
    record_id          INT PRIMARY KEY,
    anesthesia_type    VARCHAR(50),
    recovery_time_hours INT,
    CONSTRAINT fk_surgery_medrec FOREIGN KEY (record_id) REFERENCES medical_record(record_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 15. WELLNESS VISIT (Subtype of Medical Record)
-- ============================================================
CREATE TABLE wellness_visit (
    record_id      INT PRIMARY KEY,
    current_weight DECIMAL(6,2),
    body_score     INT CHECK (body_score BETWEEN 1 AND 9),
    CONSTRAINT fk_wellness_medrec FOREIGN KEY (record_id) REFERENCES medical_record(record_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 16. BILL
-- ============================================================
CREATE TABLE bill (
    bill_id        INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    amount         DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status         ENUM('Pending', 'Paid', 'Overdue', 'Cancelled') NOT NULL DEFAULT 'Pending',
    bill_date      DATE NOT NULL,
    payment_method ENUM('Cash', 'Card', 'Insurance', 'Online') DEFAULT NULL,
    CONSTRAINT fk_bill_appt FOREIGN KEY (appointment_id) REFERENCES appointment(appointment_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================
-- 17. SUPPLY (Inventory Management)
-- ============================================================
CREATE TABLE supply (
    supply_id     INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    category      ENUM('Medication', 'Equipment', 'Consumable', 'Vaccine') NOT NULL,
    quantity      INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_price    DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    reorder_level INT NOT NULL DEFAULT 10,
    supplier      VARCHAR(100),
    last_restocked DATE
);

-- ============================================================
-- 18. KENNEL STAY
-- ============================================================
CREATE TABLE kennel_stay (
    stay_id        INT AUTO_INCREMENT PRIMARY KEY,
    pet_id         INT NOT NULL,
    room_id        INT NOT NULL,
    check_in_date  DATE NOT NULL,
    check_out_date DATE,
    daily_rate     DECIMAL(8,2) NOT NULL CHECK (daily_rate >= 0),
    CONSTRAINT fk_kennel_pet FOREIGN KEY (pet_id) REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_kennel_room FOREIGN KEY (room_id) REFERENCES clinic_room(room_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_kennel_dates CHECK (check_out_date IS NULL OR check_out_date >= check_in_date)
);

-- ============================================================
-- 19. AUDIT LOG (for trigger-based auditing)
-- ============================================================
CREATE TABLE audit_log (
    log_id      INT AUTO_INCREMENT PRIMARY KEY,
    table_name  VARCHAR(50)  NOT NULL,
    operation   ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    record_id   INT,
    old_values  JSON,
    new_values  JSON,
    changed_by  VARCHAR(100) DEFAULT (CURRENT_USER()),
    changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- End of DDL Script
-- ============================================================
