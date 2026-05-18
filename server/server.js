// ============================================================
// VETERINARY CLINIC — Express Server + MySQL REST API
// ============================================================
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================================
// MySQL Connection Pool
// ============================================================
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Mani50095',
  database: 'vet_clinic',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

// Helper: execute query
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params || []);
  return rows;
}
console.log("hjhjh");
// ============================================================
// DASHBOARD STATS
// ============================================================
app.get('/api/dashboard', async (req, res) => {
  console.log('Fetching dashboard stats...');
  try {
    const [pets] = await pool.execute('SELECT COUNT(*) as count FROM pet');
    const [owners] = await pool.execute('SELECT COUNT(*) as count FROM owner');
    const [vets] = await pool.execute('SELECT COUNT(*) as count FROM vet');
    const [appts] = await pool.execute("SELECT COUNT(*) as count FROM appointment WHERE status='Scheduled'");
    const [revenue] = await pool.execute("SELECT COALESCE(SUM(amount),0) as total FROM bill WHERE status='Paid'");
    const [pending] = await pool.execute("SELECT COALESCE(SUM(amount),0) as total FROM bill WHERE status='Pending'");
    const [lowStock] = await pool.execute('SELECT COUNT(*) as count FROM supply WHERE quantity <= reorder_level');
    const [kennelOccupied] = await pool.execute("SELECT COUNT(*) as count FROM clinic_room WHERE type='Kennel' AND status='Occupied'");
    const [recentAppts] = await pool.execute(`
      SELECT a.appointment_id, a.appointment_date, a.status, a.reason,
        p.name as pet_name, CONCAT(vp.first_name,' ',vp.last_name) as vet_name
      FROM appointment a
      JOIN pet p ON a.pet_id=p.pet_id
      JOIN vet v ON a.vet_id=v.vet_id
      JOIN person vp ON v.vet_id=vp.person_id
      ORDER BY a.appointment_date DESC LIMIT 5
    `);
    
    res.json({
      totalPets: pets[0].count, totalOwners: owners[0].count,
      totalVets: vets[0].count, upcomingAppointments: appts[0].count,
      totalRevenue: revenue[0].total, pendingBills: pending[0].total,
      lowStockItems: lowStock[0].count, kennelOccupied: kennelOccupied[0].count,
      recentAppointments: recentAppts
    });
    console.log(res);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// OWNERS (CRUD) — joined with person table
// ============================================================
app.get('/api/owners', async (req, res) => {
  try {
    const rows = await query(`
      SELECT o.owner_id, p.first_name, p.last_name, p.phone, p.email, p.address,
        o.emergency_contact, o.membership_status
      FROM owner o JOIN person p ON o.owner_id = p.person_id ORDER BY p.first_name`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/owners', async (req, res) => {
  try {
    const { first_name, last_name, phone, email, address, emergency_contact, membership_status } = req.body;
    const [r] = await pool.execute(
      'INSERT INTO person (first_name,last_name,phone,email,address,person_type) VALUES (?,?,?,?,?,?)',
      [first_name, last_name, phone, email, address, 'Owner']);
    await pool.execute('INSERT INTO owner (owner_id,emergency_contact,membership_status) VALUES (?,?,?)',
      [r.insertId, emergency_contact || null, membership_status || 'Active']);
    res.json({ id: r.insertId, message: 'Owner created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/owners/:id', async (req, res) => {
  try {
    const { first_name, last_name, phone, email, address, emergency_contact, membership_status } = req.body;
    await pool.execute('UPDATE person SET first_name=?,last_name=?,phone=?,email=?,address=? WHERE person_id=?',
      [first_name, last_name, phone, email, address, req.params.id]);
    await pool.execute('UPDATE owner SET emergency_contact=?,membership_status=? WHERE owner_id=?',
      [emergency_contact, membership_status, req.params.id]);
    res.json({ message: 'Owner updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/owners/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM person WHERE person_id=?', [req.params.id]);
    res.json({ message: 'Owner deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// PETS (CRUD)
// ============================================================
app.get('/api/pets', async (req, res) => {
  try {
    const rows = await query(`
      SELECT p.*, CONCAT(per.first_name,' ',per.last_name) as owner_name
      FROM pet p JOIN owner o ON p.owner_id=o.owner_id
      JOIN person per ON o.owner_id=per.person_id ORDER BY p.name`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/pets', async (req, res) => {
  try {
    const { name, species, breed, gender, date_of_birth, owner_id } = req.body;
    const [r] = await pool.execute(
      'INSERT INTO pet (name,species,breed,gender,date_of_birth,owner_id) VALUES (?,?,?,?,?,?)',
      [name, species, breed, gender, date_of_birth || null, owner_id]);
    res.json({ id: r.insertId, message: 'Pet created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/pets/:id', async (req, res) => {
  try {
    const { name, species, breed, gender, date_of_birth, owner_id } = req.body;
    await pool.execute('UPDATE pet SET name=?,species=?,breed=?,gender=?,date_of_birth=?,owner_id=? WHERE pet_id=?',
      [name, species, breed, gender, date_of_birth, owner_id, req.params.id]);
    res.json({ message: 'Pet updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/pets/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM pet WHERE pet_id=?', [req.params.id]);
    res.json({ message: 'Pet deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// VETS (CRUD) — joined with person table
// ============================================================
app.get('/api/vets', async (req, res) => {
  try {
    const rows = await query(`
      SELECT v.vet_id, p.first_name, p.last_name, p.phone, p.email, p.address,
        v.specialization, v.license_number, v.hire_date
      FROM vet v JOIN person p ON v.vet_id=p.person_id ORDER BY p.first_name`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/vets', async (req, res) => {
  try {
    const { first_name, last_name, phone, email, address, specialization, license_number, hire_date } = req.body;
    const [r] = await pool.execute(
      'INSERT INTO person (first_name,last_name,phone,email,address,person_type) VALUES (?,?,?,?,?,?)',
      [first_name, last_name, phone, email, address, 'Vet']);
    await pool.execute('INSERT INTO vet (vet_id,specialization,license_number,hire_date) VALUES (?,?,?,?)',
      [r.insertId, specialization, license_number, hire_date]);
    res.json({ id: r.insertId, message: 'Vet created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/vets/:id', async (req, res) => {
  try {
    const { first_name, last_name, phone, email, address, specialization, license_number, hire_date } = req.body;
    await pool.execute('UPDATE person SET first_name=?,last_name=?,phone=?,email=?,address=? WHERE person_id=?',
      [first_name, last_name, phone, email, address, req.params.id]);
    await pool.execute('UPDATE vet SET specialization=?,license_number=?,hire_date=? WHERE vet_id=?',
      [specialization, license_number, hire_date, req.params.id]);
    res.json({ message: 'Vet updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/vets/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM person WHERE person_id=?', [req.params.id]);
    res.json({ message: 'Vet deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// APPOINTMENTS (CRUD)
// ============================================================
app.get('/api/appointments', async (req, res) => {
  try {
    const rows = await query(`
      SELECT a.*, p.name as pet_name, CONCAT(vp.first_name,' ',vp.last_name) as vet_name
      FROM appointment a
      JOIN pet p ON a.pet_id=p.pet_id
      JOIN vet v ON a.vet_id=v.vet_id
      JOIN person vp ON v.vet_id=vp.person_id
      ORDER BY a.appointment_date DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { pet_id, vet_id, appointment_date, status, reason, notes } = req.body;
    const [r] = await pool.execute(
      'INSERT INTO appointment (pet_id,vet_id,appointment_date,status,reason,notes) VALUES (?,?,?,?,?,?)',
      [pet_id, vet_id, appointment_date, status || 'Scheduled', reason, notes || null]);
    res.json({ id: r.insertId, message: 'Appointment created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { pet_id, vet_id, appointment_date, status, reason, notes } = req.body;
    await pool.execute(
      'UPDATE appointment SET pet_id=?,vet_id=?,appointment_date=?,status=?,reason=?,notes=? WHERE appointment_id=?',
      [pet_id, vet_id, appointment_date, status, reason, notes, req.params.id]);
    res.json({ message: 'Appointment updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM appointment WHERE appointment_id=?', [req.params.id]);
    res.json({ message: 'Appointment deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// PROCEDURES (CRUD)
// ============================================================
app.get('/api/procedures', async (req, res) => {
  try { res.json(await query('SELECT * FROM procedures ORDER BY name')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/procedures', async (req, res) => {
  try {
    const { name, description, cost } = req.body;
    const [r] = await pool.execute('INSERT INTO procedures (name,description,cost) VALUES (?,?,?)', [name, description, cost]);
    res.json({ id: r.insertId, message: 'Procedure created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/procedures/:id', async (req, res) => {
  try {
    const { name, description, cost } = req.body;
    await pool.execute('UPDATE procedures SET name=?,description=?,cost=? WHERE procedure_id=?', [name, description, cost, req.params.id]);
    res.json({ message: 'Procedure updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/procedures/:id', async (req, res) => {
  try { await pool.execute('DELETE FROM procedures WHERE procedure_id=?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// VACCINATIONS (CRUD)
// ============================================================
app.get('/api/vaccinations', async (req, res) => {
  try {
    const rows = await query(`
      SELECT vc.*, p.name as pet_name, CONCAT(vp.first_name,' ',vp.last_name) as vet_name
      FROM vaccination vc
      JOIN pet p ON vc.pet_id=p.pet_id JOIN vet v ON vc.vet_id=v.vet_id
      JOIN person vp ON v.vet_id=vp.person_id ORDER BY vc.date_administered DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/vaccinations', async (req, res) => {
  try {
    const { pet_id, vet_id, name, date_administered, next_due_date } = req.body;
    const [r] = await pool.execute('INSERT INTO vaccination (pet_id,vet_id,name,date_administered,next_due_date) VALUES (?,?,?,?,?)',
      [pet_id, vet_id, name, date_administered, next_due_date || null]);
    res.json({ id: r.insertId, message: 'Vaccination created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/vaccinations/:id', async (req, res) => {
  try {
    const { pet_id, vet_id, name, date_administered, next_due_date } = req.body;
    await pool.execute('UPDATE vaccination SET pet_id=?,vet_id=?,name=?,date_administered=?,next_due_date=? WHERE vaccination_id=?',
      [pet_id, vet_id, name, date_administered, next_due_date, req.params.id]);
    res.json({ message: 'Vaccination updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/vaccinations/:id', async (req, res) => {
  try { await pool.execute('DELETE FROM vaccination WHERE vaccination_id=?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// MEDICAL RECORDS (CRUD)
// ============================================================
app.get('/api/medical-records', async (req, res) => {
  try {
    const rows = await query(`
      SELECT mr.*, p.name as pet_name, CONCAT(vp.first_name,' ',vp.last_name) as vet_name
      FROM medical_record mr
      JOIN appointment a ON mr.appointment_id=a.appointment_id
      JOIN pet p ON a.pet_id=p.pet_id JOIN vet v ON a.vet_id=v.vet_id
      JOIN person vp ON v.vet_id=vp.person_id ORDER BY mr.record_date DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/medical-records', async (req, res) => {
  try {
    const { appointment_id, diagnosis, treatment, notes, record_date, record_type } = req.body;
    const [r] = await pool.execute(
      'INSERT INTO medical_record (appointment_id,diagnosis,treatment,notes,record_date,record_type) VALUES (?,?,?,?,?,?)',
      [appointment_id, diagnosis, treatment, notes, record_date, record_type || 'General']);
    res.json({ id: r.insertId, message: 'Medical record created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/medical-records/:id', async (req, res) => {
  try {
    const { diagnosis, treatment, notes, record_date, record_type } = req.body;
    await pool.execute('UPDATE medical_record SET diagnosis=?,treatment=?,notes=?,record_date=?,record_type=? WHERE record_id=?',
      [diagnosis, treatment, notes, record_date, record_type, req.params.id]);
    res.json({ message: 'Record updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/medical-records/:id', async (req, res) => {
  try { await pool.execute('DELETE FROM medical_record WHERE record_id=?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// BILLS (CRUD)
// ============================================================
app.get('/api/bills', async (req, res) => {
  try {
    const rows = await query(`
      SELECT b.*, p.name as pet_name, CONCAT(op.first_name,' ',op.last_name) as owner_name
      FROM bill b JOIN appointment a ON b.appointment_id=a.appointment_id
      JOIN pet p ON a.pet_id=p.pet_id JOIN owner o ON p.owner_id=o.owner_id
      JOIN person op ON o.owner_id=op.person_id ORDER BY b.bill_date DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/bills', async (req, res) => {
  try {
    const { appointment_id, amount, status, bill_date, payment_method } = req.body;
    const [r] = await pool.execute('INSERT INTO bill (appointment_id,amount,status,bill_date,payment_method) VALUES (?,?,?,?,?)',
      [appointment_id, amount, status || 'Pending', bill_date, payment_method || null]);
    res.json({ id: r.insertId, message: 'Bill created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/bills/:id', async (req, res) => {
  try {
    const { amount, status, bill_date, payment_method } = req.body;
    await pool.execute('UPDATE bill SET amount=?,status=?,bill_date=?,payment_method=? WHERE bill_id=?',
      [amount, status, bill_date, payment_method, req.params.id]);
    res.json({ message: 'Bill updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/bills/:id', async (req, res) => {
  try { await pool.execute('DELETE FROM bill WHERE bill_id=?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// SUPPLIES (CRUD)
// ============================================================
app.get('/api/supplies', async (req, res) => {
  try { res.json(await query('SELECT * FROM supply ORDER BY name')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/supplies', async (req, res) => {
  try {
    const { name, category, quantity, unit_price, reorder_level, supplier, last_restocked } = req.body;
    const [r] = await pool.execute(
      'INSERT INTO supply (name,category,quantity,unit_price,reorder_level,supplier,last_restocked) VALUES (?,?,?,?,?,?,?)',
      [name, category, quantity, unit_price, reorder_level || 10, supplier, last_restocked || null]);
    res.json({ id: r.insertId, message: 'Supply created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/supplies/:id', async (req, res) => {
  try {
    const { name, category, quantity, unit_price, reorder_level, supplier, last_restocked } = req.body;
    await pool.execute('UPDATE supply SET name=?,category=?,quantity=?,unit_price=?,reorder_level=?,supplier=?,last_restocked=? WHERE supply_id=?',
      [name, category, quantity, unit_price, reorder_level, supplier, last_restocked, req.params.id]);
    res.json({ message: 'Supply updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/supplies/:id', async (req, res) => {
  try { await pool.execute('DELETE FROM supply WHERE supply_id=?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// KENNEL STAYS (CRUD)
// ============================================================
app.get('/api/kennel-stays', async (req, res) => {
  try {
    const rows = await query(`
      SELECT ks.*, p.name as pet_name, cr.room_number
      FROM kennel_stay ks JOIN pet p ON ks.pet_id=p.pet_id
      JOIN clinic_room cr ON ks.room_id=cr.room_id ORDER BY ks.check_in_date DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/kennel-stays', async (req, res) => {
  try {
    const { pet_id, room_id, check_in_date, check_out_date, daily_rate } = req.body;
    const [r] = await pool.execute('INSERT INTO kennel_stay (pet_id,room_id,check_in_date,check_out_date,daily_rate) VALUES (?,?,?,?,?)',
      [pet_id, room_id, check_in_date, check_out_date || null, daily_rate]);
    res.json({ id: r.insertId, message: 'Kennel stay created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/kennel-stays/:id', async (req, res) => {
  try {
    const { pet_id, room_id, check_in_date, check_out_date, daily_rate } = req.body;
    await pool.execute('UPDATE kennel_stay SET pet_id=?,room_id=?,check_in_date=?,check_out_date=?,daily_rate=? WHERE stay_id=?',
      [pet_id, room_id, check_in_date, check_out_date, daily_rate, req.params.id]);
    res.json({ message: 'Kennel stay updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/kennel-stays/:id', async (req, res) => {
  try { await pool.execute('DELETE FROM kennel_stay WHERE stay_id=?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// CLINIC ROOMS (CRUD)
// ============================================================
app.get('/api/clinic-rooms', async (req, res) => {
  try { res.json(await query('SELECT * FROM clinic_room ORDER BY room_number')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/clinic-rooms', async (req, res) => {
  try {
    const { room_number, type, status } = req.body;
    const [r] = await pool.execute('INSERT INTO clinic_room (room_number,type,status) VALUES (?,?,?)',
      [room_number, type, status || 'Available']);
    res.json({ id: r.insertId, message: 'Room created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/clinic-rooms/:id', async (req, res) => {
  try {
    const { room_number, type, status } = req.body;
    await pool.execute('UPDATE clinic_room SET room_number=?,type=?,status=? WHERE room_id=?',
      [room_number, type, status, req.params.id]);
    res.json({ message: 'Room updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/clinic-rooms/:id', async (req, res) => {
  try { await pool.execute('DELETE FROM clinic_room WHERE room_id=?', [req.params.id]); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// VIEWS ENDPOINTS
// ============================================================
app.get('/api/views/appointment-details', async (req, res) => {
  try { res.json(await query('SELECT * FROM vw_appointment_details')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/views/pet-history/:petId', async (req, res) => {
  try { res.json(await query('SELECT * FROM vw_pet_medical_history WHERE pet_id=?', [req.params.petId])); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/views/revenue', async (req, res) => {
  try { res.json(await query('SELECT * FROM vw_revenue_summary')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/views/vaccination-schedule', async (req, res) => {
  try { res.json(await query('SELECT * FROM vw_vaccination_schedule')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/views/kennel-occupancy', async (req, res) => {
  try { res.json(await query('SELECT * FROM vw_kennel_occupancy')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/views/low-stock', async (req, res) => {
  try { res.json(await query('SELECT * FROM vw_low_stock_supplies')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// Fallback: serve frontend
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});
// ============================================================
// START SERVER
// ============================================================
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`\n🐾 Veterinary Clinic Server running at http://localhost:${PORT}\n`);
});
