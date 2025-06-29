-- Migration: Add scenario_json column to stories table
-- Date: 2025-06-23
-- Description: Add scenario_json field to store the scenario state when a story is generated

ALTER TABLE stories ADD COLUMN scenario_json TEXT;
