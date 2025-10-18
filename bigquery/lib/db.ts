import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.ADSER_DATABASE_URL!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const connection = pool;