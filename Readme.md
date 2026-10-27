# Getting Started

First, run the development server:

```bash
npm run dev

```

## Setup frontend

```bash
npx create-next-app@latest .
```

## Setup Backend

```bash
npm init -y
npm install express cors dotenv nodemon

```

## Postgre connection

```bash
npm i pg
```

- const pool = new Pool({
- host: "localhost",
- user: "postgres",
- port: 5432,
- password: process.env.DB_PASSWORD,
- database: "ecommerce",
- });
