-- Restore delegation events based on uploaded images
-- Generated automatically

-- Event 1: 2025-11-27 (approx)
INSERT INTO delegation_events (id, title, date, location, description, images, created_at)
VALUES (
  'evt-1764399123437',
  'Activité de la Délégation - Distribution',
  CURDATE(),
  'Goz Beïda',
  'Images restaurées automatiquement.',
  '["event-1764399123437-207975373.jpg", "event-1764399123463-265583466.jpg", "event-1764399123480-38227737.jpg"]',
  1764399123437
) ON DUPLICATE KEY UPDATE images = VALUES(images);

-- Event 2
INSERT INTO delegation_events (id, title, date, location, description, images, created_at)
VALUES (
  'evt-1764417220676',
  'Visite de terrain - Site Réfugiés',
  CURDATE(),
  'Camp Kounoungou',
  'Images restaurées automatiquement.',
  '["event-1764417220676-82539782.jpg", "event-1764417220745-696368158.jpg", "event-1764417220809-392099233.jpg"]',
  1764417220676
) ON DUPLICATE KEY UPDATE images = VALUES(images);

-- Event 3
INSERT INTO delegation_events (id, title, date, location, description, images, created_at)
VALUES (
  'evt-1764417301167',
  'Réunion de Coordination',
  CURDATE(),
  'Délégation Sila',
  'Images restaurées automatiquement.',
  '["event-1764417301167-680039343.jpg", "event-1764417301246-223685020.jpg", "event-1764417301368-720117829.jpg"]',
  1764417301167
) ON DUPLICATE KEY UPDATE images = VALUES(images);

-- Event 4
INSERT INTO delegation_events (id, title, date, location, description, images, created_at)
VALUES (
  'evt-1764417377089',
  'Mission Conjointe',
  CURDATE(),
  'Adré',
  'Images restaurées automatiquement.',
  '["event-1764417377089-605562818.jpg", "event-1764417377191-959652762.jpg"]',
  1764417377089
) ON DUPLICATE KEY UPDATE images = VALUES(images);

-- Event 5
INSERT INTO delegation_events (id, title, date, location, description, images, created_at)
VALUES (
  'evt-1764418047821',
  'Sensibilisation Communautaire',
  CURDATE(),
  'Province Sila',
  'Images restaurées automatiquement.',
  '["event-1764418047821-218160790.jpg", "event-1764418047853-538006341.jpg", "event-1764418047888-60929620.jpg"]',
  1764418047821
) ON DUPLICATE KEY UPDATE images = VALUES(images);

-- Event 6
INSERT INTO delegation_events (id, title, date, location, description, images, created_at)
VALUES (
  'evt-1764418595957',
  'Formation des Partenaires',
  CURDATE(),
  'Centre Social',
  'Images restaurées automatiquement.',
  '["event-1764418595957-117826652.jpg", "event-1764418596037-154716279.jpg"]',
  1764418595957
) ON DUPLICATE KEY UPDATE images = VALUES(images);

-- Event 7
INSERT INTO delegation_events (id, title, date, location, description, images, created_at)
VALUES (
  'evt-1764434226610',
  'Suivi de Projets',
  CURDATE(),
  'Terrain',
  'Images restaurées automatiquement.',
  '["event-1764434226610-244460109.jpg", "event-1764434226656-572095221.jpg", "event-1764434226697-903497493.jpg"]',
  1764434226610
) ON DUPLICATE KEY UPDATE images = VALUES(images);

-- Event 8
INSERT INTO delegation_events (id, title, date, location, description, images, created_at)
VALUES (
  'evt-1764434233045',
  'Cérémonie Officielle',
  CURDATE(),
  'Gouvernorat',
  'Images restaurées automatiquement.',
  '["event-1764434233045-769770824.jpg", "event-1764434233105-145967368.jpg", "event-1764434233201-47400346.jpg"]',
  1764434233045
) ON DUPLICATE KEY UPDATE images = VALUES(images);
