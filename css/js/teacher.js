
document.addEventListener('DOMContentLoaded', () => {
  const A = window.App;
  if (!A) return;

  const { store } = A;
  const content = document.getElementById('page-content');
  const today = store.today();

  const myClasses = store.get().classes.filter(
    item => item.teacherId === A.user.teacherId
  );

  const data = store.get();

  const assignedStudents = data.students.filter(student =>
    myClasses.some(item =>
      item.id === `${student.grade}-${student.section}`
    )
  );

  const todayRecords = data.attendance.filter(record =>
    record.date === today &&
    record.recordedBy === A.user.teacherId
  );

  content.innerHTML = `
    <div class="page-heading">
      <div>
        <span class="eyebrow">TEACHER WORKSPACE</span>
        <h1>Your classes</h1>
        <p>Review your classes and take attendance for today.</p>
      </div>
      <a class="button primary" href="attendance.html">
        ✓ Take attendance
      </a>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-head">
          Assigned classes <span class="stat-icon">▦</span>
        </div>
        <strong class="stat-value">${myClasses.length}</strong>
        <div class="stat-foot">Across Grades 9–12</div>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          Students in assigned classes
          <span class="stat-icon">♙</span>
        </div>
        <strong class="stat-value">${assignedStudents.length}</strong>
        <div class="stat-foot">Active student roster</div>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          Records today <span class="stat-icon">✓</span>
        </div>
        <strong class="stat-value">${todayRecords.length}</strong>
        <div class="stat-foot">Attendance entries</div>
      </article>

      <article class="stat-card">
        <div class="stat-head">
          Today's date <span class="stat-icon">◷</span>
        </div>
        <strong class="stat-value" style="font-size:18px">
          ${A.formatDate(today)}
        </strong>
        <div class="stat-foot">Local device date</div>
      </article>
    </div>

    <section class="panel">
      <header class="panel-header">
        <div>
          <h2>Assigned classes</h2>
          <p>Choose a class to open its attendance register.</p>
        </div>
      </header>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Students</th>
              <th>Today's marked</th>
              <th>Completion</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${myClasses.map(item => {
              const students = data.students.filter(student =>
                student.status !== 'inactive' &&
                `${student.grade}-${student.section}` === item.id
              );

              const records = data.attendance.filter(record =>
                record.date === today && record.classId === item.id
              );

              const percent = students.length
                ? Math.round(records.length / students.length * 100)
                : 0;

              return `
                <tr>
                  <td><b>${A.esc(item.name)}</b></td>
                  <td>${students.length}</td>
                  <td>${records.length}</td>
                  <td>
                    <div class="progress-track" style="width:100px">
                      <div class="progress-fill"
                           style="width:${percent}%"></div>
                    </div>
                    <small>${percent}%</small>
                  </td>
                  <td>
                    <a class="button secondary"
                       href="attendance.html?class=${item.id}">
                      Open register →
                    </a>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <div class="notice" style="margin-top:18px">
      This prototype displays demo role restrictions.
      Production access must be enforced by a server.
    </div>
  `;
});
