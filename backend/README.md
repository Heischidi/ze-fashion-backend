# Ze Fashion Backend (auto-generated)

This folder contains a minimal Express + SQLite backend that serves the existing static frontend and provides JSON APIs for products, authentication, and orders.

## Quick start (local)

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create environment file `.env` (copy from `.env.example`) and update secrets.

3. Seed DB and create admin user:
```bash
npm run migrate
```

4. Start server:
```bash
npm start
# or, for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:4000` and will serve your static frontend files from the `ze-fashion-brand` folder at the repository root.

## Notes / TODOs
- Replace `JWT_SECRET` with a strong secret in production.
- Add HTTPS, rate limiting, CORS origin restrictions, and proper logging for production.
- This backend uses a single-file SQLite DB (`db.sqlite`) for simplicity. For production, consider Postgres or MySQL.
