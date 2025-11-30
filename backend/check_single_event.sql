USE delegation_db;
SELECT 
    id, 
    title, 
    images,
    LENGTH(images) as images_length
FROM delegation_events 
WHERE id = '8e18d595-fb02-4d9b-9d6c-70b136737443';
