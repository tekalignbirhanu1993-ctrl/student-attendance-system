
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const error = document.getElementById('login-error');

  // Restore a remembered username.
  const remembered = localStorage.getItem(
    'northstarRememberedUsername'
  );

  if (remembered) {
    username.value = remembered;
    document.getElementById('remember').checked = true;
  }

  // Show or hide the password.
  document
    .getElementById('toggle-password')
    .addEventListener('click', event => {
      const show = password.type === 'password';

      password.type = show ? 'text' : 'password';
      event.currentTarget.textContent = show ? 'Hide' : 'Show';

      event.currentTarget.setAttribute(
        'aria-label',
        show ? 'Hide password' : 'Show password'
      );
    });

  // Fill demo credentials using the account buttons.
  document.querySelectorAll('[data-demo-user]').forEach(button => {
    button.addEventListener('click', () => {
      username.value = button.dataset.demoUser;
      password.value = 'demo123';
      error.hidden = true;
    });
  });

  // Validate the demo login.
  form.addEventListener('submit', event => {
    event.preventDefault();

    const button = document.getElementById('login-button');
    const enteredUsername = username.value.trim().toLowerCase();
    const enteredPassword = password.value;

    const user = AttendanceStore.get().users.find(account =>
      account.username.toLowerCase() === enteredUsername &&
      account.password === enteredPassword
    );

    if (!user) {
      error.textContent =
        'Those details did not match a demo account. ' +
        'Try owner, teacher, or student with demo123.';
      error.hidden = false;
      return;
    }

    if (document.getElementById('remember').checked) {
      localStorage.setItem(
        'HighschoolRememberedUsername',
        enteredUsername
      );
    } else {
      localStorage.removeItem('HighschoolRememberedUsername');
    }

    // Store the current demo session.
    sessionStorage.setItem(
      'northstarCurrentUser',
      JSON.stringify({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        teacherId: user.teacherId,
        studentId: user.studentId
      })
    );

    button.disabled = true;
    button.textContent = 'Opening your portal…';

    const pages = {
      owner: 'admin.html',
      teacher: 'teacher.html',
      student: 'student.html'
    };

    location.href = pages[user.role];
  });
});
