-- Add scenario_json column to market_stories table
ALTER TABLE market_stories ADD COLUMN scenario_json TEXT;

-- Create index for potential queries on scenario data
CREATE INDEX idx_market_stories_scenario_json ON market_stories(scenario_json) WHERE scenario_json IS NOT NULL;
