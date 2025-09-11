-- Migration: Add show_thinking column to user_preferences table
-- This allows users to set their preference for showing AI thinking process

-- Add show_thinking column with default value of 0 (false)
ALTER TABLE user_preferences 
ADD COLUMN show_thinking INTEGER DEFAULT 0;