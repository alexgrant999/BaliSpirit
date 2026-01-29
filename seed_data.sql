
-- Bali Spirit Festival Sample Data Import
-- Run this in the Supabase SQL Editor

-- 1. CLEANUP
TRUNCATE TABLE event_presenters CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE presenters CASCADE;
TRUNCATE TABLE venues CASCADE;
TRUNCATE TABLE categories CASCADE;

-- 2. INSERT CATEGORIES
INSERT INTO categories (name, color) VALUES
('Yoga', '#ef4444'),
('Music', '#22c55e'),
('Meditation', '#3b82f6'),
('Talks', '#eab308'),
('Dance', '#a855f7'),
('Workshop', '#f97316');

-- 3. INSERT VENUES
INSERT INTO venues (name, description) VALUES
('Dharma Pavilion', 'The main stage for large-scale yoga and flow sessions.'),
('Spirit Pool Stage', 'Sun-drenched stage perfect for upbeat music and movement.'),
('The Grove', 'A shaded sanctuary under tropical trees for workshops.'),
('Soul Lounge', 'Intimate space for talks, storytelling, and acoustic music.'),
('Healing Shala', 'Dedicated space for meditation and deep restorative practices.');

-- 4. INSERT PRESENTERS
INSERT INTO presenters (name, bio, image, instagram, website) VALUES
('Ananda Das', 'Renowned kirtan artist and yoga teacher with 20 years experience in the bhakti tradition.', 'https://picsum.photos/seed/ananda/400/400', '@anandadas', 'anandadas.com'),
('Sarah Flow', 'Vinyasa flow specialist focused on somatic movement and the intersection of dance and yoga.', 'https://picsum.photos/seed/sarah/400/400', '@sarahflow_yoga', NULL),
('DJ Sol', 'Ecstatic dance pioneer from Ibiza, mixing tribal rhythms with deep house medicine.', 'https://picsum.photos/seed/djsol/400/400', '@dj_sol_spirit', NULL),
('Maya Fiennes', 'Global Kundalini teacher known for her unique style combining yoga, tai chi, and qi gong.', 'https://picsum.photos/seed/maya/400/400', NULL, 'mayafiennes.com'),
('Simon Borg-Olivier', 'Physiotherapist and yoga synergy founder with over 30 years of teaching experience.', 'https://picsum.photos/seed/simon/400/400', NULL, NULL),
('Janet Stone', 'San Francisco-based teacher focusing on the vinyasa of life and the power of breath.', 'https://picsum.photos/seed/janet/400/400', '@janetstoneyoga', NULL),
('Dustin Thomas', 'International beatbox-roots-folk artist known for his high-energy acoustic performances.', 'https://picsum.photos/seed/dustin/400/400', NULL, NULL),
('Malaika MaVeena', 'Expert facilitator of 5Rhythms and African dance, bridging culture and consciousness.', 'https://picsum.photos/seed/malaika/400/400', NULL, NULL),
('Tenzin Priyadarshi', 'Buddhist monk and philosopher focused on the ethics of compassion and technology.', 'https://picsum.photos/seed/tenzin/400/400', NULL, NULL),
('Guru Ganesha', 'Guitarist and singer blending traditional Sikh chants with Western musical arrangements.', 'https://picsum.photos/seed/guru/400/400', NULL, NULL);

-- 5. INSERT EVENTS & LINKS
DO $$
DECLARE
    cat_yoga UUID := (SELECT id FROM categories WHERE name = 'Yoga');
    cat_music UUID := (SELECT id FROM categories WHERE name = 'Music');
    cat_meditation UUID := (SELECT id FROM categories WHERE name = 'Meditation');
    cat_talks UUID := (SELECT id FROM categories WHERE name = 'Talks');
    cat_dance UUID := (SELECT id FROM categories WHERE name = 'Dance');
    cat_workshop UUID := (SELECT id FROM categories WHERE name = 'Workshop');

    v_dharma UUID := (SELECT id FROM venues WHERE name = 'Dharma Pavilion');
    v_pool UUID := (SELECT id FROM venues WHERE name = 'Spirit Pool Stage');
    v_grove UUID := (SELECT id FROM venues WHERE name = 'The Grove');
    v_soul UUID := (SELECT id FROM venues WHERE name = 'Soul Lounge');
    v_healing UUID := (SELECT id FROM venues WHERE name = 'Healing Shala');

    p_ananda UUID := (SELECT id FROM presenters WHERE name = 'Ananda Das');
    p_sarah UUID := (SELECT id FROM presenters WHERE name = 'Sarah Flow');
    p_sol UUID := (SELECT id FROM presenters WHERE name = 'DJ Sol');
    p_maya UUID := (SELECT id FROM presenters WHERE name = 'Maya Fiennes');
    p_simon UUID := (SELECT id FROM presenters WHERE name = 'Simon Borg-Olivier');
    p_janet UUID := (SELECT id FROM presenters WHERE name = 'Janet Stone');
    p_dustin UUID := (SELECT id FROM presenters WHERE name = 'Dustin Thomas');
    p_malaika UUID := (SELECT id FROM presenters WHERE name = 'Malaika MaVeena');
    p_tenzin UUID := (SELECT id FROM presenters WHERE name = 'Tenzin Priyadarshi');
    p_guru UUID := (SELECT id FROM presenters WHERE name = 'Guru Ganesha');

    eid UUID;
BEGIN
    INSERT INTO events (title, description, start_time, end_time, venue_id, category_id, tags)
    VALUES ('Sunrise Flow: Grounding in Bali', 'A gentle morning vinyasa to connect with the island spirits.', '2025-05-01 07:30:00+00', '2025-05-01 09:00:00+00', v_dharma, cat_yoga, '{Yoga Flow, Deep Restorative}') RETURNING id INTO eid;
    INSERT INTO event_presenters (event_id, presenter_id) VALUES (eid, p_sarah);

    INSERT INTO events (title, description, start_time, end_time, venue_id, category_id, tags)
    VALUES ('The Art of Conscious Breathing', 'Pranayama workshop to unlock vital energy and mental clarity.', '2025-05-01 09:30:00+00', '2025-05-01 11:00:00+00', v_grove, cat_workshop, '{Breathwork, Active Workshops}') RETURNING id INTO eid;
    INSERT INTO event_presenters (event_id, presenter_id) VALUES (eid, p_simon);

    INSERT INTO events (title, description, start_time, end_time, venue_id, category_id, tags)
    VALUES ('Kirtan Jam with Ananda', 'Devotional chanting to open the heart and raise the collective vibration.', '2025-05-01 11:30:00+00', '2025-05-01 13:00:00+00', v_pool, cat_music, '{Kirtan, Healing Music}') RETURNING id INTO eid;
    INSERT INTO event_presenters (event_id, presenter_id) VALUES (eid, p_ananda);

    INSERT INTO events (title, description, start_time, end_time, venue_id, category_id, tags)
    VALUES ('Ecstatic Dance Opening', 'Shake off the past and move into the present with DJ Sol.', '2025-05-01 16:00:00+00', '2025-05-01 18:00:00+00', v_pool, cat_dance, '{Ecstatic Dance, High Energy Dance}') RETURNING id INTO eid;
    INSERT INTO event_presenters (event_id, presenter_id) VALUES (eid, p_sol);

    INSERT INTO events (title, description, start_time, end_time, venue_id, category_id, tags)
    VALUES ('Sound Healing Bath', 'Crystal bowls and sacred chants for deep cellular repair.', '2025-05-01 16:00:00+00', '2025-05-01 17:30:00+00', v_healing, cat_meditation, '{Sound Healing, Deep Restorative}') RETURNING id INTO eid;
    INSERT INTO event_presenters (event_id, presenter_id) VALUES (eid, p_ananda);
    INSERT INTO event_presenters (event_id, presenter_id) VALUES (eid, p_guru);
END $$;
