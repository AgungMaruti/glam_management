-- Migration: Add hpp_bahan and hpp_full_cost columns to rad table
-- Run this in Supabase SQL Editor

ALTER TABLE rad ADD COLUMN IF NOT EXISTS hpp_bahan numeric DEFAULT 0;
ALTER TABLE rad ADD COLUMN IF NOT EXISTS hpp_full_cost numeric DEFAULT 0;
