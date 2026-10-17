export type ContactValues = { name: string; email: string; subject: string; message: string };
export type ContactErrors = Partial<Record<keyof ContactValues, string>>;
export const emptyContact: ContactValues = { name: '', email: '', subject: '', message: '' };
export const contactLimits = { name: 100, email: 254, subject: 160, message: 5000 };
export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  for (const key of Object.keys(contactLimits) as (keyof ContactValues)[]) {
    if (!values[key].trim()) errors[key] = `Please enter your ${key === 'name' ? 'full name' : key === 'email' ? 'email address' : key}.`;
    else if (values[key].length > contactLimits[key]) errors[key] = `Use no more than ${contactLimits[key]} characters.`;
  }
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address, such as you@company.com.';
  if (values.message.trim() && values.message.trim().length < 10) errors.message = 'Please include at least 10 characters.';
  for (const key of ['name', 'email', 'subject'] as const) if (/[\r\n]/.test(values[key].trim())) errors[key] = 'Please keep this field on a single line.';
  return errors;
}
export const contactSuccess = "Thank you for reaching out! Your message has been submitted successfully. I'll get back to you as soon as possible.";
export async function sendContact(values: ContactValues, website: string, request: typeof fetch = fetch): Promise<void> {
  let response: Response;
  try { response = await request('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, website }), signal: AbortSignal.timeout(25000) }); }
  catch { throw new Error('Unable to confirm delivery. Please try again or email me directly.'); }
  let result: { error?: string; accepted?: boolean } | null;
  try { result = await response.json(); }
  catch { throw new Error('The service returned an unexpected response. Please try again or email me directly.'); }
  if (!response.ok || result?.accepted !== true) throw new Error(typeof result?.error === 'string' ? result.error : 'Your message was not accepted. Please try again or email me directly.');
}
