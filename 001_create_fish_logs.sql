-- Database Migration: Add fish_logs table
-- Created: December 3, 2025
-- Purpose: Track fish stock movements (IN/OUT operations)

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
