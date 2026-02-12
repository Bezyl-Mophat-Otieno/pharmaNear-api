CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE seller_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
);
CREATE TABLE ph_sellers (
    business_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES ph_users(user_id),
    business_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    business_type TEXT NULL,
    latitude  DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    status seller_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE OR REPLACE FUNCTION set_seller_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location :=
        ST_SetSRID(
            ST_MakePoint(NEW.longitude, NEW.latitude),
            4326
        )::GEOGRAPHY;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_seller_location
BEFORE INSERT OR UPDATE OF latitude, longitude
ON ph_sellers
FOR EACH ROW
EXECUTE FUNCTION set_seller_location();
