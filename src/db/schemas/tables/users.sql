
CREATE TYPE role_enum AS ENUM ('customer', 'admin', 'tenant'); 
CREATE TYPE status_enum AS ENUM ('active', 'pending', 'suspended');

CREATE TABLE IF NOT EXISTS ph_users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role role_enum NOT NULL,  /* For now we will handle the roles internally as enum values */
  status status_enum NOT NULL DEFAULT 'pending',
  deleted INT DEFAULT 0 NOT NULL,
  password TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);