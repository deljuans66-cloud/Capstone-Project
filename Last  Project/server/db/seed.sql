-- Gaming Hub Seed Data

-- Insert platforms
INSERT INTO platforms (name) VALUES
('Nintendo'),
('PlayStation'),
('Xbox'),
('PC');

-- Nintendo games (platform_id = 1)
INSERT INTO games (title, platform_id) VALUES
('The Legend of Zelda: Tears of the Kingdom', 1),
('Super Mario Bros. Wonder', 1),
('Mario Kart 8 Deluxe', 1),
('Super Smash Bros. Ultimate', 1),
('Animal Crossing: New Horizons', 1),
('Splatoon 3', 1),
('Pokemon Scarlet', 1),
('Pokemon Violet', 1),
('Fire Emblem Engage', 1),
('Metroid Dread', 1),
('Kirby and the Forgotten Land', 1),
('Xenoblade Chronicles 3', 1),
('Bayonetta 3', 1),
('Pikmin 4', 1),
('Luigi''s Mansion 3', 1),
('Mario Party Superstars', 1),
('Nintendo Switch Sports', 1),
('Ring Fit Adventure', 1),
('Astral Chain', 1),
('Hyrule Warriors: Age of Calamity', 1);

-- PlayStation games (platform_id = 2)
INSERT INTO games (title, platform_id) VALUES
('Spider-Man 2', 2),
('God of War Ragnarok', 2),
('Final Fantasy XVI', 2),
('Horizon Forbidden West', 2),
('The Last of Us Part II', 2),
('Ghost of Tsushima', 2),
('Ratchet & Clank: Rift Apart', 2),
('Demon''s Souls', 2),
('Returnal', 2),
('Gran Turismo 7', 2),
('Uncharted: Legacy of Thieves', 2),
('MLB The Show 24', 2),
('Stellar Blade', 2),
('Final Fantasy VII Rebirth', 2),
('Helldivers 2', 2),
('Bloodborne', 2),
('Persona 5 Royal', 2),
('Death Stranding', 2),
('Astro''s Playroom', 2),
('Sackboy: A Big Adventure', 2);

-- Xbox games (platform_id = 3)
INSERT INTO games (title, platform_id) VALUES
('Halo Infinite', 3),
('Forza Horizon 5', 3),
('Starfield', 3),
('Gears 5', 3),
('Sea of Thieves', 3),
('Grounded', 3),
('Ori and the Will of the Wisps', 3),
('Psychonauts 2', 3),
('Flight Simulator 2020', 3),
('Forza Motorsport', 3),
('Hi-Fi Rush', 3),
('Redfall', 3),
('Age of Empires IV', 3),
('State of Decay 2', 3),
('Minecraft Legends', 3),
('Pentiment', 3),
('As Dusk Falls', 3),
('The Outer Worlds', 3),
('Bleeding Edge', 3),
('Tell Me Why', 3);

-- PC games (platform_id = 4)
INSERT INTO games (title, platform_id) VALUES
('Baldur''s Gate 3', 4),
('Counter-Strike 2', 4),
('Dota 2', 4),
('League of Legends', 4),
('Valorant', 4),
('Elden Ring', 4),
('Cyberpunk 2077', 4),
('Palworld', 4),
('Lethal Company', 4),
('Hogwarts Legacy', 4),
('Diablo IV', 4),
('Path of Exile', 4),
('World of Warcraft', 4),
('Apex Legends', 4),
('Overwatch 2', 4),
('Rust', 4),
('ARK: Survival Ascended', 4),
('Cities: Skylines II', 4),
('Satisfactory', 4),
('Deep Rock Galactic', 4);
