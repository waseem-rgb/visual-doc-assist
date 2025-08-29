-- First, set replica identity to full for the table
ALTER TABLE public."New Master" REPLICA IDENTITY FULL;

-- Check for and handle duplicate symptoms
WITH duplicates AS (
  SELECT "Symptoms", 
         ROW_NUMBER() OVER (PARTITION BY "Symptoms" ORDER BY ctid) as rn
  FROM public."New Master"
  WHERE "Symptoms" IS NOT NULL
)
UPDATE public."New Master" 
SET "Symptoms" = CASE 
  WHEN d.rn > 1 THEN "New Master"."Symptoms" || ' (variant ' || d.rn || ')'
  ELSE "New Master"."Symptoms"
END
FROM duplicates d
WHERE "New Master"."Symptoms" = d."Symptoms" AND d.rn > 1;

-- Now add the primary key constraint on Symptoms column
ALTER TABLE public."New Master" 
ADD CONSTRAINT "New Master_pkey" PRIMARY KEY ("Symptoms");