USE delegation_db;
SELECT 
    id, 
    title, 
    images,
    CASE 
        WHEN images IS NULL THEN 'NULL'
        WHEN images = '' THEN 'EMPTY'
        ELSE 'HAS_DATA'
    END as images_status
FROM delegation_events 
ORDER BY created_at DESC 
LIMIT 5;
