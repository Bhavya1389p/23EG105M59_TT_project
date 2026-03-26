-- Drop all existing tables and policies
-- Run this ONLY if you want to completely reset your database

-- Drop tables in reverse order (to handle foreign key constraints)
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop any existing policies (if tables were recreated)
-- Note: CASCADE above should handle this, but just to be safe

-- Confirm reset
SELECT 'Database reset complete. Now run 001_create_tables.sql' as status;
