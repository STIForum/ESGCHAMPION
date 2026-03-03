import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://sqxezltdeebvhgxsgxfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeGV6bHRkZWVidmhneHNneGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTEzMjksImV4cCI6MjA4NDYyNzMyOX0.e0umAA6TsX2KPpz2evkizsYsqZWpbsWwqBus7RoUbFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statusEl = document.getElementById('status');

function setContent(html) {
  statusEl.innerHTML = html;
}

async function verifyEmail() {
  // Extract the token and type from the URL
  const params = new URLSearchParams(window.location.search);
  const token_hash = params.get('token_hash');
  const type = params.get('type'); // usually 'signup' or 'email'

  if (!token_hash || !type) {
    setContent(`
      <h1>Invalid verification link</h1>
      <p>The link is missing required parameters.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
    return;
  }

  // Show a loading message while we verify
  setContent(`<p class="loading">Verifying your email...</p>`);

  // Attempt to verify the OTP
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  });

  if (error) {
    console.error('Verification error:', error);

    // Check the error message or status to give a user-friendly response
    if (error.message.includes('Email link is invalid or has expired') || error.status === 403) {
      // This happens when the token was already used or has expired
      setContent(`
        <h1>Verification link no longer valid</h1>
        <p>The link you clicked may have already been used or has expired.</p>
        <p>If you still need to verify your email, please request a new confirmation email from the app.</p>
        <a class="button" href="index.html">Go to login</a>
      `);
    } else {
      // Some other error (network, server issue, etc.)
      setContent(`
        <h1>Verification failed</h1>
        <p class="error">${error.message}</p>
        <a class="button" href="index.html">Try again</a>
      `);
    }
    return;
  }

  // Verification successful – get the updated session
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user?.email_confirmed_at) {
    setContent(`
      <h1>Email verified successfully!</h1>
      <p>Your email <span class="email">${session.user.email}</span> has been confirmed.</p>
      <p>You can now close this page and return to the app.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
  } else {
    // Shouldn't happen, but just in case
    setContent(`
      <h1>Verification completed</h1>
      <p>Your email has been verified. You may now log in.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
  }
}

// Start the verification process
verifyEmail();
