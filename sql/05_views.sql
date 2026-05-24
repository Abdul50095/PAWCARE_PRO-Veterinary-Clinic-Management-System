-- ============================================================
-- VETERINARY CLINIC — VIEWS
-- ============================================================
USE vet_clinic;

-- 1. Full appointment details with pet, owner, vet names
CREATE OR REPLACE VIEW vw_appointment_details AS
SELECT
    a.appointment_id, a.appointment_date, a.status AS appt_status, a.reason, a.notes AS appt_notes,
    p.name AS pet_name, p.species, p.breed,
    CONCAT(op.first_name,' ',op.last_name) AS owner_name, op.phone AS owner_phone,
    CONCAT(vp.first_name,' ',vp.last_name) AS vet_name, v.specialization
FROM appointment a
JOIN pet p ON a.pet_id = p.pet_id
JOIN owner o ON p.owner_id = o.owner_id
JOIN person op ON o.owner_id = op.person_id
JOIN vet v ON a.vet_id = v.vet_id
JOIN person vp ON v.vet_id = vp.person_id;

-- 2. Pet medical history
CREATE OR REPLACE VIEW vw_pet_medical_history AS
SELECT
    p.pet_id, p.name AS pet_name, p.species,
    mr.record_id, mr.record_date, mr.diagnosis, mr.treatment, mr.record_type,
    CONCAT(vp.first_name,' ',vp.last_name) AS vet_name
FROM pet p
JOIN appointment a ON p.pet_id = a.pet_id
JOIN medical_record mr ON a.appointment_id = mr.appointment_id
JOIN vet v ON a.vet_id = v.vet_id
JOIN person vp ON v.vet_id = vp.person_id
ORDER BY p.pet_id, mr.record_date DESC;

-- 3. Revenue summary by month
CREATE OR REPLACE VIEW vw_revenue_summary AS
SELECT
    DATE_FORMAT(bill_date, '%Y-%m') AS month,
    COUNT(*) AS total_bills,
    SUM(amount) AS total_revenue,
    SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) AS collected,
    SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'Overdue' THEN amount ELSE 0 END) AS overdue
FROM bill
GROUP BY DATE_FORMAT(bill_date, '%Y-%m')
ORDER BY month DESC;

-- 4. Upcoming vaccination schedule
CREATE OR REPLACE VIEW vw_vaccination_schedule AS
SELECT
    v.vaccination_id, p.name AS pet_name, p.species,
    CONCAT(op.first_name,' ',op.last_name) AS owner_name, op.phone AS owner_phone,
    v.name AS vaccine_name, v.date_administered, v.next_due_date,
    DATEDIFF(v.next_due_date, CURDATE()) AS days_until_due
FROM vaccination v
JOIN pet p ON v.pet_id = p.pet_id
JOIN owner o ON p.owner_id = o.owner_id
JOIN person op ON o.owner_id = op.person_id
WHERE v.next_due_date >= CURDATE()
ORDER BY v.next_due_date;

-- 5. Kennel occupancy status
CREATE OR REPLACE VIEW vw_kennel_occupancy AS
SELECT
    cr.room_id, cr.room_number, cr.type, cr.status AS room_status,
    ks.stay_id, p.name AS pet_name,
    CONCAT(op.first_name,' ',op.last_name) AS owner_name,
    ks.check_in_date, ks.check_out_date, ks.daily_rate,
    DATEDIFF(COALESCE(ks.check_out_date, CURDATE()), ks.check_in_date) AS total_days
FROM clinic_room cr
LEFT JOIN kennel_stay ks ON cr.room_id = ks.room_id AND ks.check_out_date IS NULL
LEFT JOIN pet p ON ks.pet_id = p.pet_id
LEFT JOIN owner o ON p.owner_id = o.owner_id
LEFT JOIN person op ON o.owner_id = op.person_id
WHERE cr.type = 'Kennel';

-- 6. Supply inventory alerts (low stock)
CREATE OR REPLACE VIEW vw_low_stock_supplies AS
SELECT supply_id, name, category, quantity, reorder_level, unit_price, supplier,
    CASE WHEN quantity <= reorder_level THEN 'REORDER NOW'
         WHEN quantity <= reorder_level * 1.5 THEN 'LOW STOCK'
         ELSE 'OK' END AS stock_status
FROM supply
ORDER BY (quantity - reorder_level);

-- 7. Vet workload summary
CREATE OR REPLACE VIEW vw_vet_workload AS
SELECT
    CONCAT(vp.first_name,' ',vp.last_name) AS vet_name, v.specialization,
    COUNT(a.appointment_id) AS total_appointments,
    SUM(CASE WHEN a.status='Completed' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN a.status='Scheduled' THEN 1 ELSE 0 END) AS upcoming
FROM vet v
JOIN person vp ON v.vet_id = vp.person_id
LEFT JOIN appointment a ON v.vet_id = a.vet_id
GROUP BY v.vet_id, vp.first_name, vp.last_name, v.specialization;
