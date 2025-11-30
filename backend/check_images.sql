USE delegation_db;
SELECT 
    id, 
    title, 
    date, 
    location,
    images,
    created_at 
FROM delegation_events 
ORDER BY created_at DESC;
