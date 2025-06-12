-- Add Firebase integration columns to users table
ALTER TABLE users 
ADD COLUMN firebase_uid VARCHAR(128) UNIQUE NULL AFTER id,
ADD COLUMN photo_url TEXT NULL AFTER address,
ADD COLUMN auth_provider ENUM('traditional', 'firebase', 'google', 'facebook') DEFAULT 'traditional' AFTER role,
ADD COLUMN last_login_at TIMESTAMP NULL AFTER updated_at,
ADD INDEX idx_firebase_uid (firebase_uid),
ADD INDEX idx_auth_provider (auth_provider);

-- Create Firebase sessions table for additional session management
CREATE TABLE IF NOT EXISTS firebase_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    firebase_uid VARCHAR(128) NOT NULL,
    session_token TEXT NOT NULL,
    device_info TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Create user preferences table for Firebase users
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id, preference_key),
    INDEX idx_user_id (user_id)
);

-- Insert default preferences for notification settings
INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT id, 'email_notifications', 'true' FROM users WHERE id NOT IN (
    SELECT user_id FROM user_preferences WHERE preference_key = 'email_notifications'
);

INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT id, 'push_notifications', 'true' FROM users WHERE id NOT IN (
    SELECT user_id FROM user_preferences WHERE preference_key = 'push_notifications'
);

-- Create social login audit table
CREATE TABLE IF NOT EXISTS social_login_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    provider ENUM('google', 'facebook', 'firebase') NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    login_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider),
    INDEX idx_email (email),
    INDEX idx_login_attempt (login_attempt_at)
);

-- Update existing admin user to support Firebase (optional)
UPDATE users 
SET auth_provider = 'traditional' 
WHERE auth_provider IS NULL OR auth_provider = '';

-- Add trigger to update last_login_at when user logs in
DELIMITER //
CREATE TRIGGER update_last_login 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
BEGIN
    IF NEW.updated_at != OLD.updated_at THEN
        SET NEW.last_login_at = CURRENT_TIMESTAMP;
    END IF;
END//
DELIMITER ;
