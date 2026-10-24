# Enquiry intake: Apps Script

Drop-in replacement for the existing Google Apps Script behind the site forms.

## Install

1. Open the Google Sheet that holds the enquiries (or create one) and copy its ID from the URL (`/d/<SHEET_ID>/edit`).
2. Extensions > Apps Script. Replace the contents of `Code.gs` with `apps-script/Code.gs` from this repo.
3. Set the four values, either in the `CONFIG` block at the top or (preferred) under Project Settings > Script properties:
   - `FORM_TOKEN`: must equal `VITE_FORM_TOKEN` used to build the site.
   - `SHEET_ID`: the sheet ID from step 1.
   - `NOTIFY_EMAIL`: `ganeshpartheeban@gmail.com`.
   - `BROCHURE_URL`: `https://ganeshpartheeban.in/brochure.pdf`.
4. Deploy > Manage deployments > edit the existing web app deployment > Version: New version > Deploy. (Execute as: Me, Who has access: Anyone.) Editing the existing deployment keeps the same `/exec` URL, so `VITE_FORM_ENDPOINT` stays unchanged. Only for a brand new deployment, copy the new `/exec` URL into the `VITE_FORM_ENDPOINT` secret and redeploy the site.
5. In the editor choose `setupTriggers` and press Run once; approve the permissions (Sheets, Gmail send, triggers). This installs `dailyFollowUpDigest` at 9:00 IST daily.
6. Open the `/exec` URL in a browser: you should see `{"ok":true,...}` (health check).

## Behaviour

- Types: `enquiry` (booking form), `notify` (videography notify), `testimonial` (About). Older payloads without `type` are inferred from `eventType`.
- Appends to the `Enquiries` tab. If the header row is from the older script, missing columns are appended on the right; existing columns and data are untouched (legacy names Location/IPLocation/UserAgent/Source are mapped to the new columns).
- Status is set to `New`, Follow-up date to now + 1 day.
- Owner email includes a prefilled WhatsApp click-to-chat link when a phone is present. Reply-To is the client for enquiries.
- Auto-reply goes only to `enquiry` submissions with a valid email (brochure, WhatsApp link, 24-hour promise).
- Daily digest lists enquiries that are `New` or past follow-up (not Booked/Closed/Lost). Change Status in the sheet to take a lead off the list.
- Honeypot field `website` and token check are enforced server-side.
- The booking form does not collect a phone number yet; the WhatsApp link appears once a `phone` field is posted.
