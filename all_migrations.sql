-- ========================================
-- DATABASE MIGRATIONS FOR DRMYLAND PROJECT
-- ========================================

-- ========================================
-- 1. FISH STOCK TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS fish_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fish_type VARCHAR(100) NOT NULL,
  pond VARCHAR(50),
  current_stock INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_fish_pond (fish_type, pond)
);

-- ========================================
-- 2. FISH MOVEMENTS LOG
-- ========================================
CREATE TABLE IF NOT EXISTS fish_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fish_type VARCHAR(100) NOT NULL,
  pond VARCHAR(50),
  change_amount INT NOT NULL,
  movement_type ENUM('IN', 'OUT') NOT NULL,
  reason VARCHAR(255),
  note TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fish_type (fish_type),
  INDEX idx_created_at (created_at)
);

-- ========================================
-- 3. FISH LOGS TABLE (Fish Stock Tracking)
-- ========================================
CREATE TABLE IF NOT EXISTS fish_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fish_id INT NOT NULL,
    action ENUM('IN', 'OUT') NOT NULL,
    quantity INT NOT NULL,
    pond VARCHAR(100),
    staff VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fish_id (fish_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Optional: Add foreign key if fish table exists
-- ALTER TABLE fish_logs 
-- ADD CONSTRAINT fk_fish_logs_fish_id 
-- FOREIGN KEY (fish_id) REFERENCES fish(id) ON DELETE CASCADE;

-- ========================================
-- USAGE NOTES
-- ========================================
-- 
-- fish_stock: Tracks current stock levels per fish type and pond
-- fish_movements: Records all IN/OUT movements with audit trail
-- fish_logs: Logs individual actions for compliance and tracking
--
-- To run these migrations in MySQL:
-- mysql -u root -p drmyland < migrations.sql
--
-- OR copy-paste each CREATE TABLE statement into MySQL Workbench
-- OR execute through your Node.js migration tool
