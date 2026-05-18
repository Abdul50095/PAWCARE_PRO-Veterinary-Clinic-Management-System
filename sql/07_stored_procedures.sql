-- ============================================================
-- VETERINARY CLINIC — STORED PROCEDURES, FUNCTIONS, CURSORS, TRIGGERS
-- MySQL equivalent of PL/SQL programming
-- ============================================================
USE vet_clinic;

DELIMITER //

-- ============================================================
-- TRIGGER 1: Auto-create bill when appointment is completed
-- ============================================================
CREATE TRIGGER trg_auto_bill
AFTER UPDATE ON appointment
FOR EACH ROW
BEGIN
    DECLARE total_cost DECIMAL(10,2) DEFAULT 0;
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        SELECT COALESCE(SUM(pr.cost), 0) INTO total_cost
        FROM appointment_procedure ap
        JOIN procedures pr ON ap.procedure_id = pr.procedure_id
        WHERE ap.appointment_id = NEW.appointment_id;
        IF total_cost = 0 THEN SET total_cost = 1500.00; END IF;
        INSERT INTO bill (appointment_id, amount, status, bill_date, payment_method)
        VALUES (NEW.appointment_id, total_cost, 'Pending', CURDATE(), NULL);
    END IF;
END//

-- ============================================================
-- TRIGGER 2: Audit log for medical record changes
-- ============================================================
CREATE TRIGGER trg_audit_medrec_insert
AFTER INSERT ON medical_record
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, new_values)
    VALUES ('medical_record', 'INSERT', NEW.record_id,
        JSON_OBJECT('diagnosis', NEW.diagnosis, 'treatment', NEW.treatment, 'record_date', NEW.record_date));
END//

CREATE TRIGGER trg_audit_medrec_update
AFTER UPDATE ON medical_record
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values)
    VALUES ('medical_record', 'UPDATE', NEW.record_id,
        JSON_OBJECT('diagnosis', OLD.diagnosis, 'treatment', OLD.treatment),
        JSON_OBJECT('diagnosis', NEW.diagnosis, 'treatment', NEW.treatment));
END//

-- ============================================================
-- TRIGGER 3: Validate appointment — prevent double booking
-- ============================================================
CREATE TRIGGER trg_validate_appointment
BEFORE INSERT ON appointment
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;
    SELECT COUNT(*) INTO conflict_count FROM appointment
    WHERE vet_id = NEW.vet_id
      AND appointment_date = NEW.appointment_date
      AND status NOT IN ('Cancelled');
    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This vet already has an appointment at this time.';
    END IF;
END//

-- ============================================================
-- TRIGGER 4: Update room status on kennel check-in/check-out
-- ============================================================
CREATE TRIGGER trg_kennel_checkin
AFTER INSERT ON kennel_stay
FOR EACH ROW
BEGIN
    UPDATE clinic_room SET status = 'Occupied' WHERE room_id = NEW.room_id;
END//

CREATE TRIGGER trg_kennel_checkout
AFTER UPDATE ON kennel_stay
FOR EACH ROW
BEGIN
    IF NEW.check_out_date IS NOT NULL AND OLD.check_out_date IS NULL THEN
        IF NOT EXISTS (SELECT 1 FROM kennel_stay WHERE room_id = NEW.room_id AND check_out_date IS NULL AND stay_id != NEW.stay_id) THEN
            UPDATE clinic_room SET status = 'Available' WHERE room_id = NEW.room_id;
        END IF;
    END IF;
END//

-- ============================================================
-- FUNCTION: Calculate total bill for an appointment
-- ============================================================
CREATE FUNCTION fn_calculate_bill(p_appointment_id INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total DECIMAL(10,2);
    SELECT COALESCE(SUM(pr.cost), 0) INTO total
    FROM appointment_procedure ap
    JOIN procedures pr ON ap.procedure_id = pr.procedure_id
    WHERE ap.appointment_id = p_appointment_id;
    RETURN total;
END//

-- ============================================================
-- FUNCTION: Get pet age in years
-- ============================================================
CREATE FUNCTION fn_pet_age(p_pet_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE age INT;
    SELECT TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) INTO age
    FROM pet WHERE pet_id = p_pet_id;
    RETURN COALESCE(age, 0);
END//

-- ============================================================
-- STORED PROCEDURE: Schedule an appointment
-- ============================================================
CREATE PROCEDURE sp_schedule_appointment(
    IN p_pet_id INT, IN p_vet_id INT,
    IN p_date DATETIME, IN p_reason VARCHAR(255)
)
BEGIN
    DECLARE v_pet_exists INT;
    DECLARE v_vet_exists INT;
    SELECT COUNT(*) INTO v_pet_exists FROM pet WHERE pet_id = p_pet_id;
    SELECT COUNT(*) INTO v_vet_exists FROM vet WHERE vet_id = p_vet_id;
    IF v_pet_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pet not found.';
    ELSEIF v_vet_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vet not found.';
    ELSE
        INSERT INTO appointment (pet_id, vet_id, appointment_date, status, reason)
        VALUES (p_pet_id, p_vet_id, p_date, 'Scheduled', p_reason);
        SELECT LAST_INSERT_ID() AS new_appointment_id;
    END IF;
END//

-- ============================================================
-- STORED PROCEDURE: Generate monthly revenue report
-- ============================================================
CREATE PROCEDURE sp_monthly_revenue(IN p_year INT, IN p_month INT)
BEGIN
    SELECT DATE_FORMAT(b.bill_date, '%Y-%m-%d') AS bill_date,
        CONCAT(op.first_name,' ',op.last_name) AS owner_name,
        p.name AS pet_name, b.amount, b.status, b.payment_method
    FROM bill b
    JOIN appointment a ON b.appointment_id = a.appointment_id
    JOIN pet p ON a.pet_id = p.pet_id
    JOIN owner o ON p.owner_id = o.owner_id
    JOIN person op ON o.owner_id = op.person_id
    WHERE YEAR(b.bill_date) = p_year AND MONTH(b.bill_date) = p_month
    ORDER BY b.bill_date;

    SELECT COUNT(*) AS total_bills,
        SUM(amount) AS total_revenue,
        SUM(CASE WHEN status='Paid' THEN amount ELSE 0 END) AS collected,
        SUM(CASE WHEN status='Pending' THEN amount ELSE 0 END) AS pending
    FROM bill
    WHERE YEAR(bill_date) = p_year AND MONTH(bill_date) = p_month;
END//

-- ============================================================
-- STORED PROCEDURE with CURSOR: Send vaccination reminders
-- ============================================================
CREATE PROCEDURE sp_vaccination_reminders()
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_pet_name VARCHAR(50);
    DECLARE v_owner_name VARCHAR(100);
    DECLARE v_owner_phone VARCHAR(20);
    DECLARE v_vaccine VARCHAR(100);
    DECLARE v_due_date DATE;
    DECLARE v_days_left INT;

    -- Explicit cursor for overdue/upcoming vaccinations
    DECLARE cur_reminders CURSOR FOR
        SELECT p.name, CONCAT(op.first_name,' ',op.last_name), op.phone,
            v.name, v.next_due_date, DATEDIFF(v.next_due_date, CURDATE())
        FROM vaccination v
        JOIN pet p ON v.pet_id = p.pet_id
        JOIN owner o ON p.owner_id = o.owner_id
        JOIN person op ON o.owner_id = op.person_id
        WHERE v.next_due_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY v.next_due_date;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- Create temp table to store results
    DROP TEMPORARY TABLE IF EXISTS tmp_reminders;
    CREATE TEMPORARY TABLE tmp_reminders (
        pet_name VARCHAR(50), owner_name VARCHAR(100), owner_phone VARCHAR(20),
        vaccine_name VARCHAR(100), due_date DATE, days_until_due INT, urgency VARCHAR(20)
    );

    OPEN cur_reminders;
    read_loop: LOOP
        FETCH cur_reminders INTO v_pet_name, v_owner_name, v_owner_phone, v_vaccine, v_due_date, v_days_left;
        IF v_done THEN LEAVE read_loop; END IF;
        INSERT INTO tmp_reminders VALUES (
            v_pet_name, v_owner_name, v_owner_phone, v_vaccine, v_due_date, v_days_left,
            CASE WHEN v_days_left < 0 THEN 'OVERDUE'
                 WHEN v_days_left <= 7 THEN 'URGENT'
                 ELSE 'UPCOMING' END
        );
    END LOOP;
    CLOSE cur_reminders;

    SELECT * FROM tmp_reminders ORDER BY days_until_due;
    DROP TEMPORARY TABLE IF EXISTS tmp_reminders;
END//

-- ============================================================
-- STORED PROCEDURE: Check-out from kennel and calculate total
-- ============================================================
CREATE PROCEDURE sp_kennel_checkout(IN p_stay_id INT)
BEGIN
    DECLARE v_checkin DATE;
    DECLARE v_rate DECIMAL(8,2);
    DECLARE v_days INT;
    DECLARE v_total DECIMAL(10,2);

    SELECT check_in_date, daily_rate INTO v_checkin, v_rate
    FROM kennel_stay WHERE stay_id = p_stay_id;

    IF v_checkin IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stay not found.';
    END IF;

    SET v_days = DATEDIFF(CURDATE(), v_checkin);
    IF v_days < 1 THEN SET v_days = 1; END IF;
    SET v_total = v_days * v_rate;

    UPDATE kennel_stay SET check_out_date = CURDATE() WHERE stay_id = p_stay_id;
    SELECT p_stay_id AS stay_id, v_days AS total_days, v_rate AS daily_rate, v_total AS total_cost;
END//

-- ============================================================
-- STORED PROCEDURE: Inventory restock alert with cursor
-- ============================================================
CREATE PROCEDURE sp_restock_report()
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_name VARCHAR(100);
    DECLARE v_qty INT;
    DECLARE v_reorder INT;
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_supplier VARCHAR(100);

    DECLARE cur_stock CURSOR FOR
        SELECT name, quantity, reorder_level, unit_price, supplier
        FROM supply WHERE quantity <= reorder_level ORDER BY quantity;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    SELECT '=== LOW STOCK REORDER REPORT ===' AS report_header;

    OPEN cur_stock;
    stock_loop: LOOP
        FETCH cur_stock INTO v_name, v_qty, v_reorder, v_price, v_supplier;
        IF v_done THEN LEAVE stock_loop; END IF;
        SELECT v_name AS item, v_qty AS current_stock, v_reorder AS reorder_at,
            (v_reorder * 2 - v_qty) AS order_quantity,
            (v_reorder * 2 - v_qty) * v_price AS estimated_cost,
            v_supplier AS supplier;
    END LOOP;
    CLOSE cur_stock;
END//

DELIMITER ;
