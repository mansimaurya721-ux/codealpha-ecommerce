(function () {
  function getNextUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('next') || '/index.html';
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('alert-box');
      alertBox.classList.remove('show');

      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.textContent = 'Logging in…';

      try {
        const { token, user } = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
          })
        });
        setToken(token);
        setUser(user);
        window.location.href = getNextUrl();
      } catch (err) {
        alertBox.textContent = err.message;
        alertBox.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Log in';
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('alert-box');
      alertBox.classList.remove('show');

      const btn = document.getElementById('register-btn');
      btn.disabled = true;
      btn.textContent = 'Creating account…';

      try {
        const { token, user } = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
          })
        });
        setToken(token);
        setUser(user);
        window.location.href = getNextUrl();
      } catch (err) {
        alertBox.textContent = err.message;
        alertBox.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Create account';
      }
    });
  }
})();
