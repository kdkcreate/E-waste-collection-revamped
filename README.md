# NOVARA e-waste platform

## What is included

- `calculator.html` — a working e-calculator. It uses device type, damage/problem details and usage duration to produce an indicative value, repair/recovery figures and environmental, social and sustainable impact information.
- `server.js` — the NOVARA service. It stores consented estimates and quote/order requests in a local SQLite database, encrypting each record with AES-256-GCM before it is written.
- `team.html` — includes the UX/UI designer’s calculator-experience role, ready for the team member’s real name and Instagram handle.

## Run locally

This service requires Node.js 22.5 or newer. Create an encryption key that is not saved in Git, then start the service from this folder:

```powershell
$env:NOVARA_DATA_KEY = node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
node server.js
```

Open `http://localhost:3000`. Leave that terminal open while testing. The same encryption key is needed to keep using an existing database; store the real production key in a secret manager, never in a source file.

## Privacy and deployment

The calculator works as a static page, but **GitHub Pages cannot run `server.js`**. On GitHub Pages, it deliberately does not store any user information. To enable encrypted storage, deploy this Node service to a server platform that supports Node and set `NOVARA_DATA_KEY` as a secret there.

Before collecting real customer details, add HTTPS, staff authentication for viewing submissions, backups, a retention/deletion policy, consent wording approved for your location, and rate limiting. The database stores encrypted content; the record type and creation time remain visible as database metadata.

## UX/UI task starter

The calculator flow is ready for the UX/UI designer to refine:

1. Review the mobile flow for the three required input fields.
2. Confirm the estimate language feels clear and does not promise a final price.
3. Add real member names, roles and Instagram handles in `team.html`.
4. Test colour contrast, keyboard focus and form labels before launch.

## Firebase setup for the e-calculator

The calculator is already connected to the NOVARA Firebase web configuration in `firebase-config.js`. A Firebase web API key is an identifier, not a secret; the protection comes from Firebase Authentication, Firestore Security Rules, App Check and the fact that the browser never receives administrative credentials.

1. In Firebase Console, open **Authentication → Sign-in method** and enable **Anonymous**. This gives each visitor a temporary identity so the rules can reject unauthenticated writes.
2. Open **Firestore Database → Rules**, paste the contents of `firestore.rules`, then publish them. These rules only permit validated creates and permanently deny public reads, updates and deletes.
3. In **App Check**, register the website (use reCAPTCHA Enterprise for web) and enforce App Check for Firestore after testing. This reduces automated abuse.
4. Deploy the site to GitHub Pages. The e-calculator will write only after the visitor ticks the consent checkbox. Do not put passwords, service-account JSON, or encryption keys in this repository.

Firestore encrypts data in transit and at rest by default. For school-project estimate data, the included rules and consent gate are a good baseline. If you later collect names, emails, phone numbers or orders, send those through a Cloud Function and encrypt sensitive fields there with Cloud KMS; client-side encryption keys cannot be kept secret in a public website. Add a privacy notice, retention/deletion process and staff-only administrative access before collecting real customer data.
