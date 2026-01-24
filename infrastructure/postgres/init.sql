-- Create delices_user
CREATE USER delices_user WITH PASSWORD 'delices_password';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE delices_db TO delices_user;
ALTER DATABASE delices_db OWNER TO delices_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO delices_user;
ALTER SCHEMA public OWNER TO delices_user;
