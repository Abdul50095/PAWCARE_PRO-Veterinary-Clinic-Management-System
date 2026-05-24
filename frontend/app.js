const API = (window.PAWCARE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
let currentPage = 'dashboard';
const AUTH_TOKEN_KEY = 'pawcare-auth-token';
let authToken = localStorage.getItem(AUTH_TOKEN_KEY);
let currentUser = null;
let authMode = 'login';

const navGroups = [
  {
    label: 'Main',
    items: [
      { page: 'dashboard', label: 'Dashboard', icon: 'icon-dashboard', title: 'Live clinic overview' }
    ]
  },
  {
    label: 'Management',
    items: [
      { page: 'owners', label: 'Owners', icon: 'icon-users', title: 'Client directory' },
      { page: 'pets', label: 'Pets', icon: 'icon-pet', title: 'Patient profiles' },
      { page: 'vets', label: 'Veterinarians', icon: 'icon-vet', title: 'Care team' },
      { page: 'appointments', label: 'Appointments', icon: 'icon-calendar', title: 'Schedule board' }
    ]
  },
  {
    label: 'Clinical',
    items: [
      { page: 'procedures', label: 'Procedures', icon: 'icon-microscope', title: 'Procedure catalog' },
      { page: 'vaccinations', label: 'Vaccinations', icon: 'icon-syringe', title: 'Vaccine tracking' },
      { page: 'medical-records', label: 'Medical Records', icon: 'icon-file', title: 'Clinical history' }
    ]
  },
  {
    label: 'Operations',
    items: [
      { page: 'bills', label: 'Billing', icon: 'icon-card', title: 'Payments and invoices' },
      { page: 'supplies', label: 'Supplies', icon: 'icon-package', title: 'Inventory control' },
      { page: 'kennel-stays', label: 'Kennel Stays', icon: 'icon-home', title: 'Boarding stays' },
      { page: 'clinic-rooms', label: 'Clinic Rooms', icon: 'icon-door', title: 'Room availability' }
    ]
  }
];

const pageConfig = new Map(navGroups.flatMap(group => group.items.map(item => [item.page, item])));


function icon(id, className = 'icon') {
  return `<svg class="${className}" aria-hidden="true"><use href="#${id}"></use></svg>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const item = document.createElement('div');
  item.className = `toast toast-${type}`;
  item.innerHTML = `
    <span>${icon(type === 'success' ? 'icon-check' : 'icon-alert')}</span>
    <div><strong>${type === 'success' ? 'Done' : 'Error'}</strong><span>${escapeHtml(msg)}</span></div>
  `;
  container.appendChild(item);
  setTimeout(() => item.remove(), 3100);
}

function setApiStatus(online) {
  const status = document.getElementById('api-status');
  status.classList.toggle('offline', !online);
  status.querySelector('span').textContent = online ? 'API ready' : 'API offline';
}

function authHeader() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function setAuthMode(mode) {
  document.body.classList.remove('auth-pending', 'guest', 'authenticated');
  document.body.classList.add(mode);
}

function updateUserPill() {
  const pill = document.getElementById('user-pill');
  const logout = document.getElementById('logout-button');
  if (!pill || !logout) return;

  if (currentUser) {
    pill.hidden = false;
    logout.hidden = false;
    pill.textContent = currentUser.email;
  } else {
    pill.hidden = true;
    logout.hidden = true;
    pill.textContent = '';
  }
}

function logout(message) {
  authToken = null;
  currentUser = null;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  updateUserPill();
  closeModal();
  setAuthMode('guest');
  document.getElementById('main-content').innerHTML = '<div class="spinner"></div>';
  if (message) toast(message, 'error');
}

async function authRequest(endpoint, body) {
  let res;
  try {
    res = await fetch(API + '/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    setApiStatus(false);
    throw new Error('Could not reach the API server');
  }

  setApiStatus(true);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || 'Authentication failed');
    error.data = data;
    throw error;
  }

  return data;
}

function setSession(data) {
  authToken = data.token;
  currentUser = data.user;
  localStorage.setItem(AUTH_TOKEN_KEY, authToken);
  updateUserPill();
}

async function login(email, password) {
  setSession(await authRequest('auth/login', { email, password }));
}

async function register(email, password, confirmPassword) {
  return authRequest('auth/register', { email, password, confirmPassword });
}

async function verifyEmailToken(token) {
  return authRequest('auth/verify-email', { token });
}

async function resendVerification(email) {
  return authRequest('auth/resend-verification', { email });
}

function showAuthNotice(message, type = 'error') {
  const error = document.getElementById('login-error');
  if (!error) return;
  error.classList.toggle('success', type === 'success');
  if (!message) {
    error.textContent = '';
    return;
  }
  error.innerHTML = escapeHtml(message);
}

function setupAuthForm() {
  const form = document.getElementById('login-form');
  const email = document.getElementById('login-email');
  const password = document.getElementById('login-password');
  const confirmPassword = document.getElementById('register-confirm-password');
  const confirmGroup = document.getElementById('confirm-password-group');
  const submit = document.getElementById('login-submit');
  const subtitle = document.getElementById('auth-subtitle');
  const passwordToggle = document.getElementById('password-toggle');
  const resendButton = document.getElementById('resend-verification');
  const authTabs = document.querySelectorAll('.auth-tab');
  const logoutButton = document.getElementById('logout-button');

  const setSubmitLabel = loading => {
    if (!submit) return;
    if (loading) {
      submit.textContent = authMode === 'register' ? 'Creating account...' : 'Signing in...';
      return;
    }
    submit.innerHTML = `${icon('icon-check')} ${authMode === 'register' ? 'Create Account' : 'Sign In'}`;
  };

  const setAuthFormMode = mode => {
    authMode = mode === 'register' ? 'register' : 'login';
    authTabs.forEach(tab => {
      const active = tab.dataset.authMode === authMode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    if (confirmGroup && confirmPassword) {
      confirmGroup.hidden = authMode !== 'register';
      confirmPassword.required = authMode === 'register';
      confirmPassword.value = '';
    }
    if (password) {
      password.autocomplete = authMode === 'register' ? 'new-password' : 'current-password';
    }
    if (subtitle) {
      subtitle.textContent = authMode === 'register' ? 'Create your clinic account' : 'Clinic management login';
    }
    showAuthNotice('');
    setSubmitLabel(false);
  };

  logoutButton?.addEventListener('click', () => logout());
  if (password && passwordToggle) passwordToggle.addEventListener('click', () => {
    const shouldShow = password.type === 'password';
    password.type = shouldShow ? 'text' : 'password';
    if (confirmPassword) confirmPassword.type = shouldShow ? 'text' : 'password';
    passwordToggle.setAttribute('aria-pressed', String(shouldShow));
    passwordToggle.setAttribute('aria-label', shouldShow ? 'Hide passwords' : 'Show passwords');
    password.focus();
  });

  authTabs.forEach(tab => {
    tab.addEventListener('click', () => setAuthFormMode(tab.dataset.authMode));
  });
  setAuthFormMode(authMode);

  resendButton?.addEventListener('click', async () => {
    showAuthNotice('');
    const emailValue = email.value.trim();
    if (!emailValue) {
      showAuthNotice('Enter your email address first');
      email.focus();
      return;
    }
    resendButton.disabled = true;
    resendButton.textContent = 'Sending...';
    try {
      const data = await resendVerification(emailValue);
      showAuthNotice(data.message || 'Verification email sent. Please check your inbox.', 'success');
    } catch (err) {
      showAuthNotice(err.message);
    } finally {
      resendButton.disabled = false;
      resendButton.textContent = 'Resend verification email';
    }
  });

  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    showAuthNotice('');
    submit.disabled = true;
    setSubmitLabel(true);

    try {
      if (authMode === 'register') {
        const data = await register(email.value.trim(), password.value, confirmPassword.value);
        password.value = '';
        if (confirmPassword) confirmPassword.value = '';
        setAuthFormMode('login');
        showAuthNotice(data.message || 'Account created. Please check your email to verify your account.', 'success');
        return;
      } else {
        await login(email.value.trim(), password.value);
      }
      password.value = '';
      if (confirmPassword) confirmPassword.value = '';
      setAuthMode('authenticated');
      await loadPage(currentPage);
    } catch (err) {
      showAuthNotice(err.message);
    } finally {
      submit.disabled = false;
      setSubmitLabel(false);
    }
  });
}

async function api(endpoint, method = 'GET', body = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    signal: controller.signal
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(API + '/' + endpoint, opts);
    clearTimeout(timeout);
    setApiStatus(res.ok);
    if (res.status === 401 || res.status === 403) {
      logout('Please sign in again');
      throw new Error('Please sign in again');
    }
    if (!res.ok) throw new Error('Request failed with status ' + res.status);
    if (method === 'DELETE') return {};
    return await res.json();
  } catch (error) {
    clearTimeout(timeout);
    setApiStatus(false);
    throw error.name === 'AbortError' ? new Error('API request timed out') : error;
  }
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(value) {
  return 'Rs. ' + Number(value || 0).toLocaleString('en-PK');
}

function badge(text) {
  const map = {
    Completed: 'success',
    Scheduled: 'info',
    Cancelled: 'danger',
    'No-Show': 'muted',
    Paid: 'success',
    Pending: 'warning',
    Overdue: 'danger',
    Active: 'success',
    Inactive: 'muted',
    Premium: 'info',
    Available: 'success',
    Occupied: 'warning',
    Maintenance: 'danger'
  };
  return `<span class="badge badge-${map[text] || 'muted'}">${escapeHtml(text ?? '-')}</span>`;
}

function humanize(value) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function singular(title) {
  if (title === 'Supplies') return 'Supply';
  if (title.endsWith('ies')) return title.slice(0, -3) + 'y';
  if (title.endsWith('s')) return title.slice(0, -1);
  return title;
}

function updateChrome(page) {
  const config = pageConfig.get(page);
  document.getElementById('topbar-eyebrow').textContent = config?.label || 'PawCare Pro';
  document.getElementById('topbar-title').textContent = config?.title || 'Clinic workspace';
}

function navigateToPage(page) {
  if (!page || !pageConfig.has(page)) return;
  currentPage = page;
  renderNav();
  loadPage(currentPage);
}

function setupSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  if (!toggle) return;

  const setCollapsed = collapsed => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    toggle.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    localStorage.setItem('pawcare-sidebar-collapsed', collapsed ? '1' : '0');
  };

  setCollapsed(localStorage.getItem('pawcare-sidebar-collapsed') === '1');
  toggle.addEventListener('click', () => setCollapsed(!document.body.classList.contains('sidebar-collapsed')));
}

function renderNav() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = navGroups.map(group => `
    <div class="nav-label">${escapeHtml(group.label)}</div>
    ${group.items.map(item => `
      <button class="nav-item ${item.page === currentPage ? 'active' : ''}" type="button" data-page="${item.page}" title="${escapeHtml(item.label)}">
        <span class="nav-icon">${icon(item.icon)}</span>
        <span class="nav-text">${escapeHtml(item.label)}</span>
      </button>
    `).join('')}
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateToPage(item.dataset.page));
  });
}

function openModal(title, html, onSave) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.getElementById('modal-save').onclick = async () => {
    try {
      await onSave();
      closeModal();
    } catch (error) {
      toast(error.message, 'error');
    }
  };
  setTimeout(() => document.querySelector('#modal-body .form-control')?.focus(), 50);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', event => {
  if (event.target.id === 'modal-overlay') closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

async function loadPage(page) {
  const main = document.getElementById('main-content');
  updateChrome(page);
  main.innerHTML = '<div class="spinner"></div>';

  try {
    switch (page) {
      case 'dashboard': await renderDashboard(main); break;
      case 'owners': await renderCrud(main, 'owners', 'Owners', ['owner_id', 'first_name', 'last_name', 'phone', 'email', 'membership_status'], ownerForm); break;
      case 'pets': await renderCrud(main, 'pets', 'Pets', ['pet_id', 'name', 'species', 'breed', 'gender', 'owner_name'], petForm); break;
      case 'vets': await renderCrud(main, 'vets', 'Veterinarians', ['vet_id', 'first_name', 'last_name', 'specialization', 'license_number', 'hire_date'], vetForm); break;
      case 'appointments': await renderCrud(main, 'appointments', 'Appointments', ['appointment_id', 'pet_name', 'vet_name', 'appointment_date', 'status', 'reason'], appointmentForm); break;
      case 'procedures': await renderCrud(main, 'procedures', 'Procedures', ['procedure_id', 'name', 'description', 'cost'], procedureForm); break;
      case 'vaccinations': await renderCrud(main, 'vaccinations', 'Vaccinations', ['vaccination_id', 'pet_name', 'vet_name', 'name', 'date_administered', 'next_due_date'], vaccinationForm); break;
      case 'medical-records': await renderCrud(main, 'medical-records', 'Medical Records', ['record_id', 'pet_name', 'vet_name', 'diagnosis', 'treatment', 'record_date'], medicalRecordForm); break;
      case 'bills': await renderCrud(main, 'bills', 'Billing', ['bill_id', 'pet_name', 'owner_name', 'amount', 'status', 'bill_date', 'payment_method'], billForm); break;
      case 'supplies': await renderCrud(main, 'supplies', 'Supplies', ['supply_id', 'name', 'category', 'quantity', 'unit_price', 'reorder_level', 'supplier'], supplyForm); break;
      case 'kennel-stays': await renderCrud(main, 'kennel-stays', 'Kennel Stays', ['stay_id', 'pet_name', 'room_number', 'check_in_date', 'check_out_date', 'daily_rate'], kennelForm); break;
      case 'clinic-rooms': await renderCrud(main, 'clinic-rooms', 'Clinic Rooms', ['room_id', 'room_number', 'type', 'status'], roomForm); break;
    }
  } catch (error) {
    main.innerHTML = `
      <div class="empty-state">
        <div class="icon-wrap">${icon('icon-alert')}</div>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

async function renderDashboard(main) {
  const data = await api('dashboard');
  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const stats = [
    { label: 'Total Pets', value: data.totalPets, icon: 'icon-pet', accent: 'var(--teal)', trend: 'Live', page: 'pets' },
    { label: 'Pet Owners', value: data.totalOwners, icon: 'icon-users', accent: 'var(--blue)', trend: 'Active', page: 'owners' },
    { label: 'Veterinarians', value: data.totalVets, icon: 'icon-vet', accent: 'var(--violet)', trend: 'Team', page: 'vets' },
    { label: 'Upcoming Appointments', value: data.upcomingAppointments, icon: 'icon-calendar', accent: 'var(--amber)', trend: 'Next', page: 'appointments' },
    { label: 'Total Revenue', value: formatCurrency(data.totalRevenue), icon: 'icon-money', accent: 'var(--green)', trend: 'Paid', page: 'bills' },
    { label: 'Pending Bills', value: formatCurrency(data.pendingBills), icon: 'icon-card', accent: 'var(--warning)', trend: 'Due', page: 'bills' },
    { label: 'Low Stock Items', value: data.lowStockItems, icon: 'icon-package', accent: 'var(--rose)', trend: 'Check', page: 'supplies' },
    { label: 'Kennels Occupied', value: data.kennelOccupied, icon: 'icon-home', accent: 'var(--info)', trend: 'Boarding', page: 'kennel-stays' }
  ];

  main.innerHTML = `
    <div class="dashboard-band">
      <section class="hero-panel">
        <div>
          <p class="hero-kicker">${escapeHtml(today)}</p>
          <h1 class="hero-title">PawCare Pro command center</h1>
          <div class="hero-meta">
            <span class="hero-chip">${icon('icon-activity')} ${Number(data.upcomingAppointments || 0).toLocaleString()} upcoming appointments</span>
            <span class="hero-chip">${icon('icon-package')} ${Number(data.lowStockItems || 0).toLocaleString()} low stock alerts</span>
            <span class="hero-chip">${icon('icon-card')} ${formatCurrency(data.pendingBills)} pending</span>
          </div>
        </div>
        <div class="clinic-visual" aria-hidden="true">
          <svg viewBox="0 0 220 180" fill="none">
            <rect x="24" y="50" width="172" height="95" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.34)"/>
            <path d="M38 50 110 16l72 34" stroke="rgba(255,255,255,0.68)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M96 83h28M110 69v28" stroke="#4fc9be" stroke-width="10" stroke-linecap="round"/>
            <path d="M56 146v-34h34v34M136 146v-27h35v27" stroke="rgba(255,255,255,0.72)" stroke-width="6" stroke-linejoin="round"/>
            <path class="visual-line" d="M25 160c28-11 43-1 66-8 20-6 29-26 53-22 20 3 29 20 51 10" stroke="#e5a123" stroke-width="5" stroke-linecap="round"/>
          </svg>
        </div>
      </section>

      <aside class="insight-panel">
        <h3 class="insight-title">${icon('icon-activity')} Today&apos;s pulse</h3>
        <div class="pulse-list">
          <button class="pulse-item" type="button" data-page="appointments" data-dashboard-link aria-label="Open appointments">
            <span class="pulse-icon" style="background:var(--teal)">${icon('icon-calendar')}</span>
            <div><p class="pulse-label">Appointments</p><p class="pulse-sub">Scheduled pipeline</p></div>
            <strong class="pulse-value">${Number(data.upcomingAppointments || 0).toLocaleString()}</strong>
          </button>
          <button class="pulse-item" type="button" data-page="supplies" data-dashboard-link aria-label="Open supplies">
            <span class="pulse-icon" style="background:var(--rose)">${icon('icon-package')}</span>
            <div><p class="pulse-label">Inventory</p><p class="pulse-sub">Needs restock</p></div>
            <strong class="pulse-value">${Number(data.lowStockItems || 0).toLocaleString()}</strong>
          </button>
          <button class="pulse-item" type="button" data-page="kennel-stays" data-dashboard-link aria-label="Open kennel stays">
            <span class="pulse-icon" style="background:var(--blue)">${icon('icon-home')}</span>
            <div><p class="pulse-label">Kennels</p><p class="pulse-sub">Currently occupied</p></div>
            <strong class="pulse-value">${Number(data.kennelOccupied || 0).toLocaleString()}</strong>
          </button>
        </div>
      </aside>
    </div>

    <section class="stats-grid">
      ${stats.map(stat => `
        <button class="stat-card" type="button" data-page="${stat.page}" data-dashboard-link style="--accent:${stat.accent}" aria-label="Open ${escapeHtml(stat.label)}">
          <div class="stat-top">
            <span class="stat-icon">${icon(stat.icon)}</span>
            <span class="stat-trend">${escapeHtml(stat.trend)}</span>
          </div>
          <p class="stat-value">${escapeHtml(stat.value ?? 0)}</p>
          <p class="stat-label">${escapeHtml(stat.label)}</p>
        </button>
      `).join('')}
    </section>

    <section class="table-section">
      <h3 class="section-title">${icon('icon-calendar')} Recent Appointments</h3>
      <div class="table-container">
        <div class="table-scroll">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Pet</th><th>Vet</th><th>Date</th><th>Status</th><th>Reason</th></tr></thead>
            <tbody>
              ${(data.recentAppointments || []).length ? data.recentAppointments.map(row => `
                <tr>
                  <td>#${escapeHtml(row.appointment_id)}</td>
                  <td>${escapeHtml(row.pet_name)}</td>
                  <td>${escapeHtml(row.vet_name)}</td>
                  <td>${formatDate(row.appointment_date)}</td>
                  <td>${badge(row.status)}</td>
                  <td>${escapeHtml(row.reason || '-')}</td>
                </tr>
              `).join('') : `<tr><td colspan="6">${emptyState('icon-calendar', 'No recent appointments found')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  main.querySelectorAll('[data-dashboard-link]').forEach(item => {
    item.addEventListener('click', () => navigateToPage(item.dataset.page));
  });
}

function emptyState(iconId, message) {
  return `<div class="empty-state"><div class="icon-wrap">${icon(iconId)}</div><p>${escapeHtml(message)}</p></div>`;
}

async function renderCrud(main, endpoint, title, columns, formFn) {
  const data = await api(endpoint);
  const idCol = columns[0];
  const colHeaders = columns.map(column => `<th>${escapeHtml(humanize(column))}</th>`).join('');

  main.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${escapeHtml(title)}</h1>
        <p class="page-subtitle">${escapeHtml(pageConfig.get(currentPage)?.title || `Manage ${title.toLowerCase()}`)}</p>
      </div>
      <button class="btn btn-primary" id="btn-add" type="button">${icon('icon-plus')}Add ${escapeHtml(singular(title))}</button>
    </div>

    <div class="table-container">
      <div class="table-toolbar">
        <label class="search-box" for="search-input">
          ${icon('icon-search')}
          <input type="text" id="search-input" placeholder="Search ${escapeHtml(title.toLowerCase())}">
        </label>
        <span class="record-count">${icon('icon-activity')}${data.length} records</span>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr>${colHeaders}<th>Actions</th></tr></thead>
          <tbody id="table-body">
            ${data.length ? data.map(row => renderRow(row, columns, idCol)).join('') : `<tr><td colspan="${columns.length + 1}">${emptyState('icon-file', 'No records found')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', event => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll('#table-body tr').forEach(row => {
      row.style.display = (row.dataset.search || '').includes(query) ? '' : 'none';
    });
  });

  document.getElementById('btn-add').addEventListener('click', () => {
    formFn(null, async body => {
      await api(endpoint, 'POST', body);
      toast(`${singular(title)} created successfully`);
      loadPage(currentPage);
    });
  });

  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', () => {
      const row = data.find(item => String(item[idCol]) === String(button.dataset.id));
      formFn(row, async body => {
        await api(`${endpoint}/${button.dataset.id}`, 'PUT', body);
        toast(`${singular(title)} updated successfully`);
        loadPage(currentPage);
      });
    });
  });

  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', async () => {
      if (confirm('Delete this record?')) {
        await api(`${endpoint}/${button.dataset.id}`, 'DELETE');
        toast(`${singular(title)} deleted`);
        loadPage(currentPage);
      }
    });
  });
}

function renderRow(row, columns, idCol) {
  const search = columns.map(column => row[column] ?? '').join(' ').toLowerCase();
  return `
    <tr data-search="${escapeHtml(search)}">
      ${columns.map(column => `<td>${formatCell(column, row[column])}</td>`).join('')}
      <td>
        <div class="row-actions">
          <button class="btn btn-secondary btn-sm btn-edit" type="button" data-id="${escapeHtml(row[idCol])}">${icon('icon-edit')}Edit</button>
          <button class="btn btn-danger btn-sm btn-icon btn-delete" type="button" data-id="${escapeHtml(row[idCol])}" aria-label="Delete record" title="Delete">${icon('icon-trash')}</button>
        </div>
      </td>
    </tr>
  `;
}

function formatCell(column, value) {
  if (column === 'amount' || column === 'cost' || column === 'unit_price' || column === 'daily_rate') return escapeHtml(formatCurrency(value));
  if (column.includes('date') && value) return escapeHtml(formatDate(value));
  if (column === 'status' || column === 'membership_status') return badge(value);
  return escapeHtml(value ?? '-');
}

function field(label, name, type, value, opts = '') {
  const safeLabel = escapeHtml(label);
  const safeName = escapeHtml(name);
  if (type === 'select') {
    return `<div class="form-group"><label>${safeLabel}</label><select class="form-control" name="${safeName}" ${opts}>${value}</select></div>`;
  }
  if (type === 'textarea') {
    return `<div class="form-group"><label>${safeLabel}</label><textarea class="form-control" name="${safeName}" rows="3" ${opts}>${escapeHtml(value || '')}</textarea></div>`;
  }
  return `<div class="form-group"><label>${safeLabel}</label><input class="form-control" type="${escapeHtml(type)}" name="${safeName}" value="${escapeHtml(value || '')}" ${opts}></div>`;
}

function options(values, selected) {
  return values.map(value => `<option value="${escapeHtml(value)}" ${selected === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
}

function getFormData() {
  const data = {};
  document.querySelectorAll('#modal-body .form-control').forEach(element => {
    data[element.name] = element.value || null;
  });
  return data;
}

function ownerForm(row, onSave) {
  openModal(row ? 'Edit Owner' : 'Add Owner', `
    <div class="form-row">${field('First Name', 'first_name', 'text', row?.first_name, 'required')}${field('Last Name', 'last_name', 'text', row?.last_name, 'required')}</div>
    <div class="form-row">${field('Phone', 'phone', 'text', row?.phone, 'required')}${field('Email', 'email', 'email', row?.email, 'required')}</div>
    ${field('Address', 'address', 'text', row?.address)}
    <div class="form-row">
      ${field('Emergency Contact', 'emergency_contact', 'text', row?.emergency_contact)}
      ${field('Membership', 'membership_status', 'select', options(['Active', 'Inactive', 'Premium'], row?.membership_status))}
    </div>
  `, () => onSave(getFormData()));
}

async function petForm(row, onSave) {
  const owners = await api('owners');
  openModal(row ? 'Edit Pet' : 'Add Pet', `
    <div class="form-row">
      ${field('Name', 'name', 'text', row?.name, 'required')}
      ${field('Species', 'species', 'select', options(['Mammal', 'Avian', 'Reptile'], row?.species))}
    </div>
    <div class="form-row">
      ${field('Breed', 'breed', 'text', row?.breed)}
      ${field('Gender', 'gender', 'select', options(['Male', 'Female'], row?.gender))}
    </div>
    <div class="form-row">
      ${field('Date of Birth', 'date_of_birth', 'date', row?.date_of_birth?.slice(0, 10))}
      ${field('Owner', 'owner_id', 'select', owners.map(owner => `<option value="${escapeHtml(owner.owner_id)}" ${row?.owner_id == owner.owner_id ? 'selected' : ''}>${escapeHtml(`${owner.first_name} ${owner.last_name}`)}</option>`).join(''))}
    </div>
  `, () => onSave(getFormData()));
}

function vetForm(row, onSave) {
  openModal(row ? 'Edit Vet' : 'Add Vet', `
    <div class="form-row">${field('First Name', 'first_name', 'text', row?.first_name, 'required')}${field('Last Name', 'last_name', 'text', row?.last_name, 'required')}</div>
    <div class="form-row">${field('Phone', 'phone', 'text', row?.phone, 'required')}${field('Email', 'email', 'email', row?.email, 'required')}</div>
    ${field('Address', 'address', 'text', row?.address)}
    <div class="form-row">${field('Specialization', 'specialization', 'text', row?.specialization, 'required')}${field('License Number', 'license_number', 'text', row?.license_number, 'required')}</div>
    ${field('Hire Date', 'hire_date', 'date', row?.hire_date?.slice(0, 10), 'required')}
  `, () => onSave(getFormData()));
}

async function appointmentForm(row, onSave) {
  const pets = await api('pets');
  const vets = await api('vets');
  openModal(row ? 'Edit Appointment' : 'New Appointment', `
    <div class="form-row">
      ${field('Pet', 'pet_id', 'select', pets.map(pet => `<option value="${escapeHtml(pet.pet_id)}" ${row?.pet_id == pet.pet_id ? 'selected' : ''}>${escapeHtml(pet.name)}</option>`).join(''))}
      ${field('Vet', 'vet_id', 'select', vets.map(vet => `<option value="${escapeHtml(vet.vet_id)}" ${row?.vet_id == vet.vet_id ? 'selected' : ''}>${escapeHtml(`${vet.first_name} ${vet.last_name}`)}</option>`).join(''))}
    </div>
    <div class="form-row">
      ${field('Date & Time', 'appointment_date', 'datetime-local', row?.appointment_date?.slice(0, 16), 'required')}
      ${field('Status', 'status', 'select', options(['Scheduled', 'Completed', 'Cancelled', 'No-Show'], row?.status))}
    </div>
    ${field('Reason', 'reason', 'text', row?.reason)}
    ${field('Notes', 'notes', 'textarea', row?.notes)}
  `, () => onSave(getFormData()));
}

function procedureForm(row, onSave) {
  openModal(row ? 'Edit Procedure' : 'Add Procedure', `
    ${field('Name', 'name', 'text', row?.name, 'required')}
    ${field('Description', 'description', 'textarea', row?.description)}
    ${field('Cost (Rs.)', 'cost', 'number', row?.cost, 'required min="0" step="0.01"')}
  `, () => onSave(getFormData()));
}

async function vaccinationForm(row, onSave) {
  const pets = await api('pets');
  const vets = await api('vets');
  openModal(row ? 'Edit Vaccination' : 'Add Vaccination', `
    <div class="form-row">
      ${field('Pet', 'pet_id', 'select', pets.map(pet => `<option value="${escapeHtml(pet.pet_id)}" ${row?.pet_id == pet.pet_id ? 'selected' : ''}>${escapeHtml(pet.name)}</option>`).join(''))}
      ${field('Vet', 'vet_id', 'select', vets.map(vet => `<option value="${escapeHtml(vet.vet_id)}" ${row?.vet_id == vet.vet_id ? 'selected' : ''}>${escapeHtml(`${vet.first_name} ${vet.last_name}`)}</option>`).join(''))}
    </div>
    ${field('Vaccine Name', 'name', 'text', row?.name, 'required')}
    <div class="form-row">
      ${field('Date Administered', 'date_administered', 'date', row?.date_administered?.slice(0, 10), 'required')}
      ${field('Next Due Date', 'next_due_date', 'date', row?.next_due_date?.slice(0, 10))}
    </div>
  `, () => onSave(getFormData()));
}

async function medicalRecordForm(row, onSave) {
  const appointments = await api('appointments');
  openModal(row ? 'Edit Medical Record' : 'Add Medical Record', `
    <div class="form-row">
      ${field('Appointment', 'appointment_id', 'select', appointments.map(appt => `<option value="${escapeHtml(appt.appointment_id)}" ${row?.appointment_id == appt.appointment_id ? 'selected' : ''}>#${escapeHtml(appt.appointment_id)} - ${escapeHtml(appt.pet_name)} (${formatDate(appt.appointment_date)})</option>`).join(''))}
      ${field('Type', 'record_type', 'select', options(['General', 'Surgery', 'Wellness'], row?.record_type))}
    </div>
    ${field('Diagnosis', 'diagnosis', 'textarea', row?.diagnosis, 'required')}
    ${field('Treatment', 'treatment', 'textarea', row?.treatment)}
    ${field('Notes', 'notes', 'textarea', row?.notes)}
    ${field('Record Date', 'record_date', 'date', row?.record_date?.slice(0, 10), 'required')}
  `, () => onSave(getFormData()));
}

async function billForm(row, onSave) {
  const appointments = await api('appointments');
  openModal(row ? 'Edit Bill' : 'Add Bill', `
    ${field('Appointment', 'appointment_id', 'select', appointments.map(appt => `<option value="${escapeHtml(appt.appointment_id)}" ${row?.appointment_id == appt.appointment_id ? 'selected' : ''}>#${escapeHtml(appt.appointment_id)} - ${escapeHtml(appt.pet_name)}</option>`).join(''))}
    <div class="form-row">
      ${field('Amount (Rs.)', 'amount', 'number', row?.amount, 'required min="0" step="0.01"')}
      ${field('Status', 'status', 'select', options(['Pending', 'Paid', 'Overdue', 'Cancelled'], row?.status))}
    </div>
    <div class="form-row">
      ${field('Bill Date', 'bill_date', 'date', row?.bill_date?.slice(0, 10), 'required')}
      ${field('Payment Method', 'payment_method', 'select', `<option value="">Select...</option>${options(['Cash', 'Card', 'Insurance', 'Online'], row?.payment_method)}`)}
    </div>
  `, () => onSave(getFormData()));
}

function supplyForm(row, onSave) {
  openModal(row ? 'Edit Supply' : 'Add Supply', `
    <div class="form-row">
      ${field('Name', 'name', 'text', row?.name, 'required')}
      ${field('Category', 'category', 'select', options(['Medication', 'Equipment', 'Consumable', 'Vaccine'], row?.category))}
    </div>
    <div class="form-row">
      ${field('Quantity', 'quantity', 'number', row?.quantity, 'required min="0"')}
      ${field('Unit Price (Rs.)', 'unit_price', 'number', row?.unit_price, 'required min="0" step="0.01"')}
    </div>
    <div class="form-row">
      ${field('Reorder Level', 'reorder_level', 'number', row?.reorder_level, 'min="0"')}
      ${field('Supplier', 'supplier', 'text', row?.supplier)}
    </div>
    ${field('Last Restocked', 'last_restocked', 'date', row?.last_restocked?.slice(0, 10))}
  `, () => onSave(getFormData()));
}

async function kennelForm(row, onSave) {
  const pets = await api('pets');
  const rooms = await api('clinic-rooms');
  const kennelRooms = rooms.filter(room => room.type === 'Kennel');
  openModal(row ? 'Edit Kennel Stay' : 'Add Kennel Stay', `
    <div class="form-row">
      ${field('Pet', 'pet_id', 'select', pets.map(pet => `<option value="${escapeHtml(pet.pet_id)}" ${row?.pet_id == pet.pet_id ? 'selected' : ''}>${escapeHtml(pet.name)}</option>`).join(''))}
      ${field('Room', 'room_id', 'select', kennelRooms.map(room => `<option value="${escapeHtml(room.room_id)}" ${row?.room_id == room.room_id ? 'selected' : ''}>${escapeHtml(room.room_number)} (${escapeHtml(room.status)})</option>`).join(''))}
    </div>
    <div class="form-row">
      ${field('Check-in Date', 'check_in_date', 'date', row?.check_in_date?.slice(0, 10), 'required')}
      ${field('Check-out Date', 'check_out_date', 'date', row?.check_out_date?.slice(0, 10))}
    </div>
    ${field('Daily Rate (Rs.)', 'daily_rate', 'number', row?.daily_rate, 'required min="0" step="0.01"')}
  `, () => onSave(getFormData()));
}

async function roomForm(row, onSave) {
  openModal(row ? 'Edit Room' : 'Add Room', `
    ${field('Room Number', 'room_number', 'text', row?.room_number, 'required')}
    <div class="form-row">
      ${field('Type', 'type', 'select', options(['Examination', 'Surgery', 'Recovery', 'Kennel'], row?.type))}
      ${field('Status', 'status', 'select', options(['Available', 'Occupied', 'Maintenance'], row?.status))}
    </div>
  `, () => onSave(getFormData()));
}

function tickClock() {
  document.getElementById('clock-label').textContent = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}

async function initApp() {
  setupSidebarToggle();
  setupAuthForm();
  renderNav();
  tickClock();
  setInterval(tickClock, 30000);

  const params = new URLSearchParams(window.location.search);
  const verifyToken = params.get('verifyToken');
  if (verifyToken) {
    setAuthMode('guest');
    try {
      const data = await verifyEmailToken(verifyToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      showAuthNotice(data.message || 'Email verified. You can now sign in.', 'success');
    } catch (err) {
      showAuthNotice(err.message || 'Verification failed');
    }
    return;
  }

  if (!authToken) {
    updateUserPill();
    setAuthMode('guest');
    return;
  }

  try {
    const data = await api('auth/me');
    currentUser = data.user;
    updateUserPill();
    setAuthMode('authenticated');
    await loadPage(currentPage);
  } catch {
    authToken = null;
    currentUser = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    updateUserPill();
    setAuthMode('guest');
  }
}

initApp();
