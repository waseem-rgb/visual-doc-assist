-- Add columns to store both analysis and test report PDFs
ALTER TABLE prescription_requests 
ADD COLUMN analysis_pdf_url TEXT,
ADD COLUMN test_report_pdf_url TEXT;