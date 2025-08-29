-- First, let's check for duplicate symptoms
SELECT "Symptoms", COUNT(*) as count 
FROM public."New Master" 
WHERE "Symptoms" IS NOT NULL
GROUP BY "Symptoms" 
HAVING COUNT(*) > 1;

-- If there are duplicates, we need to make them unique first
-- Let's update duplicate entries by appending a number
WITH duplicates AS (
  SELECT "Symptoms", 
         ROW_NUMBER() OVER (PARTITION BY "Symptoms" ORDER BY "Symptoms") as rn
  FROM public."New Master"
  WHERE "Symptoms" IS NOT NULL
)
UPDATE public."New Master" 
SET "Symptoms" = CASE 
  WHEN d.rn > 1 THEN "New Master"."Symptoms" || ' (' || d.rn || ')'
  ELSE "New Master"."Symptoms"
END
FROM duplicates d
WHERE "New Master"."Symptoms" = d."Symptoms" AND d.rn > 1;

-- Now add the primary key constraint on Symptoms column
ALTER TABLE public."New Master" 
ADD CONSTRAINT "New Master_pkey" PRIMARY KEY ("Symptoms");