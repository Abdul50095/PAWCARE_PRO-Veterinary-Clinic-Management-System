-- ============================================================
-- VETERINARY CLINIC — DATA POPULATION (15+ rows per table)
-- ============================================================
USE vet_clinic;

-- PERSON (30 rows: 15 owners + 15 vets)
INSERT INTO person (first_name, last_name, phone, email, address, person_type) VALUES
('Ahmed','Khan','0301-1234567','ahmed.khan@email.com','12 Gulberg III, Lahore','Owner'),
('Sara','Malik','0312-2345678','sara.malik@email.com','45 DHA Phase 5, Karachi','Owner'),
('Usman','Raza','0333-3456789','usman.raza@email.com','78 F-7, Islamabad','Owner'),
('Fatima','Ali','0345-4567890','fatima.ali@email.com','23 Johar Town, Lahore','Owner'),
('Hassan','Butt','0300-5678901','hassan.butt@email.com','56 Bahria Town, Rawalpindi','Owner'),
('Ayesha','Nawaz','0321-6789012','ayesha.nawaz@email.com','89 Model Town, Lahore','Owner'),
('Bilal','Sheikh','0311-7890123','bilal.sheikh@email.com','34 Clifton, Karachi','Owner'),
('Zara','Hussain','0302-8901234','zara.hussain@email.com','67 G-9, Islamabad','Owner'),
('Omar','Farooq','0334-9012345','omar.farooq@email.com','12 Cantt, Lahore','Owner'),
('Hira','Aslam','0346-0123456','hira.aslam@email.com','45 Satellite Town, Rawalpindi','Owner'),
('Kamran','Iqbal','0303-1112233','kamran.iqbal@email.com','78 Wapda Town, Lahore','Owner'),
('Nadia','Tariq','0315-2223344','nadia.tariq@email.com','23 Gulshan, Karachi','Owner'),
('Rizwan','Ahmad','0336-3334455','rizwan.ahmad@email.com','56 F-10, Islamabad','Owner'),
('Saba','Javed','0347-4445566','saba.javed@email.com','89 Garden Town, Lahore','Owner'),
('Imran','Saeed','0304-5556677','imran.saeed@email.com','34 Askari, Rawalpindi','Owner'),
('Dr. Ali','Raza','0305-1111111','dr.ali@vetclinic.com','Clinic Rd 1, Lahore','Vet'),
('Dr. Sana','Mirza','0316-2222222','dr.sana@vetclinic.com','Clinic Rd 2, Karachi','Vet'),
('Dr. Faisal','Mahmood','0337-3333333','dr.faisal@vetclinic.com','Clinic Rd 3, Islamabad','Vet'),
('Dr. Amna','Shah','0348-4444444','dr.amna@vetclinic.com','Clinic Rd 4, Lahore','Vet'),
('Dr. Tariq','Hussain','0306-5555555','dr.tariq@vetclinic.com','Clinic Rd 5, Rawalpindi','Vet'),
('Dr. Mehwish','Khan','0317-6666666','dr.mehwish@vetclinic.com','Clinic Rd 6, Lahore','Vet'),
('Dr. Hamza','Qureshi','0338-7777777','dr.hamza@vetclinic.com','Clinic Rd 7, Karachi','Vet'),
('Dr. Rabia','Noor','0349-8888888','dr.rabia@vetclinic.com','Clinic Rd 8, Islamabad','Vet'),
('Dr. Waqas','Gill','0307-9999999','dr.waqas@vetclinic.com','Clinic Rd 9, Lahore','Vet'),
('Dr. Hina','Batool','0318-1010101','dr.hina@vetclinic.com','Clinic Rd 10, Karachi','Vet'),
('Dr. Asad','Rana','0339-2020202','dr.asad@vetclinic.com','Clinic Rd 11, Islamabad','Vet'),
('Dr. Nida','Fatima','0340-3030303','dr.nida@vetclinic.com','Clinic Rd 12, Lahore','Vet'),
('Dr. Shahid','Mehmood','0308-4040404','dr.shahid@vetclinic.com','Clinic Rd 13, Rawalpindi','Vet'),
('Dr. Lubna','Akram','0319-5050505','dr.lubna@vetclinic.com','Clinic Rd 14, Lahore','Vet'),
('Dr. Kashif','Zafar','0330-6060606','dr.kashif@vetclinic.com','Clinic Rd 15, Karachi','Vet');

-- OWNER (15 rows, IDs 1-15)
INSERT INTO owner (owner_id, emergency_contact, membership_status) VALUES
(1,'0301-9999999','Premium'),(2,'0312-8888888','Active'),(3,'0333-7777777','Active'),
(4,'0345-6666666','Premium'),(5,'0300-5555555','Inactive'),(6,'0321-4444444','Active'),
(7,'0311-3333333','Premium'),(8,'0302-2222222','Active'),(9,'0334-1111111','Active'),
(10,'0346-0000000','Inactive'),(11,'0303-1234567','Active'),(12,'0315-2345678','Premium'),
(13,'0336-3456789','Active'),(14,'0347-4567890','Active'),(15,'0304-5678901','Inactive');

-- VET (15 rows, IDs 16-30)
INSERT INTO vet (vet_id, specialization, license_number, hire_date) VALUES
(16,'General Practice','VET-LHR-001','2018-03-15'),
(17,'Surgery','VET-KHI-002','2019-07-20'),
(18,'Dermatology','VET-ISB-003','2020-01-10'),
(19,'Dentistry','VET-LHR-004','2017-05-22'),
(20,'Orthopedics','VET-RWP-005','2021-09-01'),
(21,'Cardiology','VET-LHR-006','2016-11-15'),
(22,'Oncology','VET-KHI-007','2022-02-28'),
(23,'Neurology','VET-ISB-008','2019-04-12'),
(24,'Exotic Animals','VET-LHR-009','2020-08-05'),
(25,'Internal Medicine','VET-KHI-010','2018-12-20'),
(26,'Emergency Care','VET-ISB-011','2021-06-30'),
(27,'Avian Medicine','VET-LHR-012','2017-10-18'),
(28,'Rehabilitation','VET-RWP-013','2022-01-05'),
(29,'Ophthalmology','VET-LHR-014','2019-03-25'),
(30,'Radiology','VET-KHI-015','2020-07-14');

-- PET (20 rows)
INSERT INTO pet (name, species, breed, gender, date_of_birth, owner_id) VALUES
('Bruno','Mammal','German Shepherd','Male','2020-05-10',1),
('Bella','Mammal','Persian Cat','Female','2021-03-15',2),
('Rocky','Mammal','Labrador','Male','2019-08-22',3),
('Luna','Mammal','Siamese Cat','Female','2022-01-05',4),
('Max','Mammal','Golden Retriever','Male','2020-11-30',5),
('Coco','Avian','African Grey Parrot','Female','2018-06-20',6),
('Kiwi','Avian','Budgerigar','Male','2021-09-10',7),
('Rex','Reptile','Bearded Dragon','Male','2020-04-15',8),
('Naga','Reptile','Ball Python','Female','2019-12-01',9),
('Milo','Mammal','Poodle','Male','2022-07-18',10),
('Daisy','Mammal','Bulldog','Female','2021-02-28',11),
('Simba','Mammal','Maine Coon','Male','2020-09-12',12),
('Polly','Avian','Cockatiel','Female','2022-04-05',13),
('Spike','Reptile','Iguana','Male','2019-07-25',14),
('Charlie','Mammal','Beagle','Male','2021-06-14',15),
('Zara','Mammal','Husky','Female','2020-03-08',1),
('Leo','Mammal','Ragdoll Cat','Male','2022-08-20',4),
('Tweety','Avian','Canary','Female','2021-11-02',7),
('Scales','Reptile','Leopard Gecko','Male','2022-05-30',9),
('Oscar','Mammal','Dachshund','Male','2019-10-15',12);

-- MAMMAL subtypes
INSERT INTO mammal (pet_id, fur_type, is_neutered) VALUES
(1,'Double Coat',TRUE),(2,'Long Hair',TRUE),(3,'Short Hair',TRUE),
(4,'Short Hair',FALSE),(5,'Long Hair',TRUE),(10,'Curly',TRUE),
(11,'Short Hair',FALSE),(12,'Long Hair',TRUE),(15,'Short Hair',TRUE),
(16,'Double Coat',FALSE),(17,'Semi-Long',TRUE),(20,'Short Hair',TRUE);

-- AVIAN subtypes
INSERT INTO avian (pet_id, wingspan, beak_condition) VALUES
(6,46.00,'Healthy'),(7,18.00,'Slight Overgrowth'),(13,25.00,'Healthy'),(18,20.00,'Healthy');

-- REPTILE subtypes
INSERT INTO reptile (pet_id, venom_status, heat_requirement) VALUES
(8,'Non-venomous','UVB + Basking 38C'),(9,'Non-venomous','Heat Mat 30C'),
(14,'Non-venomous','UVB + Basking 35C'),(19,'Non-venomous','Heat Mat 28C');

-- CLINIC ROOM (15 rows)
INSERT INTO clinic_room (room_number, type, status) VALUES
('EX-101','Examination','Available'),('EX-102','Examination','Occupied'),
('EX-103','Examination','Available'),('SU-201','Surgery','Available'),
('SU-202','Surgery','Maintenance'),('RE-301','Recovery','Available'),
('RE-302','Recovery','Occupied'),('RE-303','Recovery','Available'),
('KN-401','Kennel','Available'),('KN-402','Kennel','Occupied'),
('KN-403','Kennel','Available'),('KN-404','Kennel','Available'),
('KN-405','Kennel','Occupied'),('EX-104','Examination','Available'),
('SU-203','Surgery','Available');

-- APPOINTMENT (20 rows)
INSERT INTO appointment (pet_id, vet_id, appointment_date, status, reason, notes) VALUES
(1,16,'2026-01-15 09:00:00','Completed','Annual Checkup','Healthy, no concerns'),
(2,17,'2026-01-16 10:30:00','Completed','Skin Irritation','Prescribed medicated shampoo'),
(3,18,'2026-01-20 14:00:00','Completed','Vaccination','Rabies booster administered'),
(4,19,'2026-02-01 11:00:00','Completed','Dental Cleaning','Minor tartar removed'),
(5,20,'2026-02-10 09:30:00','Completed','Limping','X-ray ordered, mild sprain'),
(6,24,'2026-02-15 13:00:00','Completed','Feather Plucking','Stress-related, dietary changes recommended'),
(7,27,'2026-02-20 10:00:00','Completed','Beak Trimming','Routine trim completed'),
(8,24,'2026-03-01 15:00:00','Completed','Wellness Check','Weight and vitals normal'),
(9,24,'2026-03-05 11:30:00','Completed','Feeding Issues','Adjusted feeding schedule'),
(10,16,'2026-03-10 09:00:00','Completed','Vaccination','DHPP vaccine administered'),
(11,21,'2026-03-15 14:30:00','Completed','Heart Murmur Follow-up','Echocardiogram performed'),
(12,17,'2026-03-20 10:00:00','Completed','Surgery - Tumor Removal','Successful removal, benign'),
(13,27,'2026-04-01 09:30:00','Completed','Wing Check','No issues found'),
(14,24,'2026-04-05 13:00:00','Completed','Shedding Issues','Normal shedding cycle'),
(15,16,'2026-04-10 11:00:00','Completed','Ear Infection','Prescribed ear drops'),
(1,16,'2026-05-01 09:00:00','Scheduled','Follow-up Checkup',NULL),
(3,20,'2026-05-05 14:00:00','Scheduled','Sprain Follow-up',NULL),
(5,20,'2026-05-10 10:30:00','Scheduled','X-ray Review',NULL),
(10,16,'2026-05-15 09:00:00','Scheduled','Booster Vaccine',NULL),
(2,18,'2026-05-20 11:00:00','Cancelled','Skin Follow-up','Owner rescheduled');

-- PROCEDURES (15 rows)
INSERT INTO procedures (name, description, cost) VALUES
('General Checkup','Complete physical examination',1500.00),
('Vaccination','Standard vaccine administration',800.00),
('Dental Cleaning','Professional teeth cleaning and polishing',3500.00),
('X-Ray','Digital radiograph imaging',2500.00),
('Blood Test','Complete blood count and chemistry panel',2000.00),
('Surgery - Minor','Minor surgical procedure under local anesthesia',8000.00),
('Surgery - Major','Major surgical procedure under general anesthesia',25000.00),
('Ultrasound','Abdominal or cardiac ultrasound',3000.00),
('Microchipping','Implant identification microchip',1200.00),
('Deworming','Internal parasite treatment',500.00),
('Flea Treatment','External parasite treatment and prevention',700.00),
('Ear Treatment','Ear cleaning and medication',1000.00),
('Eye Examination','Comprehensive ophthalmologic exam',1800.00),
('Nail Trimming','Professional nail/claw trimming',400.00),
('Grooming','Full grooming service including bath and trim',2000.00);

-- APPOINTMENT_PROCEDURE (junction — M:N)
INSERT INTO appointment_procedure (appointment_id, procedure_id) VALUES
(1,1),(1,5),(2,1),(2,12),(3,2),(4,3),(5,4),(5,1),(6,1),(6,13),
(7,14),(8,1),(9,1),(10,2),(10,9),(11,8),(11,5),(12,7),(13,1),(14,1),(15,12);

-- VACCINATION (15 rows)
INSERT INTO vaccination (pet_id, vet_id, name, date_administered, next_due_date) VALUES
(1,16,'Rabies','2026-01-15','2027-01-15'),(1,16,'DHPP','2025-06-10','2026-06-10'),
(2,17,'FVRCP','2025-09-20','2026-09-20'),(3,18,'Rabies','2026-01-20','2027-01-20'),
(4,19,'FVRCP','2025-11-05','2026-11-05'),(5,20,'Rabies','2025-08-15','2026-08-15'),
(5,20,'DHPP','2025-08-15','2026-08-15'),(10,16,'DHPP','2026-03-10','2027-03-10'),
(10,16,'Rabies','2025-12-01','2026-12-01'),(11,21,'Rabies','2025-10-20','2026-10-20'),
(15,16,'Rabies','2025-07-14','2026-07-14'),(15,16,'DHPP','2025-07-14','2026-07-14'),
(3,18,'DHPP','2025-05-22','2026-05-22'),(16,16,'Rabies','2025-04-08','2026-04-08'),
(20,25,'Rabies','2025-11-15','2026-11-15');

-- MEDICAL RECORD (15 rows)
INSERT INTO medical_record (appointment_id, diagnosis, treatment, notes, record_date, record_type) VALUES
(1,'Healthy - No Issues','None required','Annual wellness exam passed','2026-01-15','Wellness'),
(2,'Contact Dermatitis','Medicated shampoo, antihistamines','Avoid scented products','2026-01-16','General'),
(3,'Vaccination Due','Rabies booster administered','Next due in 1 year','2026-01-20','General'),
(4,'Mild Periodontal Disease','Dental cleaning, antibiotics','Follow-up in 6 months','2026-02-01','General'),
(5,'Mild Forelimb Sprain','Rest, anti-inflammatory medication','Restrict activity for 2 weeks','2026-02-10','General'),
(6,'Stress-Related Feather Plucking','Dietary supplements, enrichment','Monitor behavior changes','2026-02-15','Wellness'),
(7,'Beak Overgrowth','Beak trimming performed','Schedule next trim in 3 months','2026-02-20','General'),
(8,'Healthy Reptile','None required','Weight and vitals within normal range','2026-03-01','Wellness'),
(9,'Reduced Appetite','Adjusted feeding schedule, vitamin supplement','Monitor food intake','2026-03-05','Wellness'),
(10,'Vaccination Administered','DHPP vaccine + microchip','Microchip ID: MC-2026-0010','2026-03-10','General'),
(11,'Grade II Heart Murmur','Enalapril 0.5mg daily','Echocardiogram shows mild regurgitation','2026-03-15','General'),
(12,'Subcutaneous Lipoma','Surgical excision','Benign tumor confirmed by histopathology','2026-03-20','Surgery'),
(13,'Healthy Wings','None required','No abnormalities detected','2026-04-01','Wellness'),
(14,'Normal Ecdysis','Humidity adjustment recommended','Shedding cycle is within normal parameters','2026-04-05','Wellness'),
(15,'Otitis Externa','Ear drops (Otomax) 2x daily for 10 days','Bacterial infection, right ear','2026-04-10','General');

-- SURGERY_RECORD subtypes
INSERT INTO surgery_record (record_id, anesthesia_type, recovery_time_hours) VALUES
(12,'General - Isoflurane',48);

-- WELLNESS_VISIT subtypes
INSERT INTO wellness_visit (record_id, current_weight, body_score) VALUES
(1,32.50,5),(6,0.45,4),(8,0.38,5),(9,1.20,3),(13,0.09,5),(14,2.10,5);

-- BILL (15 rows)
INSERT INTO bill (appointment_id, amount, status, bill_date, payment_method) VALUES
(1,3500.00,'Paid','2026-01-15','Card'),(2,2500.00,'Paid','2026-01-16','Cash'),
(3,800.00,'Paid','2026-01-20','Online'),(4,3500.00,'Paid','2026-02-01','Card'),
(5,4000.00,'Paid','2026-02-10','Insurance'),(6,3300.00,'Paid','2026-02-15','Card'),
(7,400.00,'Paid','2026-02-20','Cash'),(8,1500.00,'Paid','2026-03-01','Online'),
(9,1500.00,'Paid','2026-03-05','Card'),(10,2000.00,'Paid','2026-03-10','Cash'),
(11,5000.00,'Pending','2026-03-15','Insurance'),(12,25000.00,'Paid','2026-03-20','Insurance'),
(13,1500.00,'Paid','2026-04-01','Card'),(14,1500.00,'Overdue','2026-04-05',NULL),
(15,2000.00,'Pending','2026-04-10','Card');

-- SUPPLY (15 rows)
INSERT INTO supply (name, category, quantity, unit_price, reorder_level, supplier, last_restocked) VALUES
('Amoxicillin 250mg','Medication',200,15.00,50,'PharmaVet Supplies','2026-03-01'),
('Surgical Gloves (Box)','Consumable',50,250.00,20,'MedEquip Pakistan','2026-02-15'),
('Digital Thermometer','Equipment',10,800.00,3,'VetTech Solutions','2025-12-10'),
('Rabies Vaccine (10-dose)','Vaccine',30,1200.00,10,'BioVet Labs','2026-03-20'),
('DHPP Vaccine (10-dose)','Vaccine',25,1500.00,10,'BioVet Labs','2026-03-20'),
('Bandage Rolls','Consumable',100,50.00,30,'MedEquip Pakistan','2026-01-25'),
('Isoflurane 250ml','Medication',8,4500.00,3,'PharmaVet Supplies','2026-02-01'),
('Syringes 5ml (Box/100)','Consumable',40,350.00,15,'MedEquip Pakistan','2026-03-10'),
('Otomax Ear Drops','Medication',35,600.00,10,'PharmaVet Supplies','2026-03-15'),
('Microchip Kit','Equipment',45,400.00,15,'VetTech Solutions','2026-02-20'),
('Flea Collar','Consumable',60,300.00,20,'PetCare Wholesale','2026-03-05'),
('Deworming Tablets','Medication',150,25.00,40,'PharmaVet Supplies','2026-03-01'),
('X-Ray Film (Box)','Consumable',15,2000.00,5,'MedEquip Pakistan','2026-01-10'),
('Surgical Sutures','Consumable',80,150.00,25,'MedEquip Pakistan','2026-02-28'),
('Pet Shampoo (Medicated)','Medication',40,350.00,10,'PetCare Wholesale','2026-03-10');

-- KENNEL_STAY (15 rows)
INSERT INTO kennel_stay (pet_id, room_id, check_in_date, check_out_date, daily_rate) VALUES
(1,9,'2026-01-10','2026-01-13',500.00),(3,10,'2026-01-15','2026-01-20',500.00),
(5,11,'2026-02-01','2026-02-05',500.00),(2,12,'2026-02-10','2026-02-14',600.00),
(4,9,'2026-02-20','2026-02-25',600.00),(10,10,'2026-03-01','2026-03-04',500.00),
(11,11,'2026-03-10','2026-03-15',500.00),(15,12,'2026-03-20','2026-03-23',500.00),
(1,9,'2026-04-01','2026-04-05',500.00),(12,13,'2026-04-10','2026-04-12',600.00),
(16,10,'2026-04-15','2026-04-20',500.00),(20,11,'2026-04-22','2026-04-25',500.00),
(3,9,'2026-05-01','2026-05-05',500.00),(5,10,'2026-05-02',NULL,500.00),
(17,12,'2026-05-05',NULL,600.00);
