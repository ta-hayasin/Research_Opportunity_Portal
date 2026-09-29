# University Research Opportunity Portal

A full-stack web app where faculty can post, view, update, close and delete research opportunities.

**GitHub Repository:** https://github.com/YOUR_USERNAME/research-opportunity-portal  <!-- TODO: replace with your real link -->

**Tech stack:** Node.js + Express (REST API) · MySQL · HTML/CSS/vanilla JavaScript frontend

## Project Structure
```
backend/    Express REST API (server.js, db.js, package.json, .env.example)
frontend/   index.html, style.css, app.js (served by the backend)
database/   schema.sql
postman/    Exported Postman collection
```

## Setup & Run

### 1. Prerequisites
- Node.js 18+ and npm
- MySQL 8+ running locally

### 2. Create the database
```bash
mysql -u root -p < database/schema.sql
```
(Or open `database/schema.sql` in MySQL Workbench and run it.)

### 3. Configure environment variables
```bash
cd backend
cp .env.example .env      # Windows: copy .env.example .env
```
Edit `.env` and set your MySQL password (`DB_PASSWORD`). The `.env` file is git-ignored.

### 4. Install dependencies and start the server
```bash
npm install
npm start
```
The server runs at **http://localhost:3000**.

### 5. Open the frontend
Visit **http://localhost:3000** in your browser (the backend serves the frontend files).

## API Endpoints

| Method | Endpoint                  | Description                  | Success | Errors        |
|--------|---------------------------|------------------------------|---------|---------------|
| POST   | /api/opportunities        | Create an opportunity        | 201     | 400, 500      |
| GET    | /api/opportunities        | Get all opportunities        | 200     | 500           |
| GET    | /api/opportunities/:id    | Get one opportunity          | 200     | 400, 404, 500 |
| PUT    | /api/opportunities/:id    | Update (partial allowed)     | 200     | 400, 404, 500 |
| DELETE | /api/opportunities/:id    | Delete an opportunity        | 200     | 400, 404, 500 |

### Opportunity fields
`title`, `description`, `research_area`, `faculty_name`, `department`, `required_skills`,
`available_positions` (integer ≥ 0), `application_deadline` (`YYYY-MM-DD`), `status` (`Open` | `Closed`).

### Example request
```json
POST /api/opportunities
{
  "title": "Deep Learning for Medical Imaging",
  "description": "Research on CNNs for X-ray analysis.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch",
  "available_positions": 2,
  "application_deadline": "2026-12-15",
  "status": "Open"
}
```

## Testing with Postman
1. Open Postman → **Import** → select `postman/Research_Opportunity_Portal.postman_collection.json`.
2. Make sure the server is running (collection variable `baseUrl` = `http://localhost:3000`).
3. Run the requests in order (1 → 10), or use the Collection Runner. The IDs of the created records are saved automatically into collection variables.

The collection covers: creating 3 opportunities, get all, get one, update, Open→Closed, delete, 404 after delete, and a 400 validation error.

## Security
No passwords or secrets are committed. Use `backend/.env` (ignored by git) for credentials.
