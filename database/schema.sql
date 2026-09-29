-- Research Opportunity Portal - database setup
CREATE DATABASE IF NOT EXISTS research_portal;
USE research_portal;

CREATE TABLE IF NOT EXISTS opportunities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  research_area VARCHAR(150) NOT NULL,
  faculty_name VARCHAR(150) NOT NULL,
  department VARCHAR(150) NOT NULL,
  required_skills VARCHAR(500) NOT NULL,
  available_positions INT UNSIGNED NOT NULL,
  application_deadline DATE NOT NULL,
  status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
