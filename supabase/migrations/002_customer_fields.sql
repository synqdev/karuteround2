-- Phase 3: Add structured customer fields
-- The original schema had a single contact_info text column.
-- User decisions require separate phone, email, and furigana fields.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS furigana text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email text;

-- Migrate any existing contact_info data is not needed (no data exists yet at this point).
-- Keep contact_info column for backward compatibility but it will not be used going forward.

COMMENT ON COLUMN customers.furigana IS 'Japanese reading/pronunciation of customer name (katakana or hiragana)';
COMMENT ON COLUMN customers.phone IS 'Customer phone number';
COMMENT ON COLUMN customers.email IS 'Customer email address';
