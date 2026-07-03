# ISHF Student Portal Brain

## Project Summary
ISHF Student Portal is a single-file frontend web app in `ishf-portal.html`. It works as a student portal plus admin panel for the International School For Health & Fitness. There is no separate server backend in this project yet; the app stores editable portal data in the browser using `window.storage` when available, then `localStorage`, then an in-memory fallback.

## How To Run
1. Open the project folder.
2. Start a local server from this folder:
   ```powershell
   python -m http.server 4173 --bind 127.0.0.1
   ```
3. Open:
   ```text
   http://127.0.0.1:4173/ishf-portal.html
   ```

## Demo Logins
The default login IDs are visible on the login page, but passwords are intentionally hidden in the UI for safety.

Student:
- ID: `251104569`
- Password: `student123`

Admin/Staff:
- ID: `admin`
- Password: `admin123`

Captcha must match the number shown on the login screen.

## Main Features
Student area:
- Dashboard with hero banner, important links, intro video, profile summary.
- Profile and personal details.
- Form verification status.
- E-resources and newsletter.
- Courses, lectures, recordings, and PDF links.
- Payments, receipts, transactions.
- Exams, assignments, holidays.
- Student support tickets.

Admin area:
- Dashboard metrics.
- Branding, logo, hero banner, intro video.
- Student profile data.
- Student/admin login IDs and passwords.
- Courses, lectures, fees, assignments, exams, holidays.
- News, resources, important links.
- Form verification records.
- Support ticket resolution.
- JSON export/import/reset.

## Data Model
The app state is held in global `DATA`, initialized by `defaultData()`.

Important top-level keys:
- `branding`: portal name, organization name, logo text/image, topbar text.
- `hero`: student dashboard hero content and chips.
- `introVideo`: title and URL for the dashboard video.
- `student`: student identity, academic, personal, mentor, and password fields.
- `staff`: admin login and name.
- `importantLinks`: dashboard links.
- `formVerification`: verification fields, education rows, status history.
- `courses`: course cards shown in My Courses.
- `lectures`: course lectures with date, recording URL, PDF URL.
- `fees`, `receipts`, `transactions`: payment screens.
- `assignments`, `exams`, `holidays`, `news`, `resources`, `tickets`.

## Storage Flow
- `loadData()` reads `ishf_data`.
- `normalizeData()` merges imported/saved data with default schema and sanitizes URLs/images.
- `saveData()` normalizes and writes JSON back to storage.
- Export downloads current `DATA` as `ishf-portal-data.json`.
- Import accepts JSON under 1 MB, normalizes it, and rejects invalid JSON.

## Security Notes
This is a static client-only app, so it should not be treated as production-secure for real student records. Anyone with browser/devtools access can inspect or modify local client data.

Hardening already added:
- Login hint no longer exposes passwords.
- Admin/student render functions guard against unauthenticated direct access.
- URL sanitization blocks unsafe protocols such as `javascript:`.
- External links use `rel="noopener noreferrer"`.
- Imported JSON is schema-normalized before storage.
- Logo/photo uploads are limited to PNG/JPG/WebP under 1.5 MB.
- SVG upload is disabled to reduce script/payload risk.
- Missing CSS variables were added so visual colors render correctly.
- Course onclick arguments use JSON-safe escaping.
- Browser data now persists through `localStorage` in normal local preview.

Recommended real backend upgrades:
- Move authentication to a server with hashed passwords.
- Store student/admin data in a database.
- Add server-side authorization for admin operations.
- Add CSRF protection, rate limits, audit logs, and backup/restore controls.
- Keep sensitive student data out of client-side JSON.

## Important Functions
- `defaultData()`: sample seed data and schema.
- `loadData()`, `saveData()`, `storeGet()`, `storeSet()`: persistence.
- `normalizeData()`, `safeUrl()`, `safeImageSrc()`, `safeEmbedUrl()`: data safety.
- `doLogin()`, `enterApp()`, `logout()`: auth flow.
- `renderStudent(page)`: student view router.
- `renderAdmin(tab)`: admin view router.
- `openForm(title, bodyHtml, onSave)`: admin modal editor.
- `exportData()`, `importData()`, `resetData()`: data maintenance.

## Testing Done
Tested via local server on `http://127.0.0.1:4173/ishf-portal.html`.

Verified:
- Page loads with title `ISHF Student Portal`.
- Login hint hides passwords.
- Student login works with default credentials and captcha.
- Student dashboard renders without console errors.
- Admin login works with default credentials and captcha.
- Admin dashboard renders 4 stat cards without console errors.

## Notes For Future AI/Developers
Before changing behavior, read `ishf-portal.html` and this `Brain.md`.

Be careful with:
- Template strings that build HTML with user/admin-controlled data.
- Any `href`, `src`, `iframe`, or `onclick` output.
- Keeping the static-app limitation clear; frontend guards are not true backend security.
- Existing data in users' browser storage. Use `normalizeData()` for backward-compatible schema changes.

If adding a real backend, keep the current UI as the frontend shell and replace storage/auth functions first.
