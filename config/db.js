import mysql from 'mysql2/promise'
import { configDotenv } from 'dotenv'

configDotenv()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function testConnection() {
    try {
      const connection = await pool.getConnection();
      console.log('Successfully connected to the MySQL database');
      connection.release();
      
      // Log connection stats periodically
      setInterval(async () => {
        const [rows] = await pool.query('SELECT 1');
        console.log('Database heartbeat - connection active');
      }, 3600000);
    } catch (err) {
      console.error('Failed to connect to the MySQL database:', err.message);
      process.exit(1);
    }
}
testConnection();

export default pool