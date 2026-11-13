# Aviator

## Local setup

1. Use Python 3.11 or newer and install the packages in `requirements.txt`.
2. Create a MySQL database and copy `.env.example` to `.env`.
3. Set the database credentials, a random `SECRET_KEY` of at least 32 characters, and `ADMIN_PHONE` (and optionally `ADMIN_PHONES`). Use a dedicated MySQL account with a password rather than `root` for hosting.
4. Install `g++` if you want to use the admin command panel.
5. Run the app with `flask --app app run` for local development.

At first startup, the app creates missing tables and may add the `phone` column to an existing users table. The database account therefore needs schema modification privileges during initial setup and that upgrade.

To register the first admin, use `flask --app app create-admin --phone <phone> --username <username> --email <email> --password <password>`. The phone must be on the configured admin allowlist. After logging in, an admin can use the **Try to log in to admin portal** popup to create more allowlisted admin accounts. The dashboard is available at `/admin`. Admin and regular account passwords must be 12–128 characters.

## Hosting

Deploy with a WSGI server using the included `Procfile` (`gunicorn app:app`) and set these environment variables in the hosting provider's secret/configuration settings:

- `APP_ENV=production`
- `SECRET_KEY` (private random value, 32+ characters)
- `DATABASE_URL` for a reachable MySQL database, or the `MYSQL_*` settings
- `ADMIN_PHONE` and optional comma-separated `ADMIN_PHONES`
- `PORT` if required by the provider

Terminate HTTPS at the host or reverse proxy. Do not set `FLASK_DEBUG=1`. Keep `.env` out of source control. The simulated M-Pesa deposit route is disabled in production; it does not process real payments. The app currently has no database migration framework, and startup performs schema creation/upgrade work, so review and back up the database before deploying schema changes.

The admin dashboard's **System checks** panel reports the main deployment configuration and connectivity checks; it does not replace provider logs or a full external security review. The C++ command panel runs only command names explicitly implemented in `admin_commands.cpp`, but those commands execute with the web server's operating-system permissions. Treat edits to that source file as trusted server code.
