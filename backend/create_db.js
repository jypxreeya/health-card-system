const { Client } = require('pg');
require('dotenv').config();

async function createDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres' // connect to default db
  });

  try {
    await client.connect();
    console.log('Connected to postgres database.');
    
    // Check if database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'namma_health'");
    if (res.rowCount === 0) {
      console.log('Creating database "namma_health"...');
      await client.query('CREATE DATABASE namma_health');
      console.log('Database "namma_health" created successfully.');
    } else {
      console.log('Database "namma_health" already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await client.end();
  }
}

createDb();
