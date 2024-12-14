const pool = require('./connection')
const bcrypt = require('bcrypt');



const seedAdmin = async () => {
  const name = 'Admin User';
  const email = 'admin@example.com';
  const password = 'adminpassword'; // Replace with your desired admin password
  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

  try {
    // Check if the admin already exists
    const result = await pool.query('SELECT * FROM usertable WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      console.log('Admin already exists!');
      return;
    }

    // Insert the new admin user into the users table
    const insertQuery = `
      INSERT INTO usertable (name, email, password, is_admin)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(insertQuery, [name, email, hashedPassword, true]);

    console.log('Admin user created successfully!');
  } catch (err) {
    console.error('Error seeding admin user:', err);
  } finally {
    pool.end(); // Close the database connection
  }
};

// Call the seedAdmin function to insert the admin user
seedAdmin();
