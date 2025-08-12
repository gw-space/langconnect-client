-- Update source metadata from "claude-opus-4" to "claude opus 4" in Possible Vulnerabilities collection
-- This script updates the source field in the metadata of chunks that belong to the collection with name "Possible Vulnerabilities"

-- First, let's see how many chunks have "claude-opus-4" as source
SELECT 
    COUNT(*) as chunks_with_claude_opus_4
FROM langchain_pg_embedding e
JOIN langchain_pg_collection c ON e.collection_id = c.uuid
WHERE c.cmetadata->>'name' = 'Possible Vulnerabilities'
AND e.cmetadata->>'source' = 'claude-opus-4';

-- Show some examples before update
SELECT 
    e.id as chunk_id,
    e.cmetadata->>'source' as current_source,
    e.cmetadata->>'vulnerable' as vulnerable_status
FROM langchain_pg_embedding e
JOIN langchain_pg_collection c ON e.collection_id = c.uuid
WHERE c.cmetadata->>'name' = 'Possible Vulnerabilities'
AND e.cmetadata->>'source' = 'claude-opus-4'
LIMIT 5;

-- Update the source metadata from "claude-opus-4" to "claude opus 4"
UPDATE langchain_pg_embedding 
SET cmetadata = jsonb_set(
    cmetadata, 
    '{source}', 
    '"claude opus 4"'
)
WHERE collection_id IN (
    SELECT uuid 
    FROM langchain_pg_collection 
    WHERE cmetadata->>'name' = 'Possible Vulnerabilities'
)
AND cmetadata->>'source' = 'claude-opus-4';

-- Verify the update - check that source field is updated
SELECT 
    e.id as chunk_id,
    e.cmetadata->>'source' as updated_source,
    e.cmetadata->>'vulnerable' as vulnerable_status
FROM langchain_pg_embedding e
JOIN langchain_pg_collection c ON e.collection_id = c.uuid
WHERE c.cmetadata->>'name' = 'Possible Vulnerabilities'
AND e.cmetadata->>'source' = 'claude opus 4'
LIMIT 5;

-- Count how many chunks were updated
SELECT 
    COUNT(*) as total_chunks_updated
FROM langchain_pg_embedding e
JOIN langchain_pg_collection c ON e.collection_id = c.uuid
WHERE c.cmetadata->>'name' = 'Possible Vulnerabilities'
AND e.cmetadata->>'source' = 'claude opus 4';
