# NOVARA e-waste platform

## What is included

- `calculator.html` — a working e-calculator. It uses device type, damage/problem details and usage duration to produce an indicative value, repair/recovery figures and environmental, social and sustainable impact information.
- `firebase-config.js` — initializes Firebase and Firestore for the site. The `apiKey` inside is not a secret; it's a public project identifier.
- `firestore.rules` — the security rules deployed to the Firebase project. They allow anyone to *submit* an estimate or order, but block all client-side *reading*, so no visitor can browse other people's submissions.
- `script.js` — the calculator logic. It now writes consented estimates and quote/order requests directly to Firestore (`estimates` and `orders` collections) instead of calling a Node server.
- `server.js` — kept as an optional local/offline alternative (SQLite + AES-256-GCM). Not used when deployed on GitHub Pages, since Pages only serves static files. See "Optional: run the old Node service locally" below.
- `team.html` — includes the UX/UI designer's calculator-experience role, ready for the team member's real name and Instagram handle.

## Deploying on GitHub Pages (primary path)

1. Push these files to your GitHub repo as usual and enable Pages.
2. In the [Firebase console](https://console.firebase.google.com), under **Firestore Database → Rules**, paste in the contents of `firestore.rules` and click **Publish**.
3. That's it — `calculator.html` loads `firebase-config.js` as a module and writes straight to Firestore from the browser. No server needed.
4. To view submissions, go to **Firestore Database → Data** in the Firebase console. Submissions are not readable from the website itself by design (see security rules).

## Privacy and security notes

- Firestore encrypts data at rest and in transit automatically; you don't need to manage an encryption key for the Firebase path.
- Security comes from `firestore.rules`, not from hiding the config — enforce input validation there (already included), and never loosen `allow read` for the `estimates`/`orders` collections without adding Firebase Authentication first.
- Before collecting real customer details for the class project: get consent wording reviewed, set a plan for deleting old submissions, and make sure only your team has access to the Firebase console (Project Settings → Users and permissions).

## Optional: run the old Node service locally

If you want to keep testing the original SQLite-backed version offline, `server.js` still works standalone. This requires Node.js 22.5+:

```powershell
$env:NOVARA_DATA_KEY = node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
node server.js
```

Open `http://localhost:3000`. Note: this is separate from the Firebase path above and isn't used once you deploy to GitHub Pages, since Pages can't run Node.

## UX/UI task starter

The calculator flow is ready for the UX/UI designer to refine:

1. Review the mobile flow for the three required input fields.
2. Confirm the estimate language feels clear and does not promise a final price.
3. Add real member names, roles and Instagram handles in `team.html`.
4. Test colour contrast, keyboard focus and form labels before launch.
