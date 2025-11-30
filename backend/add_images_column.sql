-- Add images column to delegation_events table
ALTER TABLE delegation_events ADD COLUMN images TEXT NULL;

-- Update existing records to have NULL images (optional)
-- UPDATE delegation_events SET images = NULL WHERE images IS NULL;
