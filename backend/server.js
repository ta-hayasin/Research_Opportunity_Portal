require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend from the same server
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const FIELDS = [
  'title', 'description', 'research_area', 'faculty_name', 'department',
  'required_skills', 'available_positions', 'application_deadline', 'status'
];

// ---------- Validation ----------
function validate(body, { partial = false } = {}) {
  const errors = [];
  const textFields = ['title', 'description', 'research_area', 'faculty_name', 'department', 'required_skills'];

  for (const f of textFields) {
    if (body[f] === undefined) {
      if (!partial) errors.push(`${f} is required`);
    } else if (typeof body[f] !== 'string' || body[f].trim() === '') {
      errors.push(`${f} must be a non-empty string`);
    }
  }

  if (body.title && typeof body.title === 'string' && body.title.length > 255) {
    errors.push('title must be at most 255 characters');
  }

  if (body.available_positions === undefined) {
    if (!partial) errors.push('available_positions is required');
  } else {
    const n = Number(body.available_positions);
    if (!Number.isInteger(n) || n < 0) errors.push('available_positions must be a non-negative integer');
  }

  if (body.application_deadline === undefined) {
    if (!partial) errors.push('application_deadline is required');
  } else if (
    typeof body.application_deadline !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.application_deadline) ||
    isNaN(Date.parse(body.application_deadline))
  ) {
    errors.push('application_deadline must be a valid date in YYYY-MM-DD format');
  }

  if (body.status === undefined) {
    if (!partial) errors.push('status is required');
  } else if (!['Open', 'Closed'].includes(body.status)) {
    errors.push("status must be either 'Open' or 'Closed'");
  }

  return errors;
}

function validId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

// ---------- Routes ----------

// 1. Create
app.post('/api/opportunities', async (req, res) => {
  try {
    const errors = validate(req.body || {});
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const b = req.body;
    const [result] = await pool.execute(
      `INSERT INTO opportunities
       (title, description, research_area, faculty_name, department,
        required_skills, available_positions, application_deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.title.trim(), b.description.trim(), b.research_area.trim(), b.faculty_name.trim(),
       b.department.trim(), b.required_skills.trim(), Number(b.available_positions),
       b.application_deadline, b.status]
    );
    const [rows] = await pool.execute('SELECT * FROM opportunities WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. Get all
app.get('/api/opportunities', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM opportunities ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. Get one
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID must be a positive integer' });
    const [rows] = await pool.execute('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Research opportunity not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. Update (partial updates allowed)
app.put('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID must be a positive integer' });

    const body = req.body || {};
    const errors = validate(body, { partial: true });
    const provided = FIELDS.filter((f) => body[f] !== undefined);
    if (provided.length === 0) errors.push('At least one updatable field must be provided');
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const [existing] = await pool.execute('SELECT id FROM opportunities WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Research opportunity not found' });

    const setClause = provided.map((f) => `${f} = ?`).join(', ');
    const values = provided.map((f) => {
      if (f === 'available_positions') return Number(body[f]);
      return typeof body[f] === 'string' ? body[f].trim() : body[f];
    });
    await pool.execute(`UPDATE opportunities SET ${setClause} WHERE id = ?`, [...values, req.params.id]);

    const [rows] = await pool.execute('SELECT * FROM opportunities WHERE id = ?', [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. Delete
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'ID must be a positive integer' });
    const [result] = await pool.execute('DELETE FROM opportunities WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Research opportunity not found' });
    res.status(200).json({ message: 'Research opportunity deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unknown API routes -> 404
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Malformed JSON and other errors
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON in request body' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
