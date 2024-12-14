const { Pool } = require('pg');



const pool = new Pool({
    user: "event_managers",
    host: "dpg-ct9g2cogph6c73a1sqq0-a.oregon-postgres.render.com",
    database: "event_info",
    password: "BgMVoKYVs7l8gaWWAGFexfivGCSGS4iO",
    port: "5432",
    ssl: { rejectUnauthorized: true} 
});

pool.connect((err,client,release) => {
    if (err) {
        console.error('Failed to connect to the database:', err.stack);
    } else {
        console.log('Connected to the database successfully!');
        release(); // Release the client back to the pool
    }
});


module.exports =   pool 