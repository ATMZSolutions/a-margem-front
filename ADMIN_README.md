Admin panel setup

1) Default credentials

- Username: admin
- Password: ChangeMe123!

You can override with environment variables ADMIN_USER and ADMIN_PASS.

2) Prisma database

This project uses Prisma with SQLite. If you haven't already, install dependencies and generate the client:

```bash
yarn install
yarn prisma generate
```

If you need to apply migrations (or create the database schema), run:

```bash
yarn prisma migrate dev --name init
```

3) Run the app

```bash
yarn run dev
```

4) Access the admin panel

Open http://localhost:3000/admin and provide the Basic Auth credentials. There is no link in the UI to the admin page by design.
