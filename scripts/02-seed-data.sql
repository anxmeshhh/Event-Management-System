USE event_registration;

-- Insert admin user (password: admin123)
-- Note: You'll need to hash this password properly in your application
INSERT IGNORE INTO users (email, password_hash, full_name, role) VALUES 
('admin@example.com', '$2b$10$rQZ9QmjlhQZ9QmjlhQZ9Qu', 'Admin User', 'admin');

-- Insert sample events
INSERT IGNORE INTO events (title, description, event_date, event_time, location, max_capacity, created_by) VALUES 
('Web Development Workshop', 'Learn modern web development with React and Next.js', '2024-07-15', '10:00:00', 'Tech Hub Conference Room A', 50, 1),
('Digital Marketing Webinar', 'Strategies for effective digital marketing in 2024', '2024-07-20', '14:00:00', 'Online - Zoom', 100, 1),
('AI & Machine Learning Seminar', 'Introduction to AI and ML concepts for beginners', '2024-07-25', '09:00:00', 'University Auditorium', 75, 1),
('Startup Pitch Competition', 'Present your startup idea to investors and mentors', '2024-08-01', '18:00:00', 'Innovation Center', 30, 1);