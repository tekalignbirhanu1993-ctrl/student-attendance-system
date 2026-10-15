
document.addEventListener('DOMContentLoaded', () => {
  const A = window.App;
  if (!A) return;

  const { data, store } = A;
  const content = document.getElementById('page-content');

  function render() {
    const today = store.today();
    const currentData = store.get();

    const todays = currentData.attendance.filter(
      record => record.date === today
    );

    const active = currentData.students.filter(
      student => student.status !== 'inactive'
    );

    const count = status =>
      todays.filter(record => record.status === status).length;

    const marked = todays.length;
    const percent = marked
      ? Math.round(count('present') / marked * 100)
      : 0;

    const grades = [9, 10, 11, 12].map(grade => {
      const students = active.filter(
        student => student.grade === grade
      );

      const records = todays.filter(record =>
        students.some(student => student.id === record.studentId)
      );

      return {
        grade,
        percent: records.length
          ? Math.round(
              records.filter(record => record.status === 'present')
                .length / records.length * 100
            )
          : 0
      };
    });

    content.innerHTML = `
      <div class="page-heading">
        <div>
          <span class="eyebrow">SCHOOL OVERVIEW</span>
          <h1>Good morning, ${A.esc(A.user.name.split(' ')[0])} 👋</h1>
          <p>
            Here's your school's attendance snapshot for
            ${A.formatDate(today)}.
          </p>
        </div>

        <div class="heading-actions">
          <button class="button secondary" id="reset-demo">
            Reset demo data
          </button>
          <a class="button primary" href="reports.html">
            View reports ↗
          </a>
        </div>
      </div>

      <div class="stats-grid">
        ${stat('♙', 'Total students', active.length, 'Across Grades 9–12')}
        ${stat('♧', 'Teachers', currentData.teachers.length, 'Teacher accounts')}
        ${stat('✓', 'Present today', count('present'), `${percent}% of marked students`)}
        ${stat('◷', 'Absent / late', `${count('absent')} / ${count('late')}`, 'Requires follow-up')}
      </div>

      <div class="content-grid">
        <section class="panel">
          <header class="panel-header">
            <div>
              <h2>Attendance by grade</h2>
              <p>Present share of today's marked records</p>
            </div>
          </header>

          <div class="panel-body">
            <div class="grade-bars">
              ${grades.map(item => `
                <div class="grade-row">
                  <span>Grade ${item.grade}</span>
                  <div class="grade-track">
                    <div class="grade-fill"
                         style="width:${item.percent}%"></div>
                  </div>
                  <strong>${item.percent}%</strong>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="panel">
          <header class="panel-header">
            <div>
              <h2>Quick actions</h2>
              <p>Common school operations</p>
            </div>
          </header>

          <div class="panel-body quick-actions">
            <button class="button primary full-width" id="add-student">
              ＋ Add student
            </button>
            <a class="button secondary full-width" href="attendance.html">
              Take attendance →
            </a>
            <a class="button secondary full-width" href="reports.html">
              Export reports ↗
            </a>
          </div>
        </section>
      </div>

      <section class="panel">
        <header class="panel-header">
          <div>
            <h2>Student directory</h2>
            <p>Manage student roster and grade placement</p>
          </div>
          <button class="button primary" id="add-student-2">
            ＋ Add student
          </button>
        </header>

        <div class="table-toolbar">
          <input class="field search" id="student-search"
                 placeholder="Search student name or ID…"
                 aria-label="Search students">

          <select class="field" id="grade-filter">
            <option value="">All grades</option>
            ${[9, 10, 11, 12].map(grade =>
              `<option value="${grade}">Grade ${grade}</option>`
            ).join('')}
          </select>

          <select class="field" id="section-filter">
            <option value="">All sections</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="student-rows"></tbody>
          </table>
        </div>
      </section>
    `;

    function stat(icon, label, value, foot) {
      return `
        <article class="stat-card">
          <div class="stat-head">
            <span>${label}</span>
            <span class="stat-icon">${icon}</span>
          </div>
          <strong class="stat-value">${value}</strong>
          <div class="stat-foot">${foot}</div>
        </article>
      `;
    }

    document.getElementById('reset-demo').onclick = () => {
      A.modal(
        'Reset demonstration data',
        `
          <p>
            Restore the original sample students and attendance records?
            Changes made in this browser will be lost.
          </p>
          <div class="modal-actions">
            <button class="button ghost" id="cancel-reset">
              Cancel
            </button>
            <button class="button danger" id="confirm-reset">
              Reset data
            </button>
          </div>
        `
      );
    };

    document.getElementById('add-student').onclick =
      document.getElementById('add-student-2').onclick =
        () => studentModal();

    ['student-search', 'grade-filter', 'section-filter'].forEach(id => {
      document.getElementById(id).addEventListener('input', renderRows);
    });

    function renderRows() {
      const query = document.getElementById('student-search')
        .value.toLowerCase();

      const grade = document.getElementById('grade-filter').value;
      const section = document.getElementById('section-filter').value;

      const students = store.get().students.filter(student =>
        student.status !== 'inactive' &&
        (!grade || String(student.grade) === grade) &&
        (!section || student.section === section) &&
        `${student.name} ${student.id}`.toLowerCase().includes(query)
      );

      document.getElementById('student-rows').innerHTML =
        students.length
          ? students.map(student => `
              <tr>
                <td>
                  <div class="student-cell">
                    <span class="student-initial">
                      ${A.esc(student.name.split(' ')
                        .map(part => part[0]).slice(0, 2).join(''))}
                    </span>
                    <span>
                      <b>${A.esc(student.name)}</b>
                      <small>${A.esc(student.id)}</small>
                    </span>
                  </div>
                </td>
                <td>Grade ${student.grade}</td>
                <td>${A.esc(student.section)}</td>
                <td><span class="status present">Active</span></td>
                <td>
                  <button class="button ghost edit-student"
                          data-id="${student.id}">Edit</button>
                  <button class="button ghost deactivate-student"
                          data-id="${student.id}">Deactivate</button>
                </td>
              </tr>
            `).join('')
          : `
              <tr>
                <td colspan="5">
                  <div class="empty-state">
                    No students match these filters.
                  </div>
                </td>
              </tr>
            `;

      document.querySelectorAll('.edit-student').forEach(button => {
        button.onclick = () => studentModal(button.dataset.id);
      });

      document.querySelectorAll('.deactivate-student').forEach(button => {
        button.onclick = () => {
          const student = store.get().students.find(
            item => item.id === button.dataset.id
          );

          A.modal(
            'Deactivate student',
            `
              <p>
                Deactivate <b>${A.esc(student.name)}</b>?
                Their attendance history will be retained.
              </p>
              <div class="modal-actions">
                <button class="button ghost" id="cancel-deactivate">
                  Cancel
                </button>
                <button class="button danger" id="confirm-deactivate">
                  Deactivate
                </button>
              </div>
            `
          );

          document.getElementById('cancel-deactivate').onclick =
            A.closeModal;

          document.getElementById('confirm-deactivate').onclick = () => {
            student.status = 'inactive';

            store.addActivity(
              'Deactivated student ' + student.name,
              A.user.name
            );

            store.save();
            A.closeModal();
            A.toast('Student deactivated. History retained.');
            render();
          };
        };
      });
    }

    function studentModal(id) {
      const existing = id
        ? store.get().students.find(student => student.id === id)
        : null;

      const student = existing || {
        name: '',
        id: '',
        grade: 9,
        section: 'A',
        email: ''
      };

      A.modal(
        id ? 'Edit student' : 'Add student',
        `
          <form id="student-form">
            <div class="form-grid">
              <div class="form-field">
                <label for="sid">Student ID</label>
                <input id="sid" required
                       value="${A.esc(student.id)}"
                       ${id ? 'readonly' : ''}
                       placeholder="e.g. s-018">
              </div>

              <div class="form-field">
                <label for="sname">Full name</label>
                <input id="sname" required
                       value="${A.esc(student.name)}"
                       placeholder="Student full name">
              </div>

              <div class="form-field">
                <label for="sgrade">Grade</label>
                <select id="sgrade">
                  ${[9, 10, 11, 12].map(grade => `
                    <option value="${grade}"
                      ${student.grade === grade ? 'selected' : ''}>
                      ${grade}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-field">
                <label for="ssection">Section</label>
                <select id="ssection">
                  ${['A', 'B', 'C'].map(section => `
                    <option value="${section}"
                      ${student.section === section ? 'selected' : ''}>
                      ${section}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-field full">
                <label for="semail">Email (optional)</label>
                <input id="semail" type="email"
                       value="${A.esc(student.email || '')}"
                       placeholder="student@example.com">
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="button ghost"
                      id="cancel-student">Cancel</button>
              <button class="button primary" type="submit">
                Save student
              </button>
            </div>
          </form>
        `
      );

      document.getElementById('cancel-student').onclick = A.closeModal;

      document.getElementById('student-form').onsubmit = event => {
        event.preventDefault();

        const currentData = store.get();
        const studentId = document.getElementById('sid')
          .value.trim();

        if (
          !id &&
          currentData.students.some(item =>
            item.id.toLowerCase() === studentId.toLowerCase()
          )
        ) {
          A.toast('That student ID already exists.', 'error');
          return;
        }

        const updated = {
          id: studentId,
          name: document.getElementById('sname').value.trim(),
          grade: Number(document.getElementById('sgrade').value),
          section: document.getElementById('ssection').value,
          email: document.getElementById('semail').value.trim(),
          status: 'active'
        };

        if (id) {
          Object.assign(existing, updated);
        } else {
          currentData.students.push(updated);
        }

        store.addActivity(
          (id ? 'Updated ' : 'Added ') + updated.name,
          A.user.name
        );

        store.save();
        A.closeModal();
        A.toast('Student record saved.');
        render();
      };
    }

    renderRows();
  }

  document.addEventListener('click', event => {
    if (event.target.id === 'cancel-reset') {
      A.closeModal();
    }

    if (event.target.id === 'confirm-reset') {
      store.reset();
      A.closeModal();
      A.toast('Demo data restored.');
      render();
    }
  });

  render();
});
