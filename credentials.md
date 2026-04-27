# Namma Health Card System - Demo Credentials

Below are the default credentials seeded into the database for testing the various portals.

### 1. Super Admin
*Has access to the entire backend Admin Panel to manage hospitals, plans, and system-wide metrics.*
- **Email:** `superadmin@nammahealth.com`
- **Password:** `Admin@123`
- **Login URL:** `http://localhost:5173/login` (Admin Panel)

### 2. Hospital Receptionist
*Has access to verify cards, log services, and register walk-in patients for a specific hospital.*
- **Email:** `reception@nammahealth.com`
- **Password:** `Reception@123`
- **Login URL:** `http://localhost:5173/login` (Admin Panel)

### 3. Field Executive
*Has access to the mobile app to register new patients on the go.*
- **Email:** `field@nammahealth.com`
- **Password:** `Field@123`
- **Login URL:** Field App (React Native Mobile App)

> **To open the Field App on your phone:**
> 1. Open a terminal in the `field-app` directory.
> 2. Run `npm install` (if you haven't already).
> 3. Run `npm start` (or `npx expo start`).
> 4. Scan the large QR code that appears in your terminal using the Expo Go app (on Android) or your Camera app (on iOS). Make sure your phone and computer are on the same Wi-Fi network.

### 4. Database (PostgreSQL)
- **User:** `postgres`
- **Password:** `rockstarRK@7`
- **Port:** `5432`
- **Database Name:** `namma_health`

---

### 5. Demo Patients (Customer Portal - `http://localhost:3000`)
*Login using Phone Number + Card Number, then enter the OTP.*

| Patient | Phone | Card Number |
|---|---|---|
| Suresh Babu | `9500012345` | `NHC-2026-01000` |
| Raveen Kumar G | `7845965287` | `NHC-2026-01001` |

> **Dev Mode OTP:** Gmail is not configured in `.env`. After clicking "Request OTP", look at the **backend server terminal** window — the OTP code will be printed there in bold.
> 
> To enable real Gmail OTP delivery: edit `backend/.env` and set `GMAIL_USER` and `GMAIL_APP_PASSWORD` (use a Gmail App Password, not your regular Gmail password).

supabase: rockstarRK@72107