-- Enum for order status
CREATE TYPE order_status_enum AS ENUM ('pending', 'processing', 'confirmed','shipped', 'delivered', 'cancelled', 'completed');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE method_of_payment_enum AS ENUM ('mpesa', 'bank_transfer', 'cash_on_delivery', 'cash');

-- Orders table
CREATE TABLE IF NOT EXISTS ph_orders (
  order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_fullname VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  method_of_payment method_of_payment_enum NOT NULL DEFAULT 'mpesa',
  order_number VARCHAR(50) NOT NULL UNIQUE,
  status order_status_enum NOT NULL DEFAULT 'pending',
  payment_status payment_status_enum NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_address TEXT NOT NULL,
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS ph_order_items (
  order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES ph_orders(order_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES ph_products(product_id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

 