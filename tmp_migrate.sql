UPDATE events SET event_type = 'divers', is_public = 1 WHERE event_type = 'autre';
UPDATE events SET is_public = 0 WHERE event_type = 'repetition';
