-- ============================================================
-- VETERINARY CLINIC — DCL (Data Control Language)
-- ============================================================
USE vet_clinic;

-- Create Users
CREATE USER IF NOT EXISTS 'clinic_admin'@'localhost' IDENTIFIED BY 'Admin@Vet2026';
CREATE USER IF NOT EXISTS 'vet_user'@'localhost' IDENTIFIED BY 'Vet@User2026';
CREATE USER IF NOT EXISTS 'receptionist'@'localhost' IDENTIFIED BY 'Recep@2026';
CREATE USER IF NOT EXISTS 'report_viewer'@'localhost' IDENTIFIED BY 'Report@2026';

-- Admin: Full privileges
GRANT ALL PRIVILEGES ON vet_clinic.* TO 'clinic_admin'@'localhost';

-- Vet: Clinical tables
GRANT SELECT, INSERT, UPDATE ON vet_clinic.pet TO 'vet_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.appointment TO 'vet_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.medical_record TO 'vet_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.surgery_record TO 'vet_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.wellness_visit TO 'vet_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.vaccination TO 'vet_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.procedures TO 'vet_user'@'localhost';
GRANT SELECT ON vet_clinic.owner TO 'vet_user'@'localhost';
GRANT SELECT ON vet_clinic.person TO 'vet_user'@'localhost';

-- Receptionist: Appointments, billing, owners
GRANT SELECT, INSERT, UPDATE ON vet_clinic.person TO 'receptionist'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.owner TO 'receptionist'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.pet TO 'receptionist'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.appointment TO 'receptionist'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.bill TO 'receptionist'@'localhost';
GRANT SELECT, INSERT, UPDATE ON vet_clinic.kennel_stay TO 'receptionist'@'localhost';
GRANT SELECT ON vet_clinic.vet TO 'receptionist'@'localhost';
GRANT SELECT ON vet_clinic.clinic_room TO 'receptionist'@'localhost';

-- Report Viewer: Read-only
GRANT SELECT ON vet_clinic.* TO 'report_viewer'@'localhost';

-- Revoke sensitive operations
REVOKE DELETE ON vet_clinic.medical_record FROM 'receptionist'@'localhost';
REVOKE DELETE ON vet_clinic.person FROM 'receptionist'@'localhost';

FLUSH PRIVILEGES;
