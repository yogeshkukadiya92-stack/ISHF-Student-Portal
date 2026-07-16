# ISHF Student Portal

Static student portal frontend packaged for Docker/Coolify deployment.

## Local run

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/ishf-portal.html
```

## Coolify deploy

Use this repository as a Dockerfile-based application.

- Build pack: `Dockerfile`
- Internal port: `80`
- Publish the app through Coolify's proxy

This repo does not manage SSL certificates inside the container. `nginx` serves plain HTTP and Coolify is expected to terminate HTTPS.

## Fix for phone certificate warning

If a phone shows `Your connection is not private` / `NET::ERR_CERT_AUTHORITY_INVALID`, the problem is usually not the app code. It means Coolify is serving a self-signed fallback certificate for the public URL.

Use one of these setups:

1. For quick testing, open the generated Coolify `sslip.io` URL with `http://`, not `https://`.
2. For proper mobile HTTPS, add a real custom domain in Coolify as `https://your-domain.com`.
3. Point that domain's DNS `A` record to your Coolify server IP.
4. Make sure ports `80` and `443` are open on the server so Coolify can request a Let's Encrypt certificate.
5. Redeploy the app after the domain is attached.

If Coolify still shows the warning after DNS is correct, it is still using its self-signed fallback certificate and the fix is in Coolify's domain/SSL setup rather than this repository.
