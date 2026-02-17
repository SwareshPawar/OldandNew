const { URL } = require('url');

async function login() {
  const baseUrl = process.env.API_BASE_URL || 'https://oldand-new.vercel.app';
  const usernameOrEmail = process.env.LOGIN_USERNAME_OR_EMAIL || process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;

  if (!usernameOrEmail || !password) {
    console.error('Missing LOGIN_USERNAME_OR_EMAIL (or LOGIN_EMAIL) or LOGIN_PASSWORD environment variables.');
    process.exit(1);
  }

  const url = new URL('/api/login', baseUrl).toString();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usernameOrEmail, password })
    });

    const text = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      console.error(`Login failed: HTTP ${response.status}`);
      console.error(payload);
      process.exit(1);
    }

    console.log('Login succeeded.');
    console.log(payload);
  } catch (error) {
    console.error('Request failed:', error.message);
    process.exit(1);
  }
}

login();
