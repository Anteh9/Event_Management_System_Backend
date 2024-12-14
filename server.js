const express = require('express')
const pool = require('./connection')
const bcrypt = require('bcrypt')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser')
require('dotenv').config();
const port = 3060
const app = express()

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(port,()=> console.log(`Server is running on http://localhost:${port} `))


const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) && // At least one uppercase letter
  /[a-z]/.test(password) && // At least one lowercase letter
  /[0-9]/.test(password) && // At least one digit
  /[!@#$%^&*(),.?":{}|<>]/.test(password); // At least one special character

// Sign-Up Endpoint
// Sign up route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input fields
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a digit, and a special character' 
    });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Insert user and get user_id and is_admin
    const result = await pool.query(
      'INSERT INTO usertable (name, email, password) VALUES ($1, $2, $3) RETURNING user_id, is_admin',
      [name, email, hashedPassword]
    );

    const newUser = result.rows[0];

    // Generate a JWT token
    const token = jwt.sign(
      {
        userId: newUser.user_id,
        isAdmin: newUser.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save the token in the database
    await pool.query('UPDATE usertable SET token = $1 WHERE user_id = $2', [token, newUser.user_id]);

    // Return token and success message
    res.status(201).json({ 
      message: 'User registered successfully!', 
      token 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registering user' });
  }
})

// Sign in route
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  // Validate input fields
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if the user exists
    const result = await pool.query('SELECT * FROM usertable WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Compare the entered password with the stored hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Determine dashboard based on the is_admin column
    const dashboard = user.is_admin ? 'admin-dashboard' : 'user-dashboard';

    // Return the token and dashboard redirection
    res.status(200).json({
      message: 'Sign in successful!',
      token: user.token, // Return the token stored in the database
      dashboard: dashboard, // Specify the dashboard to redirect to
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error signing in' });
  }
});


app.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM event');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// Create a new event
app.post('/events', async (req, res) => {
  const { event_name, description, date, location, capacity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO event (event_name, description, date, location, capacity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [event_name, description, date, location, capacity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating event' });
  }
});

// RSVP for an event (user functionality)
app.post('/events/rsvp/:id', async (req, res) => {
  const eventId = req.params.id;
  try {
    const result = await pool.query('UPDATE event SET capacity = capacity - 1 WHERE id = $1 RETURNING *', [eventId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'RSVP successful' });
  } catch (err) {
    res.status(500).json({ error: 'Error RSVPing for event' });
  }
});



