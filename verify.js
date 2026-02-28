import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 1. Replace these with your actual Supabase project values
const SUPABASE_URL = 'https://sqxezltdeebvhgxsgxfj.supabase.co';

// Supabase Anonymous Public Key (safe to expose in client-side code)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeGV6bHRkZWVidmhneHNneGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTEzMjksImV4cCI6MjA4NDYyNzMyOX0.e0umAA6TsX2KPpz2evkizsYsqZWpbsWwqBus7RoUbFE';

// 2. Create the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. Grab the status container
const statusEl = document.getElementById('status');

function setContent(html) {
  statusEl.innerHTML = html;
}

// 4. Main logic
async function init() {
  try {
    // a) Get current user from Supabase
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      setContent(`
        <h1>Something went wrong</h1>
        <p class="error">We couldn't load your account information. Please try logging in again.</p>
        <a class="button" href="index.html">Go to login</a>
      `);
      return;
    }

    const user = data.user;

    // b) If there is no logged-in user
    if (!user) {
      setContent(`
        <h1>Not logged in</h1>
        <p>You are not currently logged in. Please log in to continue.</p>
        <a class="button" href="index.html">Go to login</a>
      `);
      return;
    }

    // c) If email is already confirmed -> DO NOT restart verification or onboarding
    if (user.email_confirmed_at) {
      // This is the key to fixing BUG_REG_007:
      // when the user re-clicks the old email link after confirming,
      // they land here, and we show "already verified" instead of "in progress".
      setContent(`
        <h1>Email already verified</h1>
        <p>Your email <span class="email">${user.email}</span> has already been confirmed.</p>
        <p>You can safely log in and use the app.</p>
        <a class="button" href="index.html">Go to login</a>
        <p class="info">If you did not request this verification, you can ignore this page.</p>
      `);
      return;
    }

    // d) Email not yet confirmed
    setContent(`
      <h1>Confirm your email</h1>
      <p>We have sent a confirmation email to <span class="email">${user.email}</span>.</p>
      <p>Please click the link in that email to complete verification.</p>
      <p class="info">
        If you don't see the email, check your spam/junk folder or try resending from the app.
      </p>
      <a class="button" href="index.html">Back to app</a>
    `);
  } catch (e) {
    console.error('Unexpected error:', e);
    setContent(`
      <h1>Unexpected error</h1>
      <p class="error">Something went wrong. Please try again later.</p>
      <a class="button" href="index.html">Go to login</a>
    `);
  }
}

// 5. Run on page load
init();