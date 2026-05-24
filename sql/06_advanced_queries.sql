-- ============================================================
-- VETERINARY CLINIC — ADVANCED QUERIES
-- Demonstrates: Joins, Subqueries, Set Operations, Aggregation
-- ============================================================
USE vet_clinic;

-- ============================================================
-- INNER JOINS
-- ============================================================

-- Q1: All appointments with pet name, owner name, and vet name
SELECT a.appointment_id, a.appointment_date, a.status,
    p.name AS pet_name, CONCAT(op.first_name,' ',op.last_name) AS owner_name,
    CONCAT(vp.first_name,' ',vp.last_name) AS vet_name
FROM appointment a
INNER JOIN pet p ON a.pet_id = p.pet_id
INNER JOIN owner o ON p.owner_id = o.owner_id
INNER JOIN person op ON o.owner_id = op.person_id
INNER JOIN vet v ON a.vet_id = v.vet_id
INNER JOIN person vp ON v.vet_id = vp.person_id
ORDER BY a.appointment_date DESC;

-- Q2: Procedures performed per appointment with costs
SELECT a.appointment_id, a.appointment_date, pr.name AS procedure_name, pr.cost
FROM appointment a
INNER JOIN appointment_procedure ap ON a.appointment_id = ap.appointment_id
INNER JOIN procedures pr ON ap.procedure_id = pr.procedure_id
ORDER BY a.appointment_id;

-- ============================================================
-- LEFT / RIGHT OUTER JOINS
-- ============================================================

-- Q3: All pets with their vaccination count (LEFT JOIN — includes unvaccinated pets)
SELECT p.pet_id, p.name, p.species, COUNT(v.vaccination_id) AS vaccination_count
FROM pet p
LEFT JOIN vaccination v ON p.pet_id = v.pet_id
GROUP BY p.pet_id, p.name, p.species
ORDER BY vaccination_count DESC;

-- Q4: All clinic rooms with current occupant (LEFT JOIN)
SELECT cr.room_number, cr.type, cr.status,
    p.name AS current_pet, ks.check_in_date
FROM clinic_room cr
LEFT JOIN kennel_stay ks ON cr.room_id = ks.room_id AND ks.check_out_date IS NULL
LEFT JOIN pet p ON ks.pet_id = p.pet_id;

-- Q5: All vets with appointment counts (RIGHT JOIN from appointment to vet)
SELECT CONCAT(vp.first_name,' ',vp.last_name) AS vet_name, v.specialization,
    COUNT(a.appointment_id) AS total_appointments
FROM appointment a
RIGHT JOIN vet v ON a.vet_id = v.vet_id
RIGHT JOIN person vp ON v.vet_id = vp.person_id
GROUP BY v.vet_id, vp.first_name, vp.last_name, v.specialization;

-- ============================================================
-- FULL OUTER JOIN (MySQL emulation with UNION)
-- ============================================================

-- Q6: Full join between pets and kennel stays
SELECT p.pet_id, p.name AS pet_name, ks.stay_id, ks.check_in_date, ks.check_out_date
FROM pet p LEFT JOIN kennel_stay ks ON p.pet_id = ks.pet_id
UNION
SELECT p.pet_id, p.name, ks.stay_id, ks.check_in_date, ks.check_out_date
FROM pet p RIGHT JOIN kennel_stay ks ON p.pet_id = ks.pet_id;

-- ============================================================
-- SET OPERATIONS: UNION, INTERSECT, EXCEPT (MINUS)
-- ============================================================

-- Q7: UNION — All people (owners and vets) with their roles
SELECT CONCAT(first_name,' ',last_name) AS full_name, phone, 'Owner' AS role
FROM person WHERE person_type = 'Owner'
UNION
SELECT CONCAT(first_name,' ',last_name), phone, 'Veterinarian'
FROM person WHERE person_type = 'Vet';

-- Q8: INTERSECT — Pets that have BOTH vaccinations AND appointments
SELECT p.pet_id, p.name FROM pet p
JOIN vaccination v ON p.pet_id = v.pet_id
INTERSECT
SELECT p.pet_id, p.name FROM pet p
JOIN appointment a ON p.pet_id = a.pet_id;

-- Q9: EXCEPT (MINUS) — Pets with appointments but NO kennel stays
SELECT p.pet_id, p.name FROM pet p
JOIN appointment a ON p.pet_id = a.pet_id
EXCEPT
SELECT p.pet_id, p.name FROM pet p
JOIN kennel_stay ks ON p.pet_id = ks.pet_id;

-- ============================================================
-- CORRELATED SUBQUERIES
-- ============================================================

-- Q10: Owners whose pets have more appointments than average
SELECT CONCAT(op.first_name,' ',op.last_name) AS owner_name, p.name AS pet_name,
    (SELECT COUNT(*) FROM appointment a WHERE a.pet_id = p.pet_id) AS appt_count
FROM pet p
JOIN person op ON p.owner_id = op.person_id
WHERE (SELECT COUNT(*) FROM appointment a WHERE a.pet_id = p.pet_id) >
    (SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM appointment GROUP BY pet_id) AS avg_tbl);

-- Q11: Vets who have performed surgeries (correlated EXISTS)
SELECT CONCAT(vp.first_name,' ',vp.last_name) AS vet_name, v.specialization
FROM vet v
JOIN person vp ON v.vet_id = vp.person_id
WHERE EXISTS (
    SELECT 1 FROM appointment a
    JOIN medical_record mr ON a.appointment_id = mr.appointment_id
    WHERE a.vet_id = v.vet_id AND mr.record_type = 'Surgery'
);

-- ============================================================
-- NON-CORRELATED SUBQUERIES
-- ============================================================

-- Q12: Pets that have never been vaccinated
SELECT pet_id, name, species FROM pet
WHERE pet_id NOT IN (SELECT DISTINCT pet_id FROM vaccination);

-- Q13: Most expensive appointment (total procedure cost)
SELECT a.appointment_id, a.appointment_date, SUM(pr.cost) AS total_cost
FROM appointment a
JOIN appointment_procedure ap ON a.appointment_id = ap.appointment_id
JOIN procedures pr ON ap.procedure_id = pr.procedure_id
GROUP BY a.appointment_id, a.appointment_date
HAVING SUM(pr.cost) = (
    SELECT MAX(total) FROM (
        SELECT SUM(pr2.cost) AS total
        FROM appointment_procedure ap2
        JOIN procedures pr2 ON ap2.procedure_id = pr2.procedure_id
        GROUP BY ap2.appointment_id
    ) AS max_tbl
);

-- ============================================================
-- AGGREGATION & GROUP BY
-- ============================================================

-- Q14: Revenue breakdown by payment method
SELECT payment_method, COUNT(*) AS bill_count, SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount, MIN(amount) AS min_bill, MAX(amount) AS max_bill
FROM bill WHERE status = 'Paid'
GROUP BY payment_method ORDER BY total_amount DESC;

-- Q15: Species distribution with pet count
SELECT species, gender, COUNT(*) AS count FROM pet
GROUP BY species, gender WITH ROLLUP;

-- Q16: Monthly appointment trend
SELECT DATE_FORMAT(appointment_date, '%Y-%m') AS month,
    COUNT(*) AS total, SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) AS cancelled
FROM appointment GROUP BY DATE_FORMAT(appointment_date, '%Y-%m') ORDER BY month;

-- Q17: Top 5 most common procedures
SELECT pr.name, COUNT(*) AS times_performed, pr.cost,
    COUNT(*) * pr.cost AS total_revenue
FROM appointment_procedure ap
JOIN procedures pr ON ap.procedure_id = pr.procedure_id
GROUP BY pr.procedure_id, pr.name, pr.cost
ORDER BY times_performed DESC LIMIT 5;

-- Q18: Supplies below reorder level with total restock cost estimate
SELECT name, category, quantity, reorder_level,
    (reorder_level * 2 - quantity) AS units_to_order,
    (reorder_level * 2 - quantity) * unit_price AS estimated_cost
FROM supply WHERE quantity <= reorder_level ORDER BY quantity;
