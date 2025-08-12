-- Add vulnerable metadata to chunks in "Possible Vulnerabilities" collection only
-- This script adds a 'vulnerable' boolean field to the metadata of chunks
-- that belong to the collection with name "Possible Vulnerabilities" in cmetadata

-- First, let's see the "Possible Vulnerabilities" collection
SELECT uuid, name, cmetadata 
FROM langchain_pg_collection 
WHERE cmetadata->>'name' = 'Possible Vulnerabilities';

-- Update chunks metadata to add 'vulnerable' boolean field
-- Set default value to false for existing chunks
UPDATE langchain_pg_embedding 
SET cmetadata = COALESCE(cmetadata, '{}'::jsonb) || '{"vulnerable": false}'::jsonb
WHERE collection_id IN (
    SELECT uuid 
    FROM langchain_pg_collection 
    WHERE cmetadata->>'name' = 'Possible Vulnerabilities'
)
AND cmetadata IS NOT NULL;

-- For chunks that don't have metadata yet, create it with vulnerable: false
UPDATE langchain_pg_embedding 
SET cmetadata = '{"vulnerable": false}'::jsonb
WHERE collection_id IN (
    SELECT uuid 
    FROM langchain_pg_collection 
    WHERE cmetadata->>'name' = 'Possible Vulnerabilities'
)
AND cmetadata IS NULL;

-- Verify the update - check that vulnerable field is boolean false
SELECT 
    c.cmetadata->>'name' as collection_name,
    e.id as chunk_id,
    e.cmetadata->>'vulnerable' as vulnerable_status,
    jsonb_typeof(e.cmetadata->'vulnerable') as vulnerable_type,
    e.cmetadata
FROM langchain_pg_embedding e
JOIN langchain_pg_collection c ON e.collection_id = c.uuid
WHERE c.cmetadata->>'name' = 'Possible Vulnerabilities'
LIMIT 10;

-- Count how many chunks were updated with vulnerable field
SELECT 
    COUNT(*) as total_chunks_updated
FROM langchain_pg_embedding e
JOIN langchain_pg_collection c ON e.collection_id = c.uuid
WHERE c.cmetadata->>'name' = 'Possible Vulnerabilities'
AND e.cmetadata ? 'vulnerable';

-- Show the data type of vulnerable field to confirm it's boolean
SELECT 
    c.cmetadata->>'name' as collection_name,
    jsonb_typeof(e.cmetadata->'vulnerable') as vulnerable_field_type,
    e.cmetadata->'vulnerable' as vulnerable_value
FROM langchain_pg_embedding e
JOIN langchain_pg_collection c ON e.collection_id = c.uuid
WHERE c.cmetadata->>'name' = 'Possible Vulnerabilities'
AND e.cmetadata ? 'vulnerable'
LIMIT 5;
