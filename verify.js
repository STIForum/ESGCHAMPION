import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://sqxezltdeebvhgxsgxfj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeGV6bHRkZWVidmhneHNneGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTEzMjksImV4cCI6MjA4NDYyNzMyOX0.e0umAA6TsX2KPpz2evkizsYsqZWpbsWwqBus7RoUbFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

const statusEl = document.getElementById('status');

function setContent(html) {
  statusEl.innerHTML = html;
}

async function checkVerification() {
  // Get session (this will process any tokens present in the URL)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Session error:', sessionError);
    setContent(`
      <h1>Something went wrong</h1>
      <p class="error">Could not verify your session. Please try again.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
    return;
  }

  if (session) {
    // User is logged in – check email confirmation status
    const user = session.user;
    if (user.email_confirmed_at) {
      // Already verified – remove login button as user is already authenticated
      setContent(`
        <h1>Email already verified</h1>
        <p>Your email <span class="email">${user.email}</span> has already been confirmed.</p>
        <p>You can now continue using the app.</p>
        <p class="info">If you did not request this verification, you can ignore this page.</p>
      `);
    } else {
      setContent(`
        <h1>Verification in progress</h1>
        <p>We are confirming your email <span class="email">${user.email}</span>.</p>
        <p>If this takes too long, try refreshing the page.</p>
        <a class="button" href="index.html">Back to app</a>
      `);
    }
    return;
  }

  // No session yet – the URL might contain tokens that are being processed.
  // Show a temporary message and retry once after a short delay.
  setContent(`<p class="loading">Processing verification...</p>`);

  setTimeout(async () => {
    const { data: { session: retrySession } } = await supabase.auth.getSession();
    if (retrySession) {
      // Session now available – re-run the check
      checkVerification();
    } else {
      // Still no session – link is invalid, expired, or already used
      setContent(`
        <h1>Verification link invalid or expired</h1>
        <p>The verification link you clicked may have expired or already been used.</p>
        <p>If you still need to verify your email, please request a new confirmation email from the app.</p>
        <a class="button" href="index.html">Go to login</a>
      `);
    }
  }, 2000);
}

// Start the verification check
checkVerification();
