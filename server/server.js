// ============================================================
// VETERINARY CLINIC — Express Server + MySQL REST API
// ============================================================
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

// Load local server/.env during development. Deployment platforms provide
// these values through their dashboard environment variable settings.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separator = trimmed.indexOf('=');
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================================
// MySQL Connection Pool
// ============================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'vet_clinic',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

// Helper: execute query
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params || []);
  return rows;
}

// ============================================================
// AUTHENTICATION
// ============================================================
const TOKEN_TTL_SECONDS = Number(process.env.JWT_EXPIRES_SECONDS || 60 * 60 * 8);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-this-secret';
const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION !== 'false';
const VERIFY_EMAIL_TTL_SECONDS = Number(process.env.VERIFY_EMAIL_EXPIRES_SECONDS || 60 * 60 * 24);
const PUBLIC_APP_URL = (process.env.PUBLIC_APP_URL || 'http://localhost:8000').replace(/\/$/, '');
const EMAIL_FROM = process.env.EMAIL_FROM || 'PawCare Pro <onboarding@resend.dev>';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [method, iterations, salt, hash] = String(storedHash || '').split('$');
  if (method !== 'pbkdf2' || !iterations || !salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, 'sha256');
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

function signToken(user) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({
    sub: user.user_id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  }));
  const signature = base64url(crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expected = base64url(crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest());
    const given = Buffer.from(signature);
    const actual = Buffer.from(expected);
    if (given.length !== actual.length || !crypto.timingSafeEqual(given, actual)) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateNewAccount(email, password, confirmPassword) {
  if (!email || !password) return 'Email and password are required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (confirmPassword !== undefined && password !== confirmPassword) return 'Passwords do not match';
  return '';
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, res => {
      let responseBody = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function verificationEmailHtml(verificationUrl) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f5fbff;padding:28px;color:#17202a">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce4ec;border-radius:8px;padding:26px">
        <h1 style="margin:0 0 10px;font-size:24px;color:#087b70">Verify your PawCare Pro account</h1>
        <p style="margin:0 0 18px;line-height:1.6">Thanks for registering. Confirm your email address to activate your clinic account.</p>
        <a href="${verificationUrl}" style="display:inline-block;background:#0f9f8f;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Verify email</a>
        <p style="margin:22px 0 0;font-size:13px;color:#778190;line-height:1.5">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
      </div>
    </div>
  `;
}

async function sendVerificationEmail(email, token) {
  const verificationUrl = `${PUBLIC_APP_URL}/index.html?verifyToken=${encodeURIComponent(token)}`;
  const message = {
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your PawCare Pro account',
    html: verificationEmailHtml(verificationUrl),
    text: `Verify your PawCare Pro account: ${verificationUrl}`
  };

  if (!process.env.RESEND_API_KEY) {
    const error = new Error('Email service is not configured. Set RESEND_API_KEY to send verification emails automatically.');
    error.statusCode = 503;
    throw error;
  }

  const result = await postJson('https://api.resend.com/emails', {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`
  }, message);

  if (result.statusCode < 200 || result.statusCode >= 300) {
    const error = new Error(`Verification email failed with status ${result.statusCode}`);
    error.statusCode = 502;
    throw error;
  }

  return { sent: true };
}

async function issueVerificationEmail(userId, email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + VERIFY_EMAIL_TTL_SECONDS * 1000);
  await pool.execute(
    'UPDATE app_user SET verification_token_hash=?, verification_expires_at=? WHERE user_id=?',
    [hashToken(token), expiresAt, userId]
  );
  return sendVerificationEmail(email, token);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  req.user = user;
  next();
}

async function ensureAuthTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS app_user (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('Admin','Staff') NOT NULL DEFAULT 'Admin',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token_hash CHAR(64) NULL,
      verification_expires_at DATETIME NULL,
      verified_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [emailVerifiedColumn] = await pool.execute("SHOW COLUMNS FROM app_user LIKE 'email_verified'");
  const alreadyHadEmailVerification = emailVerifiedColumn.length > 0;
  const addColumnIfMissing = async (name, definition) => {
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='app_user' AND COLUMN_NAME=?",
      [name]
    );
    if (!columns.length) await pool.execute(`ALTER TABLE app_user ADD COLUMN ${definition}`);
  };

  await addColumnIfMissing('email_verified', 'email_verified BOOLEAN NOT NULL DEFAULT FALSE');
  await addColumnIfMissing('verification_token_hash', 'verification_token_hash CHAR(64) NULL');
  await addColumnIfMissing('verification_expires_at', 'verification_expires_at DATETIME NULL');
  await addColumnIfMissing('verified_at', 'verified_at DATETIME NULL');

  if (!alreadyHadEmailVerification) {
    await pool.execute('UPDATE app_user SET email_verified=TRUE, verified_at=COALESCE(verified_at,NOW())');
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const [existing] = await pool.execute('SELECT user_id FROM app_user WHERE email=?', [process.env.ADMIN_EMAIL]);
    if (!existing.length) {
      await pool.execute(
        'INSERT INTO app_user (email,password_hash,role,email_verified,verified_at) VALUES (?,?,?,?,NOW())',
        [process.env.ADMIN_EMAIL, hashPassword(process.env.ADMIN_PASSWORD), 'Admin', true]
      );
      console.log(`Created initial admin user: ${process.env.ADMIN_EMAIL}`);
    }
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const [users] = await pool.execute(
      'SELECT user_id,email,password_hash,role,is_active,email_verified FROM app_user WHERE email=? LIMIT 1',
      [email]
    );
    const user = users[0];
    if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    if (!user.email_verified) {
      const emailResult = await issueVerificationEmail(user.user_id, user.email);
      res.status(403).json({
        error: 'Please verify your email before signing in. We sent you a new verification link.',
        ...emailResult
      });
      return;
    }

    await pool.execute('UPDATE app_user SET last_login_at=NOW() WHERE user_id=?', [user.user_id]);
    res.json({
      token: signToken(user),
      user: { user_id: user.user_id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    if (!ALLOW_REGISTRATION) {
      res.status(403).json({ error: 'Registration is currently closed' });
      return;
    }

    const email = normalizeEmail(req.body.email);
    const { password, confirmPassword } = req.body;
    const validationError = validateNewAccount(email, password, confirmPassword);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    if (!process.env.RESEND_API_KEY) {
      res.status(503).json({ error: 'Email service is not configured. Set RESEND_API_KEY to send verification emails automatically.' });
      return;
    }

    const [existing] = await pool.execute('SELECT user_id,email,email_verified FROM app_user WHERE email=? LIMIT 1', [email]);
    if (existing.length && existing[0].email_verified) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    if (existing.length) {
      const emailResult = await issueVerificationEmail(existing[0].user_id, existing[0].email);
      res.json({
        message: 'This account already exists but is not verified. We sent a fresh verification link.',
        ...emailResult
      });
      return;
    }

    const [result] = await pool.execute(
      'INSERT INTO app_user (email,password_hash,role,email_verified) VALUES (?,?,?,FALSE)',
      [email, hashPassword(password), 'Staff']
    );
    const user = { user_id: result.insertId, email, role: 'Staff' };
    const emailResult = await issueVerificationEmail(user.user_id, email);
    res.status(201).json({
      message: emailResult.sent
        ? 'Account created. Please check your email to verify your account.'
        : 'Account created. Email sending is not configured, so use the local verification link below.',
      ...emailResult
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    const [users] = await pool.execute(
      'SELECT user_id,email FROM app_user WHERE verification_token_hash=? AND verification_expires_at > NOW() LIMIT 1',
      [hashToken(token)]
    );
    const user = users[0];
    if (!user) {
      res.status(400).json({ error: 'Verification link is invalid or expired' });
      return;
    }

    await pool.execute(
      'UPDATE app_user SET email_verified=TRUE, verified_at=NOW(), verification_token_hash=NULL, verification_expires_at=NULL WHERE user_id=?',
      [user.user_id]
    );
    res.json({ message: 'Email verified. You can now sign in.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const [users] = await pool.execute('SELECT user_id,email,email_verified FROM app_user WHERE email=? LIMIT 1', [email]);
    const user = users[0];
    if (!user) {
      res.json({ message: 'If an unverified account exists, a verification email has been sent.' });
      return;
    }
    if (user.email_verified) {
      res.json({ message: 'This account is already verified. You can sign in.' });
      return;
    }

    const emailResult = await issueVerificationEmail(user.user_id, user.email);
    res.json({ message: 'Verification email sent. Please check your inbox.', ...emailResult });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: { user_id: req.user.sub, email: req.user.email, role: req.user.role } });
});

app.use('/api', authMiddleware);
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
const PORT = process.env.PORT || 8000;

async function startServer() {
  await ensureAuthTables();
  app.listen(PORT, () => {
    console.log(`\nVeterinary Clinic Server running at http://localhost:${PORT}\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
