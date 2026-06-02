/**
 * Booking-form endpoint + shared token, loaded from build-time env.
 *
 * Both are baked into the client bundle (Vite VITE_* substitution) so they
 * are not server-side secrets. The token's only job is to deter casual
 * abuse — the Apps Script enforces real validation server-side.
 */

const endpoint = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;
const token = import.meta.env.VITE_FORM_TOKEN as string | undefined;

if (import.meta.env.DEV && (!endpoint || !token)) {
  // eslint-disable-next-line no-console
  console.warn(
    "[form-config] VITE_FORM_ENDPOINT and/or VITE_FORM_TOKEN are not set. " +
      "Form submissions will fail silently in production. " +
      "Set them in .env.local (local dev) and in your CI secrets (deploy).",
  );
}

export const FORM_ENDPOINT = endpoint ?? "";
export const FORM_TOKEN = token ?? "";
