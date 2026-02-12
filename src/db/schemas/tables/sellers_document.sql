CREATE TYPE business_document_type_enum AS ENUM (
    'ppb_license',
    'business_permit',
);


CREATE TYPE business_document_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);


CREATE TABLE ph_business_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    business_id UUID NOT NULL
        REFERENCES ph_sellers(business_id)
        ON DELETE CASCADE,

    document_type business_document_type_enum NOT NULL,

    -- File storage
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,

    -- Review & moderation
    status business_document_status_enum NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,

    reviewed_by UUID NULL REFERENCES users(id),
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    CONSTRAINT uq_business_document_type
        UNIQUE (business_id, document_type)
);
