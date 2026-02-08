CREATE TYPE business_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
);
CREATE TABLE ph_businesses (
    business_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    business_type TEXT NULL,
    latitude  DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    status business_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE OR REPLACE FUNCTION set_business_location()
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

CREATE TRIGGER trg_set_business_location
BEFORE INSERT OR UPDATE OF latitude, longitude
ON businesses
FOR EACH ROW
EXECUTE FUNCTION set_business_location();
