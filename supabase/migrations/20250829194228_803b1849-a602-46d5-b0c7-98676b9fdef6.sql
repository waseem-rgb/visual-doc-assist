-- Clear existing data from Medication_new table
DELETE FROM public."Medication_new";

-- Reset any sequences if needed (though this table doesn't seem to have auto-incrementing IDs)
-- The table is now ready for your new CSV data to be inserted