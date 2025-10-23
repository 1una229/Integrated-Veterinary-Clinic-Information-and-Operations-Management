-- Create database
CREATE DATABASE IF NOT EXISTS pawcare_db;
USE pawcare_db;

-- Create tables (these will be created automatically by Hibernate, but this is for reference)

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100),
    breed VARCHAR(100),
    gender VARCHAR(20),
    age INT,
    microchip VARCHAR(50),
    owner VARCHAR(255),
    address TEXT,
    federation VARCHAR(50),
    photo VARCHAR(500)
);

-- Procedures table
CREATE TABLE IF NOT EXISTS procedures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    procedure_date DATE,
    procedure_name VARCHAR(255),
    notes TEXT,
    vet VARCHAR(255),
    pet_id BIGINT,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pet_id BIGINT,
    owner VARCHAR(255),
    date DATE,
    time VARCHAR(10),
    vet VARCHAR(255),
    status VARCHAR(50),
    completed_at DATE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pet_id BIGINT,
    pet VARCHAR(255),
    owner VARCHAR(255),
    drug VARCHAR(255),
    dosage VARCHAR(100),
    directions TEXT,
    prescriber VARCHAR(255),
    date DATE,
    dispensed BOOLEAN DEFAULT FALSE,
    dispensed_at DATE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Operation logs table
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    operation_type VARCHAR(100),
    message TEXT,
    pet_id BIGINT,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
);

-- Insert sample data
INSERT INTO users (name, role) VALUES 
('Admin', 'admin'),
('Dr. Cruz', 'vet'),
('Daisy', 'receptionist'),
('Paul', 'pharmacist');

-- Note: Sample pets, appointments, and prescriptions will be created by the DataInitializer

