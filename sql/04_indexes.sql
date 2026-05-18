-- ============================================================
-- VETERINARY CLINIC — INDEXES
-- ============================================================
USE vet_clinic;

-- Frequently searched: pets by owner
CREATE INDEX idx_pet_owner ON pet(owner_id);

-- Appointment lookups by date, vet, pet, status
CREATE INDEX idx_appt_date ON appointment(appointment_date);
CREATE INDEX idx_appt_vet ON appointment(vet_id);
CREATE INDEX idx_appt_pet ON appointment(pet_id);
CREATE INDEX idx_appt_status ON appointment(status);

-- Bill lookups
CREATE INDEX idx_bill_status ON bill(status);
CREATE INDEX idx_bill_date ON bill(bill_date);
CREATE INDEX idx_bill_appt ON bill(appointment_id);

-- Vaccination schedule
CREATE INDEX idx_vacc_pet ON vaccination(pet_id);
CREATE INDEX idx_vacc_due ON vaccination(next_due_date);

-- Medical records
CREATE INDEX idx_medrec_appt ON medical_record(appointment_id);
CREATE INDEX idx_medrec_date ON medical_record(record_date);

-- Kennel stay
CREATE INDEX idx_kennel_pet ON kennel_stay(pet_id);
CREATE INDEX idx_kennel_room ON kennel_stay(room_id);
CREATE INDEX idx_kennel_checkin ON kennel_stay(check_in_date);

-- Supply inventory
CREATE INDEX idx_supply_category ON supply(category);
CREATE INDEX idx_supply_quantity ON supply(quantity);

-- Person lookup
CREATE INDEX idx_person_type ON person(person_type);
CREATE INDEX idx_person_email ON person(email);
