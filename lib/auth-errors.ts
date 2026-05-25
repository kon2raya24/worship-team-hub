// Translate raw Supabase auth errors into messages the user can act on.
// Mirrors the Dart `friendlyAuthError` helper in the mobile app.

export function friendlyAuthError(message: string | null | undefined): string {
  if (!message) return "Something went wrong. Try again.";
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
    return "Wrong email or password.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email — we sent you a link.";
  }
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "That email is already in use. Sign in instead.";
  }
  if (m.includes("password should be at least") || m.includes("weak password")) {
    return "Pick a stronger password (8+ characters).";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "That doesn't look like a valid email address.";
  }
  if (m.includes("rate limit") || m.includes("over_email_send")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (m.includes("email rate limit")) {
    return "We've sent too many emails to this address recently. Try again later.";
  }
  if (m.includes("user not found")) {
    return "No account with that email.";
  }
  if (m.includes("signup is disabled") || m.includes("signups not allowed")) {
    return "New sign-ups are currently closed. Ask your worship leader.";
  }
  if (
    m.includes("failed host lookup") ||
    m.includes("fetch failed") ||
    m.includes("network is unreachable")
  ) {
    return "Can't reach the server. Check your connection.";
  }

  // Generic fall-through — capitalise and add a period.
  const trimmed = message.trim();
  const sentence = trimmed[0].toUpperCase() + trimmed.slice(1);
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}
