# ISHF Student Portal

Student portal with shared server storage for Docker/Coolify deployment.

The portal now saves admin changes on the server, not only in one browser. When staff generate a student ID/password and save it, students can use the same live URL from their own phone or computer.

## Local Run

```powershell
npm start
```

Open:

```text
http://127.0.0.1/ishf-portal.html
```

If port 80 is already busy:

```powershell
$env:PORT=4173; npm start
```

Open:

```text
http://127.0.0.1:4173/ishf-portal.html
```

## Test

```powershell
npm test
```

## Coolify Deploy

Use this repository as a Dockerfile-based application.

- Build pack: `Dockerfile`
- Internal port: `80`
- Health check: `/api/health`
- Add persistent storage/volume for `/app/data`

The persistent volume is important. Without it, portal data can reset when the container is recreated.

## First Login

Default staff login:

```text
Staff ID: admin
Password: admin123
```

After first login, change the staff password from `Login & Passwords`.

## Why Student Login Was Failing On Other Phones

Earlier, generated IDs/passwords were stored in the admin browser only. A student's phone loaded a fresh copy of the portal and did not have those saved credentials, so it showed `Invalid ID or password`.

Now the portal reads and writes shared data through `/api/data`, so all users on the live URL see the same saved student records.

## HTTPS / Certificate Warning

This app serves HTTP inside the container. Coolify should handle HTTPS on the public URL.

If a phone shows `Your connection is not private` / `NET::ERR_CERT_AUTHORITY_INVALID`, check Coolify domain and SSL:

1. Add a real custom domain in Coolify, such as `https://your-domain.com`.
2. Point the domain DNS `A` record to the Coolify server IP.
3. Make sure ports `80` and `443` are open.
4. Redeploy after the domain is attached.
