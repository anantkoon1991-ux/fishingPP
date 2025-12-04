-- migrations/create_fish_system.sql
-- Run this on your MySQL server to create required tables for fish stock system.
-- Created: December 3, 2025

-- Table 1: fish_master - ข้อมูลพื้นฐานประเภทปลา
CREATE TABLE IF NOT EXISTS fish_master (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  species VARCHAR(128) DEFAULT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table 2: fish_stock - สต็อกปลาปัจจุบันในแต่ละบ่อ
CREATE TABLE IF NOT EXISTS fish_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fish_id INT NOT NULL,
  pond VARCHAR(128) DEFAULT NULL,
  current_stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_fish_pond (fish_id, pond),
  FOREIGN KEY (fish_id) REFERENCES fish_master(id) ON DELETE CASCADE
);

-- Table 3: fish_logs - ประวัติการเข้า/ออก/ปรับสต็อก
CREATE TABLE IF NOT EXISTS fish_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fish_id INT NOT NULL,
  action ENUM('IN','OUT','ADJUSTMENT') NOT NULL,
  quantity INT NOT NULL,
  pond VARCHAR(128) DEFAULT NULL,
  staff VARCHAR(128) DEFAULT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fish_id) REFERENCES fish_master(id) ON DELETE CASCADE,
  INDEX (created_at)
);
