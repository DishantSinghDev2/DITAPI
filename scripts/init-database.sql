-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist to ensure a clean slate for re-initialization
DROP TABLE IF EXISTS api_requests CASCADE;
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS user_api_keys CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS api_categories CASCADE;
DROP TABLE IF EXISTS apis CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'developer', -- 'developer', 'provider', 'admin'
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Providers Table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    website VARCHAR(255),
    support_email VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- APIs Table
CREATE TABLE apis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    base_url VARCHAR(255) NOT NULL,
    documentation_url VARCHAR(255),
    support_url VARCHAR(255),
    terms_url VARCHAR(255),
    privacy_url VARCHAR(255),
    rating NUMERIC(2,1) DEFAULT 0.0, -- Average rating out of 5.0
    total_subscribers INT DEFAULT 0,
    average_latency INT DEFAULT 0, -- in milliseconds
    uptime_percentage NUMERIC(5,2) DEFAULT 100.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'inactive', 'deprecated'
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Categories Junction Table
CREATE TABLE api_categories (
    api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (api_id, category_id)
);

-- Pricing Plans Table
CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    requests_per_month INT NOT NULL DEFAULT 0,
    rate_limit_per_second INT NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT FALSE,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    features JSONB, -- e.g., '["feature1", "feature2"]'
    stripe_price_id_monthly VARCHAR(255), -- Stripe Price ID for monthly billing
    stripe_price_id_yearly VARCHAR(255), -- Stripe Price ID for yearly billing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (api_id, name)
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
    pricing_plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'trialing'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255) UNIQUE, -- Stripe Subscription ID
    stripe_customer_id VARCHAR(255), -- Stripe Customer ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, api_id) -- A user can only have one active subscription per API
);

-- Applications Table (for developers to manage their projects)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    redirect_uris TEXT[], -- Array of redirect URIs for OAuth flows
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User API Keys Table (for applications to access APIs)
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE, -- Which API this key is for
    key_value VARCHAR(255) UNIQUE NOT NULL, -- The actual API key string
    name VARCHAR(255), -- A user-friendly name for the key
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- The user who generated this key
    UNIQUE (application_id, api_id) -- An application can only have one key per API
);

-- API Usage Metrics Table (for real-time and aggregated usage)
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requests INT NOT NULL DEFAULT 0,
    data_transferred NUMERIC(15,2) NOT NULL DEFAULT 0.00, -- in bytes
    errors INT NOT NULL DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Granularity can be hourly/daily
    UNIQUE (api_id, user_id, DATE_TRUNC('hour', timestamp)) -- Aggregate hourly usage
);

-- API Request Logs Table (for detailed request/response logging)
CREATE TABLE api_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    status_code INT NOT NULL,
    latency INT, -- in milliseconds
    request_size INT, -- in bytes
    response_size INT, -- in bytes
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id UUID NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (api_id, user_id) -- A user can only review an API once
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_apis_slug ON apis(slug);
CREATE INDEX idx_apis_provider_id ON apis(provider_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_pricing_plans_api_id ON pricing_plans(api_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_api_id ON subscriptions(api_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_user_api_keys_application_id ON user_api_keys(application_id);
CREATE INDEX idx_user_api_keys_key_value ON user_api_keys(key_value);
CREATE INDEX idx_api_usage_api_id_user_id_timestamp ON api_usage(api_id, user_id, timestamp DESC);
CREATE INDEX idx_api_requests_api_id_timestamp ON api_requests(api_id, timestamp DESC);
CREATE INDEX idx_reviews_api_id ON reviews(api_id);
