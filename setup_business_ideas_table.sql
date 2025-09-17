-- SQL script to create business_ideas table in Supabase
-- Run this in your Supabase SQL Editor

-- Create the business_ideas table
CREATE TABLE IF NOT EXISTS business_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  summary TEXT DEFAULT '',

  -- Core business information
  problem TEXT,
  solution TEXT,
  industry TEXT,
  business_address JSONB DEFAULT '{}',
  years_in_business TEXT,
  business_stage TEXT,
  problem_solved TEXT,
  target_market TEXT,
  business_model TEXT,
  competitive_advantage TEXT,
  revenue_goals JSONB DEFAULT '{}',

  -- Additional details
  team_size TEXT,
  key_roles TEXT,
  funding_status TEXT,
  funding_needs TEXT,
  marketing_channels TEXT[] DEFAULT '{}',
  additional_context TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Meta information
  ready_for_plan BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_ideas_user_id ON business_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_business_ideas_ready_for_plan ON business_ideas(ready_for_plan);
CREATE INDEX IF NOT EXISTS idx_business_ideas_industry ON business_ideas(industry);
CREATE INDEX IF NOT EXISTS idx_business_ideas_created_at ON business_ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_ideas_last_modified ON business_ideas(last_modified DESC);

-- Create a trigger to automatically update timestamps
CREATE OR REPLACE FUNCTION update_business_ideas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_business_ideas_timestamp_trigger ON business_ideas;
CREATE TRIGGER update_business_ideas_timestamp_trigger
  BEFORE UPDATE ON business_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_business_ideas_timestamp();

-- Enable Row Level Security
ALTER TABLE business_ideas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own business ideas" ON business_ideas
  FOR SELECT USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can create their own business ideas" ON business_ideas
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own business ideas" ON business_ideas
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own business ideas" ON business_ideas
  FOR DELETE USING (user_id = auth.uid()::TEXT);