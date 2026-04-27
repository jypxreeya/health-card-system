const { Client } = require('pg');
const passwords = ['rockstarRK@7', 'postgres', 'admin', 'password', ''];

async function test() {
  for (const password of passwords) {
    console.log(`Testing password: "${password}"`);
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: password,
      database: 'postgres' // connect to default db
    });
    try {
      await client.connect();
      console.log(`SUCCESS! Password is: "${password}"`);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }
  console.log('All attempts failed.');
  process.exit(1);
}

test();
