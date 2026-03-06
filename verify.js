import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://sqxezltdeebvhgxsgxfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeGV6bHRkZWVidmhneHNneGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTEzMjksImV4cCI6MjA4NDYyNzMyOX0.e0umAA6TsX2KPpz2evkizsYsqZWpbsWwqBus7RoUbFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statusEl = document.getElementById('status');

function setContent(html) {
  statusEl.innerHTML = html;
}

async function verifyEmail() {
  // Check for PKCE flow (token_hash in query string)
  const queryParams = new URLSearchParams(window.location.search);
  const token_hash = queryParams.get('token_hash');
  const type = queryParams.get('type'); // 'signup' or 'email'

  // Check for implicit flow (access_token in URL fragment)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const access_token = hashParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token');
  const fragmentType = hashParams.get('type'); // usually 'signup'

  if (token_hash && type) {
    // PKCE flow
    setContent(`<p class="loading">Verifying your email...</p>`);

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (error) {
      console.error('Verification error:', error);
      if (error.message.includes('Email link is invalid or has expired') || error.status === 403) {
        setContent(`
          <h1>Verification link no longer valid</h1>
          <p>The link you clicked may have already been used or has expired.</p>
          <p>If you still need to verify your email, please request a new confirmation email from the app.</p>
          <a class="button" href="index.html">Go to login</a>
        `);
      } else {
        setContent(`
          <h1>Verification failed</h1>
          <p class="error">${error.message}</p>
          <a class="button" href="index.html">Try again</a>
        `);
      }
      return;
    }

    // Verification successful – get session
    const { data: { session } } = await supabase.auth.getSession();
    await handleSuccessfulVerification(session);

  } else if (access_token && refresh_token && fragmentType === 'signup') {
    // Implicit flow
    setContent(`<p class="loading">Verifying your email...</p>`);

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error('Session error:', error);
      setContent(`
        <h1>Verification failed</h1>
        <p class="error">${error.message}</p>
        <a class="button" href="index.html">Try again</a>
      `);
      return;
    }

    // Get the updated session
    const { data: { session } } = await supabase.auth.getSession();
    await handleSuccessfulVerification(session);

  } else {
    setContent(`
      <h1>Invalid verification link</h1>
      <p>The link is missing required parameters.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
  }
}

async function handleSuccessfulVerification(session) {
  if (!session?.user) {
    setContent(`
      <h1>Verification completed</h1>
      <p>Your email has been verified. You may now log in.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
    return;
  }

  const user = session.user;
  const metadata = user.user_metadata || {};
  const userType = metadata.user_type || 'champion'; // default to champion

  // Determine dashboard URL based on user type
  let dashboardUrl = '/champion-dashboard.html';
  if (userType === 'business') {
    dashboardUrl = '/business-dashboard.html';
  }

  setContent(`
    <h1>Email verified successfully!</h1>
    <p>Your email <span class="email">${user.email}</span> has been confirmed.</p>
    <p>You will be redirected to your dashboard shortly...</p>
    <a class="button" href="${dashboardUrl}">Go to dashboard</a>
  `);

  // Redirect after 3 seconds
  setTimeout(() => {
    window.location.href = dashboardUrl;
  }, 3000);
}

// Start the verification process
verifyEmail();
