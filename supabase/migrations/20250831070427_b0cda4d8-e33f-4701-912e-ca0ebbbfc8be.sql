-- Set replica identity to enable deletes and prepare for CSV import
ALTER TABLE "New Master" REPLICA IDENTITY FULL;

-- Clear existing data from New Master table
DELETE FROM "New Master";

-- Add a comment to indicate table is ready for new CSV data
COMMENT ON TABLE "New Master" IS 'Table cleared and ready for new CSV import with same column structure';