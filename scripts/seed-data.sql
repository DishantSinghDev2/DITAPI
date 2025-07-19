-- Seed data for DITAPI platform

-- Insert categories
INSERT INTO categories (name, slug, description) VALUES
('AI & Machine Learning', 'ai-ml', 'APIs for artificial intelligence, machine learning, and data science'),
('Payments', 'payments', 'Payment processing and financial APIs'),
('Social Media', 'social-media', 'APIs for social media platforms and social networking'),
('Weather', 'weather', 'APIs for weather data and forecasting'),
('Maps & Location', 'maps-location', 'APIs for mapping, geolocation, and navigation'),
('Finance', 'finance', 'Financial data and trading APIs'),
('Communication', 'communication', 'APIs for messaging, email, and communication services'),
('Data & Analytics', 'data-analytics', 'APIs for data processing, analytics, and business intelligence'),
('Security', 'security', 'APIs for cybersecurity, authentication, and data protection'),
('Media & Entertainment', 'media-entertainment', 'APIs for video, audio, and entertainment content'),
('Healthcare', 'healthcare', 'APIs for health data, medical services, and wellness'),
('Travel', 'travel', 'APIs for travel booking, transportation, and tourism'),
('News & Information', 'news-information', 'APIs for news, articles, and information services'),
('Productivity', 'productivity', 'APIs for productivity tools and business applications'),
('Gaming', 'gaming', 'APIs for gaming platforms and game development');

-- Insert sample providers
INSERT INTO providers (name, slug, description, website, support_email, is_verified) VALUES
('OpenAI', 'openai', 'Leading AI research company', 'https://openai.com', 'support@openai.com', true),
('Stripe', 'stripe', 'Online payment processing', 'https://stripe.com', 'support@stripe.com', true),
('WeatherCorp', 'weathercorp', 'Weather data provider', 'https://weathercorp.com', 'support@weathercorp.com', true),
('Google', 'google', 'Technology company', 'https://google.com', 'support@google.com', true),
('Twitter', 'twitter', 'Social media platform', 'https://twitter.com', 'support@twitter.com', true),
('SendGrid', 'sendgrid', 'Email delivery service', 'https://sendgrid.com', 'support@sendgrid.com', true);

-- Insert sample APIs
INSERT INTO apis (name, slug, description, long_description, provider_id, base_url, documentation_url, support_url, terms_url, privacy_url, rating, total_subscribers, average_latency, uptime_percentage, status, is_public, is_featured) VALUES
('OpenAI GPT-4', 'openai-gpt4', 'Advanced language model for text generation, completion, and conversation.', 'The OpenAI GPT-4 API provides access to OpenAI''s most advanced language model, capable of understanding and generating human-like text. It can be used for a wide range of applications including content creation, summarization, translation, and conversational AI.', 
(SELECT id FROM providers WHERE slug = 'openai'), 'https://api.openai.com/v1', 'https://platform.openai.com/docs/models/gpt-4', 'https://help.openai.com/', 'https://openai.com/terms/', 'https://openai.com/privacy/', 4.8, 125000, 250, 99.9, 'active', true, true),
('Stripe Payments', 'stripe-payments', 'Complete payment processing solution for online businesses.', 'The Stripe Payments API offers a robust and flexible platform for accepting payments online. It supports various payment methods, recurring billing, and fraud prevention, making it ideal for e-commerce, SaaS, and marketplace businesses.',
(SELECT id FROM providers WHERE slug = 'stripe'), 'https://api.stripe.com/v1', 'https://stripe.com/docs/api', 'https://support.stripe.com/', 'https://stripe.com/legal/terms', 'https://stripe.com/privacy', 4.9, 89000, 120, 99.95, 'active', true, true),
('Weather API', 'weather-api', 'Real-time weather data and forecasts for any location worldwide.', 'The Weather API provides accurate and up-to-date weather information, including current conditions, hourly forecasts, and daily forecasts. It supports global locations and various data points like temperature, humidity, wind speed, and precipitation.',
(SELECT id FROM providers WHERE slug = 'weathercorp'), 'https://api.weather.com/v1', 'https://docs.weatherapi.com/', 'https://www.weatherapi.com/contact.aspx', 'https://www.weatherapi.com/terms.aspx', 'https://www.weatherapi.com/privacy.aspx', 4.6, 45000, 180, 99.8, 'active', true, false),
('Google Maps', 'google-maps', 'Comprehensive mapping, geocoding, and location services.', 'The Google Maps Platform APIs allow developers to integrate Google Maps directly into their applications. Features include interactive maps, geocoding (converting addresses to coordinates), routing, and place search, enabling location-aware experiences.',
(SELECT id FROM providers WHERE slug = 'google'), 'https://maps.googleapis.com/maps/api', 'https://developers.google.com/maps/documentation', 'https://cloud.google.com/support', 'https://cloud.google.com/terms', 'https://cloud.google.com/privacy', 4.7, 200000, 95, 99.9, 'active', true, true),
('Twitter API', 'twitter-api', 'Access tweets, user data, and social media analytics.', 'The Twitter API enables developers to interact with Twitter data, including fetching tweets, managing user profiles, and analyzing social trends. It''s essential for building social listening tools, marketing platforms, and data analysis applications.',
(SELECT id FROM providers WHERE slug = 'twitter'), 'https://api.twitter.com/2', 'https://developer.twitter.com/en/docs/twitter-api', 'https://help.twitter.com/en/forms/developer', 'https://twitter.com/privacy', 4.3, 78000, 200, 99.7, 'active', true, false),
('SendGrid Email', 'sendgrid-email', 'Reliable email delivery service for transactional and marketing emails.', 'SendGrid''s Email API provides a scalable and reliable way to send transactional and marketing emails. It offers features like email tracking, analytics, and template management, ensuring high deliverability for your communications.',
(SELECT id FROM providers WHERE slug = 'sendgrid'), 'https://api.sendgrid.com/v3', 'https://docs.sendgrid.com/api-reference/', 'https://support.sendgrid.com/', 'https://sendgrid.com/legal/tos/', 'https://sendgrid.com/legal/privacy/', 4.5, 56000, 150, 99.85, 'active', true, false);

-- Link APIs to categories
INSERT INTO api_categories (api_id, category_id) VALUES
((SELECT id FROM apis WHERE slug = 'openai-gpt4'), (SELECT id FROM categories WHERE slug = 'ai-ml')),
((SELECT id FROM apis WHERE slug = 'stripe-payments'), (SELECT id FROM categories WHERE slug = 'payments')),
((SELECT id FROM apis WHERE slug = 'stripe-payments'), (SELECT id FROM categories WHERE slug = 'finance')),
((SELECT id FROM apis WHERE slug = 'weather-api'), (SELECT id FROM categories WHERE slug = 'weather')),
((SELECT id FROM apis WHERE slug = 'weather-api'), (SELECT id FROM categories WHERE slug = 'data-analytics')),
((SELECT id FROM apis WHERE slug = 'google-maps'), (SELECT id FROM categories WHERE slug = 'maps-location')),
((SELECT id FROM apis WHERE slug = 'google-maps'), (SELECT id FROM categories WHERE slug = 'data-analytics')),
((SELECT id FROM apis WHERE slug = 'twitter-api'), (SELECT id FROM categories WHERE slug = 'social-media')),
((SELECT id FROM apis WHERE slug = 'twitter-api'), (SELECT id FROM categories WHERE slug = 'data-analytics')),
((SELECT id FROM apis WHERE slug = 'sendgrid-email'), (SELECT id FROM categories WHERE slug = 'communication'));

-- Insert pricing plans
INSERT INTO pricing_plans (api_id, name, description, price_monthly, price_yearly, requests_per_month, rate_limit_per_second, is_free, is_popular, features) VALUES
((SELECT id FROM apis WHERE slug = 'openai-gpt4'), 'Free', 'Limited access for testing and small projects.', 0.00, 0.00, 1000, 5, true, false, '["1,000 requests/month", "Basic support"]'::jsonb),
((SELECT id FROM apis WHERE slug = 'openai-gpt4'), 'Developer', 'Ideal for individual developers and small applications.', 20.00, 200.00, 50000, 20, false, true, '["50,000 requests/month", "Standard support", "Access to all models"]'::jsonb),
((SELECT id FROM apis WHERE slug = 'openai-gpt4'), 'Enterprise', 'For large-scale applications and businesses.', 250.00, 2500.00, 1000000, 100, false, false, '["1,000,000 requests/month", "Priority support", "Dedicated account manager", "Custom fine-tuning"]'::jsonb),

((SELECT id FROM apis WHERE slug = 'stripe-payments'), 'Free', 'Test mode access for development.', 0.00, 0.00, 500, 2, true, false, '["500 test transactions/month", "Sandbox environment"]'::jsonb),
((SELECT id FROM apis WHERE slug = 'stripe-payments'), 'Standard', 'Production-ready payment processing.', 29.00, 290.00, 50000, 25, false, true, '["50,000 live transactions/month", "Standard support", "Fraud detection"]'::jsonb),
((SELECT id FROM apis WHERE slug = 'stripe-payments'), 'Business', 'High-volume payment processing with advanced features.', 99.00, 990.00, 500000, 100, false, false, '["500,000 live transactions/month", "Priority support", "Advanced reporting", "Dedicated integrations"]'::jsonb),

((SELECT id FROM apis WHERE slug = 'weather-api'), 'Free', 'Basic weather data for personal use.', 0.00, 0.00, 10000, 10, true, false, '["10,000 requests/month", "Current weather", "5-day forecast"]'::jsonb),
((SELECT id FROM apis WHERE slug = 'weather-api'), 'Pro', 'Comprehensive weather data for commercial applications.', 15.00, 150.00, 500000, 50, false, true, '["500,000 requests/month", "Hourly forecasts", "Historical data", "Premium support"]'::jsonb),

((SELECT id FROM apis WHERE slug = 'google-maps'), 'Free', 'Limited usage for small projects.', 0.00, 0.00, 20000, 10, true, false, '["20,000 map loads/month", "Basic geocoding"]'::jsonb),
((SELECT id FROM apis WHERE slug = 'google-maps'), 'Standard', 'For applications requiring higher usage and advanced features.', 50.00, 500.00, 500000, 50, false, true, '["500,000 map loads/month", "Advanced routing", "Place search"]'::jsonb),

((SELECT id FROM apis WHERE slug = 'twitter-api'), 'Free', 'Access to public tweets and basic user data.', 0.00, 0.00, 5000, 5, true, false, '["5,000 requests/month", "Public tweet access"]'::jsonb),
((SELECT id FROM apis WHERE slug = 'twitter-api'), 'Premium', 'Full access to Twitter data and analytics.', 75.00, 750.00, 100000, 50, false, true, '["100,000 requests/month", "Full tweet history", "User analytics"]'::jsonb),

((SELECT id FROM apis WHERE slug = 'sendgrid-email'), 'Free', 'Send a limited number of emails for free.', 0.00, 0.00, 100, 1, true, false, '["100 emails/day", "Basic analytics"]'::jsonb),
((SELECT id FROM apis WHERE slug = 'sendgrid-email'), 'Growth', 'For growing businesses needing reliable email delivery.', 19.00, 190.00, 50000, 20, false, true, '["50,000 emails/month", "Advanced analytics", "Dedicated IP (add-on)"]'::jsonb);

-- Note: In a production environment, you would not seed with actual user data
-- This is just the schema setup. Real data would come from user registrations
-- and API provider submissions through the application interface.

-- The application will handle:
-- 1. User registration and authentication
-- 2. Provider onboarding and verification
-- 3. API submission and approval process
-- 4. Subscription management
-- 5. Usage analytics collection
-- 6. Review and rating system

-- All data will be generated through the production application workflows
