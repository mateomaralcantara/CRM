-- Add password field to profiles table for backup authentication
ALTER TABLE profiles ADD COLUMN password TEXT;