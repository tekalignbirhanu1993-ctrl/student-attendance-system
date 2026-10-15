
document.addEventListener('DOMContentLoaded', () => {
  const A = window.App;
  if (!A) return;

  const { store, user } = A;
  const content = document.getElementById('page-content');
  const studentId = user.studentId || 's-001';

  function render() {
    const data = store.get();

    const student =
      data.students.find(item => item.id === studentId) ||
      data.students[0];

    const records = data.attendance
      .filter(record => record.studentId === student.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };

    records.forEach(record => {
      counts[record.status] = (counts[record.status] || 0) + 1;
    });

    const counted = counts.present + counts.absent + counts.late;

    const percent = counted
      ? Math.round(counts.present / counted * 100)
      : 0;

    content.innerHTML = `
      <div class="page-heading">
        <div>
          <span class="eyebrow">STUDENT PORTAL</span>
          <h1>My attendance</h1>
          <p>Your personal attendance overview and recent records.</p>
        </div>
      </div>

      <section class="student-hero">
        <div>
          <span class="eyebrow light">YOUR PROFILE</span>
          <h2>${A.esc(student.name)}</h2>
          <p>
            Student ID: ${A.esc(student.id)} ·
            Grade ${student.grade}, Section ${student.section}
          </p>
        </div>
        <span class="profile-avatar">
          ${A.esc(student.name.split(' ')
            .map(part => part[0]).slice(0, 2).join(''))}
        </span>
      </section>

      <div class="stats-grid">
        <article class="stat-card">
          <div class="stat-head">
            Attendance rate <span class="stat-icon">◔</span>
          </div>
          <strong class="stat-value">${percent}%</strong>
          <div class="progress-track">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>
          <div class="stat-foot">
            Excused records are excluded from the calculation.
          </div>
        </article>

        ${stat('✓', 'Present', counts.present)}
        ${stat('!', 'Absent', counts.absent)}
        ${stat('◷', 'Late', counts.late)}
      </div>

      <section class="panel">
        <header class="panel-header">
          <div>
            <h2>Recent attendance history</h2>
            <p>Most recent records first</p>
          </div>

          <select class="field" id="month-filter">
            <option value="">All dates</option>
            ${[...new Set(records.map(record =>
              record.date.slice(0, 7)
            ))].map(month => `
              <option value="${month}">
                ${new Date(month + '-15T12:00:00')
                  .toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric'
                  })}
              </option>
            `).join('')}
          </select>
        </header>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Class</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody id="history-rows"></tbody>
          </table>
        </div>
      </section>

      <div class="notice" style="margin-top:18px">
        This is a read-only student view. Attendance is recorded by
        authorized school staff.
      </div>
    `;

    function stat(icon, label, value) {
      return `
        <article class="stat-card">
          <div class="stat-head">
            ${label}<span class="stat-icon">${icon}</span>
          </div>
          <strong class="stat-value">${value}</strong>
          <div class="stat-foot">Recorded attendance days</div>
        </article>
      `;
    }

    function renderRows() {
      const month = document.getElementById('month-filter').value;

      const filtered = records.filter(record =>
        !month || record.date.startsWith(month)
      );

      document.getElementById('history-rows').innerHTML =
        filtered.length
          ? filtered.map(record => `
              <tr>
                <td>${A.formatDate(record.date)}</td>
                <td>Grade ${A.esc(record.classId)}</td>
                <td>${A.statusBadge(record.status)}</td>
                <td>${A.esc(record.remarks || '—')}</td>
              </tr>
            `).join('')
          : `
              <tr>
                <td colspan="4">
                  <div class="empty-state">
                    No attendance records for this period.
                  </div>
                </td>
              </tr>
            `;
    }

    document.getElementById('month-filter').onchange = renderRows;
    renderRows();
  }

  render();
});
