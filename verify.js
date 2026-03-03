import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://sqxezltdeebvhgxsgxfj.supabase.co';

// Supabase Anonymous Public Key (safe to expose in client-side code)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeGV6bHRkZWVidmhneHNneGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTEzMjksImV4cCI6MjA4NDYyNzMyOX0.e0umAA6TsX2KPpz2evkizsYsqZWpbsWwqBus7RoUbFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  autoRefreshToken: false,  // We don't want to refresh tokens on this page
  persistSession: false      // Don't store session – we only need to verify
});

const statusEl = document.getElementById('status');

function setContent(html) {
  statusEl.innerHTML = html;
}

// Helper to extract error from URL (Supabase sometimes puts errors in hash)
function getUrlError() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const error = params.get('error');
  const errorDescription = params.get('error_description');
  return error ? { error, description: errorDescription } : null;
}

async function init() {
  const urlError = getUrlError();

  // If there's an error in the URL (invalid/expired token), show a friendly message
  if (urlError) {
    if (urlError.error === 'access_denied' && urlError.description?.includes('Email link is invalid or has expired')) {
      setContent(`
        <h1>Verification link expired</h1>
        <p>The verification link you clicked is no longer valid. This usually happens if the link has already been used or expired.</p>
        <p>If you've already confirmed your email, you can log in below.</p>
        <a class="button" href="index.html">Go to login</a>
      `);
    } else {
      setContent(`
        <h1>Verification failed</h1>
        <p>${urlError.description || 'An unknown error occurred.'}</p>
        <a class="button" href="index.html">Go to login</a>
      `);
    }
    return;
  }

  // Listen for auth state changes – this will fire when Supabase processes the token
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // User is now signed in (token processed)
      if (session?.user?.email_confirmed_at) {
        setContent(`
          <h1>Email verified successfully!</h1>
          <p>Your email <span class="email">${session.user.email}</span> has been confirmed.</p>
          <p>You can now log in to the platform.</p>
          <a class="button" href="index.html">Go to login</a>
        `);
      } else {
        // Shouldn't happen, but just in case
        setContent(`
          <h1>Verification in progress</h1>
          <p>Your email <span class="email">${session.user.email}</span> is being verified. Please wait...</p>
        `);
      }
    } else if (event === 'SIGNED_OUT') {
      // No session – check if user is already confirmed (maybe they were already logged in before)
      checkExistingUser();
    }
  });

  // Also check immediately for an existing session (e.g., user already logged in)
  await checkExistingUser();
}

async function checkExistingUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    setContent(`
      <h1>Something went wrong</h1>
      <p>We couldn't load your account information. Please try again later.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
    return;
  }

  if (!user) {
    // No user logged in – show a generic message
    setContent(`
      <h1>Check your email</h1>
      <p>If you have just registered, please check your inbox for a verification link.</p>
      <p>If you've already verified your email, you can log in below.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
    return;
  }

  if (user.email_confirmed_at) {
    // Email already confirmed
    setContent(`
      <h1>Email already verified</h1>
      <p>Your email <span class="email">${user.email}</span> has already been confirmed.</p>
      <p>You can log in and start using the platform.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
  } else {
    // User is logged in but email not confirmed – this shouldn't happen on a fresh link,
    // but could occur if they came directly to this page without a token.
    setContent(`
      <h1>Email not yet verified</h1>
      <p>Your email <span class="email">${user.email}</span> has not been confirmed yet.</p>
      <p>Please check your inbox for the verification email.</p>
      <a class="button" href="index.html">Back to app</a>
    `);
  }
}

// Run on page load
init();
