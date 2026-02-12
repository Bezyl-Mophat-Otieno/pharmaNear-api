CREATE TYPE ph_product_status_enum AS ENUM ('available', 'out_of_stock', 'unavailable', 'deleted');

CREATE TABLE IF NOT EXISTS ph_products (
  product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES ph_sellers(business_id),
  name VARCHAR(255) NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  total_sold INTEGER DEFAULT 0,
  buying_price NUMERIC(10,2) NOT NULL,  
  selling_price NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  status product_status_enum NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES ph_categories(category_id) ON DELETE SET NULL,
  sub_category_id UUID REFERENCES ph_subcategories(sub_category_id) ON DELETE SET NULL,
  images JSONB DEFAULT '[]',
  materials TEXT,
  available_sizes JSONB DEFAULT '[]',
  care_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

