// ============================================================
// VETERINARY CLINIC — Frontend Application
// ============================================================
const API = 'http://localhost:8000/api';
let currentPage = 'dashboard';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `${type === 'success' ? '✅' : '❌'} ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

async function api(endpoint, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}/${endpoint}`, opts);
  console.log(res);
  return res.json();
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(n) {
  return 'Rs. ' + Number(n || 0).toLocaleString();
}

function badge(text, type) {
  const map = { Completed: 'success', Scheduled: 'info', Cancelled: 'danger', 'No-Show': 'muted',
    Paid: 'success', Pending: 'warning', Overdue: 'danger', Active: 'success', Inactive: 'muted',
    Premium: 'info', Available: 'success', Occupied: 'warning', Maintenance: 'danger' };
  return `<span class="badge badge-${map[text] || 'muted'}">${text}</span>`;
}

function openModal(title, html, onSave) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('modal-save').onclick = async () => {
    try { await onSave(); closeModal(); } catch (e) { toast(e.message, 'error'); }
  };
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

document.getElementById('modal-close').onclick = closeModal;
document.getElementById('modal-cancel').onclick = closeModal;

// ============================================================
// NAVIGATION
// ============================================================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    currentPage = item.dataset.page;
    loadPage(currentPage);
  });
});

// ============================================================
// PAGE ROUTER
// ============================================================
async function loadPage(page) {
  const main = document.getElementById('main-content');
  main.innerHTML = '<div class="spinner"></div>';
  try {
    switch (page) {
      case 'dashboard': await renderDashboard(main); break;
      case 'owners': await renderCrud(main, 'owners', 'Owners', ['owner_id','first_name','last_name','phone','email','membership_status'], ownerForm); break;
      case 'pets': await renderCrud(main, 'pets', 'Pets', ['pet_id','name','species','breed','gender','owner_name'], petForm); break;
      case 'vets': await renderCrud(main, 'vets', 'Veterinarians', ['vet_id','first_name','last_name','specialization','license_number','hire_date'], vetForm); break;
      case 'appointments': await renderCrud(main, 'appointments', 'Appointments', ['appointment_id','pet_name','vet_name','appointment_date','status','reason'], appointmentForm); break;
      case 'procedures': await renderCrud(main, 'procedures', 'Procedures', ['procedure_id','name','description','cost'], procedureForm); break;
      case 'vaccinations': await renderCrud(main, 'vaccinations', 'Vaccinations', ['vaccination_id','pet_name','vet_name','name','date_administered','next_due_date'], vaccinationForm); break;
      case 'medical-records': await renderCrud(main, 'medical-records', 'Medical Records', ['record_id','pet_name','vet_name','diagnosis','treatment','record_date'], medicalRecordForm); break;
      case 'bills': await renderCrud(main, 'bills', 'Billing', ['bill_id','pet_name','owner_name','amount','status','bill_date','payment_method'], billForm); break;
      case 'supplies': await renderCrud(main, 'supplies', 'Supplies', ['supply_id','name','category','quantity','unit_price','reorder_level','supplier'], supplyForm); break;
      case 'kennel-stays': await renderCrud(main, 'kennel-stays', 'Kennel Stays', ['stay_id','pet_name','room_number','check_in_date','check_out_date','daily_rate'], kennelForm); break;
      case 'clinic-rooms': await renderCrud(main, 'clinic-rooms', 'Clinic Rooms', ['room_id','room_number','type','status'], roomForm); break;
    }
  } catch (e) { main.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Error: ${e.message}</p></div>`; }
}

// ============================================================
// DASHBOARD
// ============================================================
async function renderDashboard(main) {
  const d = await api('dashboard');
  main.innerHTML = `
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p>Live overview · ${new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card c-teal">
        <div class="stat-icon">🐕</div>
        <div class="stat-value">${d.totalPets}</div>
        <div class="stat-label">Total Pets</div>
      </div>
      <div class="stat-card c-blue">
        <div class="stat-icon">👤</div>
        <div class="stat-value">${d.totalOwners}</div>
        <div class="stat-label">Pet Owners</div>
      </div>
      <div class="stat-card c-green">
        <div class="stat-icon">⚕️</div>
        <div class="stat-value">${d.totalVets}</div>
        <div class="stat-label">Veterinarians</div>
      </div>
      <div class="stat-card c-amber">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${d.upcomingAppointments}</div>
        <div class="stat-label">Upcoming Appointments</div>
      </div>
      <div class="stat-card c-green">
        <div class="stat-icon">💰</div>
        <div class="stat-value">${formatCurrency(d.totalRevenue)}</div>
        <div class="stat-label">Total Revenue</div>
      </div>
      <div class="stat-card c-amber">
        <div class="stat-icon">⏳</div>
        <div class="stat-value">${formatCurrency(d.pendingBills)}</div>
        <div class="stat-label">Pending Bills</div>
      </div>
      <div class="stat-card c-rose">
        <div class="stat-icon">📦</div>
        <div class="stat-value">${d.lowStockItems}</div>
        <div class="stat-label">Low Stock Items</div>
      </div>
      <div class="stat-card c-violet">
        <div class="stat-icon">🏠</div>
        <div class="stat-value">${d.kennelOccupied}</div>
        <div class="stat-label">Kennels Occupied</div>
      </div>
    </div>
    <div class="recent-section">
      <h3>Recent Appointments</h3>
      <div class="table-container">
        <div style="overflow-x:auto">
        <table class="data-table"><thead><tr>
          <th>ID</th><th>Pet</th><th>Vet</th><th>Date</th><th>Status</th><th>Reason</th>
        </tr></thead><tbody>
          ${(d.recentAppointments || []).map(a => `<tr>
            <td><span style="color:var(--text-ghost);font-family:'Syne',sans-serif;font-size:0.75rem">#${a.appointment_id}</span></td>
            <td style="color:var(--text-bright);font-weight:500">${a.pet_name}</td>
            <td>${a.vet_name}</td>
            <td>${formatDate(a.appointment_date)}</td>
            <td>${badge(a.status)}</td>
            <td>${a.reason || '—'}</td>
          </tr>`).join('')}
        </tbody></table>
        </div>
      </div>
    </div>`;
}

// ============================================================
// GENERIC CRUD RENDERER
// ============================================================
async function renderCrud(main, endpoint, title, columns, formFn) {
  const data = await api(endpoint);
  const idCol = columns[0];
  const colHeaders = columns.map(c => `<th>${c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>`).join('');

  main.innerHTML = `
    <div class="page-header">
      <div>
        <h2>${title}</h2>
        <p>Manage ${title.toLowerCase()} records</p>
      </div>
      <button class="btn btn-primary" id="btn-add">+ Add ${title.slice(0, -1)}</button>
    </div>
    <div class="table-container">
      <div class="table-toolbar">
        <div class="search-box"><span>🔍</span><input type="text" id="search-input" placeholder="Search ${title.toLowerCase()}..."></div>
        <span class="record-count">${data.length} records</span>
      </div>
      <div style="overflow-x:auto">
      <table class="data-table"><thead><tr>${colHeaders}<th>Actions</th></tr></thead>
      <tbody id="table-body">
        ${data.length ? data.map(row => `<tr data-search="${columns.map(c => row[c] || '').join(' ').toLowerCase()}">
          ${columns.map(c => {
            let v = row[c];
            if (c === 'amount' || c === 'cost' || c === 'unit_price' || c === 'daily_rate') v = formatCurrency(v);
            else if (c.includes('date') && v) v = formatDate(v);
            else if (c === 'status' || c === 'membership_status') v = badge(v);
            else v = v ?? '—';
            return `<td>${v}</td>`;
          }).join('')}
          <td>
            <button class="btn btn-secondary btn-sm btn-edit" data-id="${row[idCol]}">✏️ Edit</button>
            <button class="btn btn-danger btn-sm btn-delete" data-id="${row[idCol]}">🗑️</button>
          </td>
        </tr>`).join('') : `<tr><td colspan="${columns.length + 1}"><div class="empty-state"><div class="empty-icon">📭</div><p>No records found</p></div></td></tr>`}
      </tbody></table></div>
    </div>`;

  // Search
  document.getElementById('search-input').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#table-body tr').forEach(r => {
      r.style.display = (r.dataset.search || '').includes(q) ? '' : 'none';
    });
  });

  // Add button
  document.getElementById('btn-add').onclick = () => {
    formFn(null, async (body) => {
      await api(endpoint, 'POST', body);
      toast(`${title.slice(0,-1)} created successfully`);
      loadPage(currentPage);
    });
  };

  // Edit buttons
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.onclick = () => {
      const row = data.find(r => r[idCol] == btn.dataset.id);
      formFn(row, async (body) => {
        await api(`${endpoint}/${btn.dataset.id}`, 'PUT', body);
        toast(`${title.slice(0,-1)} updated successfully`);
        loadPage(currentPage);
      });
    };
  });

  // Delete buttons
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Are you sure you want to delete this record?')) {
        await api(`${endpoint}/${btn.dataset.id}`, 'DELETE');
        toast(`${title.slice(0,-1)} deleted`);
        loadPage(currentPage);
      }
    };
  });
}

// ============================================================
// FORM BUILDERS — One per entity
// ============================================================
function field(label, name, type, value, opts = '') {
  if (type === 'select') return `<div class="form-group"><label>${label}</label><select class="form-control" name="${name}" ${opts}>${value}</select></div>`;
  if (type === 'textarea') return `<div class="form-group"><label>${label}</label><textarea class="form-control" name="${name}" rows="3" ${opts}>${value || ''}</textarea></div>`;
  return `<div class="form-group"><label>${label}</label><input class="form-control" type="${type}" name="${name}" value="${value || ''}" ${opts}></div>`;
}

function getFormData() {
  const d = {};
  document.querySelectorAll('#modal-body .form-control').forEach(el => { d[el.name] = el.value || null; });
  return d;
}

function ownerForm(row, onSave) {
  openModal(row ? 'Edit Owner' : 'Add Owner', `
    <div class="form-row">${field('First Name','first_name','text',row?.first_name,'required')}${field('Last Name','last_name','text',row?.last_name,'required')}</div>
    <div class="form-row">${field('Phone','phone','text',row?.phone,'required')}${field('Email','email','email',row?.email,'required')}</div>
    ${field('Address','address','text',row?.address)}
    <div class="form-row">
      ${field('Emergency Contact','emergency_contact','text',row?.emergency_contact)}
      ${field('Membership','membership_status','select',
        ['Active','Inactive','Premium'].map(s=>`<option value="${s}" ${row?.membership_status===s?'selected':''}>${s}</option>`).join(''))}
    </div>`, () => onSave(getFormData()));
}

async function petForm(row, onSave) {
  const owners = await api('owners');
  openModal(row ? 'Edit Pet' : 'Add Pet', `
    <div class="form-row">${field('Name','name','text',row?.name,'required')}
      ${field('Species','species','select',
        ['Mammal','Avian','Reptile'].map(s=>`<option value="${s}" ${row?.species===s?'selected':''}>${s}</option>`).join(''))}</div>
    <div class="form-row">${field('Breed','breed','text',row?.breed)}
      ${field('Gender','gender','select',
        ['Male','Female'].map(s=>`<option value="${s}" ${row?.gender===s?'selected':''}>${s}</option>`).join(''))}</div>
    <div class="form-row">${field('Date of Birth','date_of_birth','date',row?.date_of_birth?.slice(0,10))}
      ${field('Owner','owner_id','select',
        owners.map(o=>`<option value="${o.owner_id}" ${row?.owner_id==o.owner_id?'selected':''}>${o.first_name} ${o.last_name}</option>`).join(''))}</div>
  `, () => onSave(getFormData()));
}

function vetForm(row, onSave) {
  openModal(row ? 'Edit Vet' : 'Add Vet', `
    <div class="form-row">${field('First Name','first_name','text',row?.first_name,'required')}${field('Last Name','last_name','text',row?.last_name,'required')}</div>
    <div class="form-row">${field('Phone','phone','text',row?.phone,'required')}${field('Email','email','email',row?.email,'required')}</div>
    ${field('Address','address','text',row?.address)}
    <div class="form-row">${field('Specialization','specialization','text',row?.specialization,'required')}${field('License Number','license_number','text',row?.license_number,'required')}</div>
    ${field('Hire Date','hire_date','date',row?.hire_date?.slice(0,10),'required')}
  `, () => onSave(getFormData()));
}

async function appointmentForm(row, onSave) {
  const pets = await api('pets');
  const vets = await api('vets');
  openModal(row ? 'Edit Appointment' : 'New Appointment', `
    <div class="form-row">
      ${field('Pet','pet_id','select', pets.map(p=>`<option value="${p.pet_id}" ${row?.pet_id==p.pet_id?'selected':''}>${p.name}</option>`).join(''))}
      ${field('Vet','vet_id','select', vets.map(v=>`<option value="${v.vet_id}" ${row?.vet_id==v.vet_id?'selected':''}>${v.first_name} ${v.last_name}</option>`).join(''))}
    </div>
    <div class="form-row">
      ${field('Date & Time','appointment_date','datetime-local',row?.appointment_date?.slice(0,16),'required')}
      ${field('Status','status','select',
        ['Scheduled','Completed','Cancelled','No-Show'].map(s=>`<option value="${s}" ${row?.status===s?'selected':''}>${s}</option>`).join(''))}
    </div>
    ${field('Reason','reason','text',row?.reason)}
    ${field('Notes','notes','textarea',row?.notes)}
  `, () => onSave(getFormData()));
}

function procedureForm(row, onSave) {
  openModal(row ? 'Edit Procedure' : 'Add Procedure', `
    ${field('Name','name','text',row?.name,'required')}
    ${field('Description','description','textarea',row?.description)}
    ${field('Cost (Rs.)','cost','number',row?.cost,'required min="0" step="0.01"')}
  `, () => onSave(getFormData()));
}

async function vaccinationForm(row, onSave) {
  const pets = await api('pets');
  const vets = await api('vets');
  openModal(row ? 'Edit Vaccination' : 'Add Vaccination', `
    <div class="form-row">
      ${field('Pet','pet_id','select', pets.map(p=>`<option value="${p.pet_id}" ${row?.pet_id==p.pet_id?'selected':''}>${p.name}</option>`).join(''))}
      ${field('Vet','vet_id','select', vets.map(v=>`<option value="${v.vet_id}" ${row?.vet_id==v.vet_id?'selected':''}>${v.first_name} ${v.last_name}</option>`).join(''))}
    </div>
    ${field('Vaccine Name','name','text',row?.name,'required')}
    <div class="form-row">
      ${field('Date Administered','date_administered','date',row?.date_administered?.slice(0,10),'required')}
      ${field('Next Due Date','next_due_date','date',row?.next_due_date?.slice(0,10))}
    </div>
  `, () => onSave(getFormData()));
}

async function medicalRecordForm(row, onSave) {
  const appts = await api('appointments');
  openModal(row ? 'Edit Medical Record' : 'Add Medical Record', `
    <div class="form-row">
      ${field('Appointment','appointment_id','select', appts.map(a=>`<option value="${a.appointment_id}" ${row?.appointment_id==a.appointment_id?'selected':''}>#${a.appointment_id} - ${a.pet_name} (${formatDate(a.appointment_date)})</option>`).join(''))}
      ${field('Type','record_type','select',
        ['General','Surgery','Wellness'].map(s=>`<option value="${s}" ${row?.record_type===s?'selected':''}>${s}</option>`).join(''))}
    </div>
    ${field('Diagnosis','diagnosis','textarea',row?.diagnosis,'required')}
    ${field('Treatment','treatment','textarea',row?.treatment)}
    ${field('Notes','notes','textarea',row?.notes)}
    ${field('Record Date','record_date','date',row?.record_date?.slice(0,10),'required')}
  `, () => onSave(getFormData()));
}

async function billForm(row, onSave) {
  const appts = await api('appointments');
  openModal(row ? 'Edit Bill' : 'Add Bill', `
    ${field('Appointment','appointment_id','select', appts.map(a=>`<option value="${a.appointment_id}" ${row?.appointment_id==a.appointment_id?'selected':''}>#${a.appointment_id} - ${a.pet_name}</option>`).join(''))}
    <div class="form-row">
      ${field('Amount (Rs.)','amount','number',row?.amount,'required min="0" step="0.01"')}
      ${field('Status','status','select',
        ['Pending','Paid','Overdue','Cancelled'].map(s=>`<option value="${s}" ${row?.status===s?'selected':''}>${s}</option>`).join(''))}
    </div>
    <div class="form-row">
      ${field('Bill Date','bill_date','date',row?.bill_date?.slice(0,10),'required')}
      ${field('Payment Method','payment_method','select',
        `<option value="">Select...</option>${['Cash','Card','Insurance','Online'].map(s=>`<option value="${s}" ${row?.payment_method===s?'selected':''}>${s}</option>`).join('')}`)}
    </div>
  `, () => onSave(getFormData()));
}

function supplyForm(row, onSave) {
  openModal(row ? 'Edit Supply' : 'Add Supply', `
    <div class="form-row">${field('Name','name','text',row?.name,'required')}
      ${field('Category','category','select',
        ['Medication','Equipment','Consumable','Vaccine'].map(s=>`<option value="${s}" ${row?.category===s?'selected':''}>${s}</option>`).join(''))}</div>
    <div class="form-row">${field('Quantity','quantity','number',row?.quantity,'required min="0"')}${field('Unit Price (Rs.)','unit_price','number',row?.unit_price,'required min="0" step="0.01"')}</div>
    <div class="form-row">${field('Reorder Level','reorder_level','number',row?.reorder_level,'min="0"')}${field('Supplier','supplier','text',row?.supplier)}</div>
    ${field('Last Restocked','last_restocked','date',row?.last_restocked?.slice(0,10))}
  `, () => onSave(getFormData()));
}

async function kennelForm(row, onSave) {
  const pets = await api('pets');
  const rooms = await api('clinic-rooms');
  const kennelRooms = rooms.filter(r => r.type === 'Kennel');
  openModal(row ? 'Edit Kennel Stay' : 'Add Kennel Stay', `
    <div class="form-row">
      ${field('Pet','pet_id','select', pets.map(p=>`<option value="${p.pet_id}" ${row?.pet_id==p.pet_id?'selected':''}>${p.name}</option>`).join(''))}
      ${field('Room','room_id','select', kennelRooms.map(r=>`<option value="${r.room_id}" ${row?.room_id==r.room_id?'selected':''}>${r.room_number} (${r.status})</option>`).join(''))}
    </div>
    <div class="form-row">
      ${field('Check-in Date','check_in_date','date',row?.check_in_date?.slice(0,10),'required')}
      ${field('Check-out Date','check_out_date','date',row?.check_out_date?.slice(0,10))}
    </div>
    ${field('Daily Rate (Rs.)','daily_rate','number',row?.daily_rate,'required min="0" step="0.01"')}
  `, () => onSave(getFormData()));
}

async function roomForm(row, onSave) {
  openModal(row ? 'Edit Room' : 'Add Room', `
    ${field('Room Number','room_number','text',row?.room_number,'required')}
    <div class="form-row">
      ${field('Type','type','select',
        ['Examination','Surgery','Recovery','Kennel'].map(s=>`<option value="${s}" ${row?.type===s?'selected':''}>${s}</option>`).join(''))}
      ${field('Status','status','select',
        ['Available','Occupied','Maintenance'].map(s=>`<option value="${s}" ${row?.status===s?'selected':''}>${s}</option>`).join(''))}
    </div>
  `, () => onSave(getFormData()));
}

// ============================================================
// INIT
// ============================================================
loadPage('dashboard');
