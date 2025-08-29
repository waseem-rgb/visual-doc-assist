-- First, let's identify duplicates more carefully
-- Keep only the first occurrence of each symptom and delete the rest
WITH duplicates AS (
  SELECT ctid, 
         ROW_NUMBER() OVER (PARTITION BY "Symptoms" ORDER BY ctid) as rn
  FROM public."New Master"
  WHERE "Symptoms" IS NOT NULL
)
DELETE FROM public."New Master" 
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);

-- Handle any null symptoms by giving them unique values
UPDATE public."New Master" 
SET "Symptoms" = 'Unknown symptom ' || ctid::text
WHERE "Symptoms" IS NULL;

-- Now add the primary key constraint on Symptoms column
ALTER TABLE public."New Master" 
ADD CONSTRAINT "New Master_pkey" PRIMARY KEY ("Symptoms");