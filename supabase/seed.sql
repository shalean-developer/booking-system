-- Sample data for cleaners table
-- Run this after creating the schema to populate with test data

INSERT INTO cleaners (name, photo_url, rating, areas, bio, years_experience, specialties) VALUES
-- Cape Town cleaners
('Normatter Mazhinji', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', 4.8, ARRAY['Camps Bay', 'Sea Point', 'Green Point', 'Woodstock', 'Gardens', 'V&A Waterfront', 'Claremont', 'Newlands', 'Rondebosch', 'Observatory'], 'Professional cleaner with 5 years experience. Specializes in eco-friendly cleaning products.', 5, ARRAY['Eco-friendly', 'Deep cleaning', 'Airbnb prep']),

('Lucia Pazvakavambwa', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Muizenberg', 'Constantia', 'Hout Bay', 'Clifton', 'Bantry Bay', 'Tamboerskloof', 'City Bowl', 'Table View', 'Bloubergstrand', 'Milnerton'], 'Experienced cleaner who takes pride in attention to detail. Great with move-in/out cleaning.', 7, ARRAY['Move-in/out', 'Office cleaning', 'Post-construction']),

('Ruvarashe Pazvakavambwa', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 4.7, ARRAY['Bellville', 'Parow', 'Somerset West', 'Strand', 'Fish Hoek', 'Kalk Bay', 'Simon''s Town', 'Kenilworth', 'Wynberg', 'Plumstead'], 'Reliable and thorough cleaner. Perfect for regular maintenance and special occasions.', 4, ARRAY['Regular cleaning', 'Deep cleaning', 'Window cleaning']),

-- Johannesburg cleaners
('Lucia Chiuta', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 4.6, ARRAY['Bishopscourt', 'Tokai', 'Bergvliet', 'Diep River', 'Lakeside', 'Noordhoek', 'Kommetjie', 'Scarborough', 'Camps Bay', 'Sea Point'], 'Professional cleaner specializing in commercial and residential spaces.', 6, ARRAY['Commercial cleaning', 'Residential', 'Carpet cleaning']),

('Thandeka', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Green Point', 'Woodstock', 'Gardens', 'V&A Waterfront', 'Claremont', 'Newlands', 'Rondebosch', 'Observatory', 'Muizenberg', 'Constantia'], 'Detail-oriented cleaner with excellent customer reviews. Great with Airbnb properties.', 8, ARRAY['Airbnb cleaning', 'Deep cleaning', 'Organizing']),

('Tsungaimunashe', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face', 4.8, ARRAY['Hout Bay', 'Clifton', 'Bantry Bay', 'Tamboerskloof', 'City Bowl', 'Table View', 'Bloubergstrand', 'Milnerton', 'Bellville', 'Parow'], 'Experienced cleaner with a focus on customer satisfaction and quality work.', 9, ARRAY['Move-in/out', 'Post-renovation', 'Eco-friendly']),

-- Durban cleaners
('Mary Mugari', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face', 4.7, ARRAY['Somerset West', 'Strand', 'Fish Hoek', 'Kalk Bay', 'Simon''s Town', 'Kenilworth', 'Wynberg', 'Plumstead', 'Bishopscourt', 'Tokai'], 'Professional cleaner with extensive experience in coastal properties.', 6, ARRAY['Coastal cleaning', 'Regular maintenance', 'Deep cleaning']),

('Shyleen Pfende', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Bergvliet', 'Diep River', 'Lakeside', 'Noordhoek', 'Kommetjie', 'Scarborough', 'Camps Bay', 'Sea Point', 'Green Point', 'Woodstock'], 'Reliable and efficient cleaner. Specializes in move-in/out and Airbnb preparation.', 5, ARRAY['Move-in/out', 'Airbnb prep', 'Deep cleaning']),

-- Multi-city cleaners
('Nicole James', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face', 4.8, ARRAY['Gardens', 'V&A Waterfront', 'Claremont', 'Newlands', 'Rondebosch', 'Observatory', 'Muizenberg', 'Constantia', 'Hout Bay', 'Clifton'], 'Premium cleaning service provider. Available across major cities with high-end service.', 10, ARRAY['Premium cleaning', 'Eco-friendly', 'Commercial', 'Residential']),

('Estery', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 4.6, ARRAY['Bantry Bay', 'Tamboerskloof', 'City Bowl', 'Table View', 'Bloubergstrand', 'Milnerton', 'Bellville', 'Parow', 'Somerset West', 'Strand'], 'Professional cleaner with focus on eco-friendly products and sustainable cleaning methods.', 7, ARRAY['Eco-friendly', 'Sustainable cleaning', 'Regular maintenance']),

('Maggert Jiri', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Fish Hoek', 'Kalk Bay', 'Simon''s Town', 'Kenilworth', 'Wynberg', 'Plumstead', 'Bishopscourt', 'Tokai', 'Bergvliet', 'Diep River'], 'Detail-oriented cleaner with excellent organizational skills. Perfect for busy households.', 6, ARRAY['Organizing', 'Deep cleaning', 'Regular maintenance']),

('Silibaziso', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 4.7, ARRAY['Lakeside', 'Noordhoek', 'Kommetjie', 'Scarborough', 'Camps Bay', 'Sea Point', 'Green Point', 'Woodstock', 'Gardens', 'V&A Waterfront'], 'Experienced cleaner serving the Cape Winelands area. Specializes in luxury properties.', 8, ARRAY['Luxury cleaning', 'Wine estate cleaning', 'Deep cleaning']),

('Ethel', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 4.8, ARRAY['Claremont', 'Newlands', 'Rondebosch', 'Observatory', 'Muizenberg', 'Constantia', 'Hout Bay', 'Clifton', 'Bantry Bay', 'Tamboerskloof'], 'Professional cleaner with great attention to detail. Reliable and punctual service.', 5, ARRAY['Regular cleaning', 'Move-in/out', 'Post-construction']),

('Mitchell', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['City Bowl', 'Table View', 'Bloubergstrand', 'Milnerton', 'Bellville', 'Parow', 'Somerset West', 'Strand', 'Fish Hoek', 'Kalk Bay'], 'Experienced cleaner with excellent customer service. Specializes in residential properties.', 7, ARRAY['Residential cleaning', 'Deep cleaning', 'Regular maintenance']),

('Nyasha Mudani', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face', 4.6, ARRAY['Simon''s Town', 'Kenilworth', 'Wynberg', 'Plumstead', 'Bishopscourt', 'Tokai', 'Bergvliet', 'Diep River', 'Lakeside', 'Noordhoek'], 'Professional cleaner with focus on customer satisfaction and quality results.', 4, ARRAY['Quality cleaning', 'Customer service', 'Regular maintenance']);
