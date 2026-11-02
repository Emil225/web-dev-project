-- Sample data for IRON-PREP. Runs right after schema.sql, so the products get ids 1 to 6.

INSERT INTO products (name, category, description, price, image_url) VALUES
    ('Endurance Tri-Suit', 'Triathlon', 'Seamless comfort and an aerodynamic fit for all three disciplines.', 189.00,
        'https://images.unsplash.com/photo-1782145373397-19130f8a3114?auto=format&fit=crop&w=800&q=80'),
    ('Flow Aero Helmet', 'Cycling', 'A lightweight race helmet designed for ventilation and speed.', 249.00,
        'https://images.unsplash.com/photo-1749174899667-4553e4f248e2?auto=format&fit=crop&w=800&q=80'),
    ('Race Fuel Gel Pack', 'Nutrition', 'A 12-pack of carbohydrate gels for consistent energy on race day.', 32.90,
        'https://images.unsplash.com/photo-1571623451679-a46085b4c4de?auto=format&fit=crop&w=800&q=80'),
    ('Power Data Kit', 'Training', 'Training accessories to help monitor power and pace your sessions.', 79.00,
        'https://images.unsplash.com/photo-1782655478713-5e3ecc22992a?auto=format&fit=crop&w=800&q=80'),
    ('Open-Water Goggles', 'Swimming', 'Wide-vision lenses and a secure fit for swim training and race day.', 35.00,
        'https://images.unsplash.com/photo-1533060629428-48484ce98a74?auto=format&fit=crop&w=800&q=80'),
    ('Distance Running Shoes', 'Running', 'Cushioned daily trainers made for steady mileage and long runs.', 139.00,
        'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80');

-- Demo account for testing the login. Email: demo@iron-prep.test   Password: IronPrep2026!
INSERT INTO users (name, email, password_hash, target_race) VALUES
    ('Demo Athlete', 'demo@iron-prep.test', '$2a$10$j8cZK/42UeaM3KfDmbGal.UkjL.KMMP8393.4mW7/9Lta.QwGLDUq', 'Ironman Lanzarote');

-- The demo athlete has two products in "My Gear" ...
INSERT INTO wishlist_items (user_id, product_id) VALUES
    (1, 2),
    (1, 5);

-- ... and one saved order: 1 x Tri-Suit (189.00) + 2 x Gel Pack (2 x 32.90) = 254.80
INSERT INTO orders (user_id, total) VALUES (1, 254.80);

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES
    (1, 1, 'Endurance Tri-Suit', 189.00, 1),
    (1, 3, 'Race Fuel Gel Pack', 32.90, 2);
