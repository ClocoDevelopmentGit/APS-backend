# APS-backend

See detailed documentation in the [readme folder](./readme/).
Express.js backend for the Acting Performance Studio (APS) with Prisma ORM and PostgreSQL.

## Documentation

- [Data Models Documentation](./readme/README.md)
- [Banner API Documentation](./readme/BANNER.md)

## Quick run instructions (development)

1. Install dependencies

```powershell
npm install
```

2. Generate Prisma client

```powershell
npx prisma generate
```

3. Run migrations (development)

```powershell
npx prisma migrate dev
```

4. Start the server with auto-reload (nodemon)

Make sure your `package.json` has a `dev` script that runs nodemon. Example:

```json
"scripts": {
    "start": "nodemon index.js",
    "dev": "set NODE_ENV=development&&nodemon index.js",
}
```

Start dev server:

```powershell
npm run dev
```

The server will run on `http://localhost:9000` (or the PORT set in your `.env`).
