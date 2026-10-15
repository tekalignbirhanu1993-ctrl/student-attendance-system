
(function () {
  const store = AttendanceStore;
  const data = store.get();
  const page = document.body.dataset.page;
  const role = document.body.dataset.role;

  let user;

  try {
    user = JSON.parse(
      sessionStorage.getItem('HighschoolCurrentUser') || 'null'
    );
  } catch (error) {
    user = null;
  }

  // Redirect users who are not signed in with the expected demo role.
  if (!user || user.role !== role) {
    location.replace('login.html');
    return;
  }

  const navItems = role === 'owner'
    ? [
        ['admin.html', '▦', 'Overview', 'admin'],
        ['reports.html', '▤', 'Reports', 'reports']
      ]
    : role === 'teacher'
      ? [
          ['teacher.html', '▦', 'My classes', 'teacher'],
          ['attendance.html', '✓', 'Take attendance', 'attendance']
        ]
      : [
          ['student.html', '◷', 'My attendance', 'student']
        ];

  const current = navItems.find(item => item[3] === page);
  const shell = document.getElementById('app-shell');

  shell.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <a class="brand" href="index.html">
          <span class="brand-mark">N</span>
          <span>
            Northstar High
            <small>ATTENDANCE PORTAL</small>
          </span>
        </a>

        <div class="nav-label">WORKSPACE</div>

        <nav class="side-nav">
          ${navItems.map(item => `
            <a href="${item[0]}"
               class="${item[3] === page ? 'active' : ''}">
              <span class="nav-symbol">${item[1]}</span>
              ${item[2]}
            </a>
          `).join('')}

          ${role === 'owner' ? `
            <a href="teacher.html">
              <span class="nav-symbol">♙</span>
              Teacher preview
            </a>
            <a href="student.html">
              <span class="nav-symbol">◉</span>
              Student preview
            </a>
          ` : ''}
        </nav>

        <div class="sidebar-bottom">
          <nav class="side-nav">
            <button id="theme-toggle">
              <span class="nav-symbol">◐</span>
              Toggle appearance
            </button>
            <button id="logout-button">
              <span class="nav-symbol">↪</span>
              Sign out
            </button>
          </nav>
        </div>
      </aside>

      <main class="app-main">
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-toggle" id="menu-toggle"
                    aria-label="Toggle navigation">☰</button>
            <span class="breadcrumb">
              Portal / ${current ? current[2] : page}
            </span>
          </div>

          <div class="topbar-right">
            <button class="icon-button" id="theme-shortcut"
                    title="Toggle appearance"
                    aria-label="Toggle appearance">◐</button>

            <div class="profile-chip">
              <span class="profile-avatar">
                ${user.name.split(' ').map(x => x[0]).slice(0, 2).join('')}
              </span>
              <span>
                <b>${esc(user.name)}</b>
                <small>
                  ${role === 'owner'
                    ? 'Owner / Super Admin'
                    : role === 'teacher'
                      ? 'Teacher / Member'
                      : 'Student'}
                </small>
              </span>
            </div>
          </div>
        </header>

        <section class="page-content" id="page-content"></section>
      </main>
    </div>

    <div class="toast-region" id="toast-region"
         aria-live="polite"></div>
    <div id="modal-root"></div>
  `;

  // Sign out.
  document.getElementById('logout-button').onclick = () => {
    sessionStorage.removeItem('HighschoolCurrentUser');
    location.href = 'login.html';
  };

  // Light and dark appearance.
  const toggleTheme = () => {
    document.body.classList.toggle('dark');

    localStorage.setItem(
      'northstarTheme',
      document.body.classList.contains('dark') ? 'dark' : 'light'
    );
  };

  if (localStorage.getItem('northstarTheme') === 'dark') {
    document.body.classList.add('dark');
  }

  document.getElementById('theme-toggle').onclick = toggleTheme;
  document.getElementById('theme-shortcut').onclick = toggleTheme;

  // Mobile sidebar.
  document.getElementById('menu-toggle').onclick = () => {
    document.getElementById('sidebar')
      .classList.toggle('sidebar-open');
  };

  // Shared functions used by the page-specific JavaScript files.
  window.App = {
    store,
    data,
    user,
    role,
    page,
    esc,
    toast,
    modal,
    closeModal,
    studentsForClass,
    recordsForDate,
    statusBadge,
    formatDate,
    saveAndRefresh: () => {
      store.save();
    }
  };

  // Escape text before inserting it into HTML.
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  // Small notification messages.
  function toast(message, type = 'success') {
    const element = document.createElement('div');

    element.className =
      'toast ' +
      (type === 'error'
        ? 'error'
        : type === 'warning'
          ? 'warning'
          : '');

    element.textContent = message;
    document.getElementById('toast-region').append(element);

    setTimeout(() => element.remove(), 3200);
  }

  // Reusable modal dialog.
  function modal(title, body) {
    const root = document.getElementById('modal-root');

    root.innerHTML = `
      <div class="modal-backdrop" role="presentation">
        <section class="modal" role="dialog"
                 aria-modal="true"
                 aria-label="${esc(title)}">
          <header class="modal-header">
            <h2>${esc(title)}</h2>
            <button class="icon-button" id="modal-close"
                    aria-label="Close dialog">×</button>
          </header>
          <div class="modal-body">${body}</div>
        </section>
      </div>
    `;

    root.querySelector('.modal-backdrop').addEventListener(
      'click',
      event => {
        if (event.target.classList.contains('modal-backdrop')) {
          closeModal();
        }
      }
    );

    document.getElementById('modal-close').onclick = closeModal;
  }

  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
  }

  function studentsForClass(classId) {
    return data.students.filter(student =>
      student.status !== 'inactive' &&
      `${student.grade}-${student.section}` === classId
    );
  }

  function recordsForDate(date) {
    return data.attendance.filter(record => record.date === date);
  }

  function statusBadge(status) {
    const labels = {
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      excused: 'Excused',
      unmarked: 'Not marked'
    };

    return `
      <span class="status ${status || 'unmarked'}">
        ${labels[status] || 'Not marked'}
      </span>
    `;
  }

  function formatDate(date) {
    if (!date) return '—';

    return new Date(date + 'T12:00:00').toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  }

  // Warn if an attendance page has unsaved changes.
  window.addEventListener('beforeunload', event => {
    if (window.AttendanceUnsaved) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
})();
