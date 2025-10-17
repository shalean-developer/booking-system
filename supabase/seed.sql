-- Sample data for cleaners table
-- Run this after creating the schema to populate with test data

INSERT INTO cleaners (name, photo_url, rating, areas, bio, years_experience, specialties) VALUES
-- Cape Town cleaners
('Sarah Johnson', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', 4.8, ARRAY['Cape Town', 'Camps Bay', 'Sea Point'], 'Professional cleaner with 5 years experience. Specializes in eco-friendly cleaning products.', 5, ARRAY['Eco-friendly', 'Deep cleaning', 'Airbnb prep']),

('Mike Chen', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Cape Town', 'Woodstock', 'Gardens'], 'Experienced cleaner who takes pride in attention to detail. Great with move-in/out cleaning.', 7, ARRAY['Move-in/out', 'Office cleaning', 'Post-construction']),

('Zara Williams', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 4.7, ARRAY['Cape Town', 'V&A Waterfront', 'Green Point'], 'Reliable and thorough cleaner. Perfect for regular maintenance and special occasions.', 4, ARRAY['Regular cleaning', 'Deep cleaning', 'Window cleaning']),

-- Johannesburg cleaners
('David Smith', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 4.6, ARRAY['Johannesburg', 'Sandton', 'Rosebank'], 'Professional cleaner specializing in commercial and residential spaces.', 6, ARRAY['Commercial cleaning', 'Residential', 'Carpet cleaning']),

('Lisa Brown', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Johannesburg', 'Fourways', 'Midrand'], 'Detail-oriented cleaner with excellent customer reviews. Great with Airbnb properties.', 8, ARRAY['Airbnb cleaning', 'Deep cleaning', 'Organizing']),

('James Wilson', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face', 4.8, ARRAY['Johannesburg', 'Pretoria', 'Centurion'], 'Experienced cleaner with a focus on customer satisfaction and quality work.', 9, ARRAY['Move-in/out', 'Post-renovation', 'Eco-friendly']),

-- Durban cleaners
('Thabo Mthembu', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face', 4.7, ARRAY['Durban', 'Umhlanga', 'Ballito'], 'Professional cleaner with extensive experience in coastal properties.', 6, ARRAY['Coastal cleaning', 'Regular maintenance', 'Deep cleaning']),

('Nomsa Dlamini', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Durban', 'Hillcrest', 'Kloof'], 'Reliable and efficient cleaner. Specializes in move-in/out and Airbnb preparation.', 5, ARRAY['Move-in/out', 'Airbnb prep', 'Deep cleaning']),

-- Multi-city cleaners
('Emma Davis', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face', 4.8, ARRAY['Cape Town', 'Johannesburg', 'Durban'], 'Premium cleaning service provider. Available across major cities with high-end service.', 10, ARRAY['Premium cleaning', 'Eco-friendly', 'Commercial', 'Residential']),

('Robert Taylor', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 4.6, ARRAY['Cape Town', 'Johannesburg'], 'Professional cleaner with focus on eco-friendly products and sustainable cleaning methods.', 7, ARRAY['Eco-friendly', 'Sustainable cleaning', 'Regular maintenance']),

('Aisha Patel', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Durban', 'Johannesburg', 'Pretoria'], 'Detail-oriented cleaner with excellent organizational skills. Perfect for busy households.', 6, ARRAY['Organizing', 'Deep cleaning', 'Regular maintenance']),

('Peter van der Merwe', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 4.7, ARRAY['Cape Town', 'Stellenbosch', 'Paarl'], 'Experienced cleaner serving the Cape Winelands area. Specializes in luxury properties.', 8, ARRAY['Luxury cleaning', 'Wine estate cleaning', 'Deep cleaning']),

('Grace Mokoena', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 4.8, ARRAY['Johannesburg', 'Soweto', 'Sandton'], 'Professional cleaner with great attention to detail. Reliable and punctual service.', 5, ARRAY['Regular cleaning', 'Move-in/out', 'Post-construction']),

('Mohammed Hassan', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face', 4.9, ARRAY['Durban', 'Pietermaritzburg', 'Pinetown'], 'Experienced cleaner with excellent customer service. Specializes in residential properties.', 7, ARRAY['Residential cleaning', 'Deep cleaning', 'Regular maintenance']),

('Sipho Nkosi', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face', 4.6, ARRAY['Johannesburg', 'Midrand', 'Fourways'], 'Professional cleaner with focus on customer satisfaction and quality results.', 4, ARRAY['Quality cleaning', 'Customer service', 'Regular maintenance']);
