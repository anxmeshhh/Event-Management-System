const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'theanimesh2005',
    });

    console.log('Connected to MySQL');

    // Read and run 01-create-tables.sql
    const createScript = fs.readFileSync(path.join(__dirname, '01-create-tables.sql'), 'utf8');
    const createStatements = createScript.split(';').filter(stmt => stmt.trim());

    for (const statement of createStatements) {
      const trimmed = statement.trim();
      if (trimmed.toLowerCase().startsWith('use')) {
        await connection.query(trimmed); // ❗ use `.query()` for USE
      } else {
        await connection.execute(trimmed);
      }
    }

    console.log('Tables created successfully');

    // Optional: Seed data
    const seedPath = path.join(__dirname, '02-seed-data.sql');
    if (fs.existsSync(seedPath)) {
      const seedScript = fs.readFileSync(seedPath, 'utf8');
      const seedStatements = seedScript.split(';').filter(stmt => stmt.trim());

      for (const statement of seedStatements) {
        const trimmed = statement.trim();
        if (trimmed.toLowerCase().startsWith('use')) {
          await connection.query(trimmed);
        } else {
          await connection.execute(trimmed);
        }
      }

      console.log('Sample data inserted successfully');
    } else {
      console.log('No seed data script found. Skipping...');
    }

    await connection.end();
  } catch (error) {
    console.error('Database setup error:', error);
  }
}

setupDatabase();
