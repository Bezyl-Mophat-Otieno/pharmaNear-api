CREATE TYPE transaction_type_enum AS ENUM ('order_payment', 'order_refund', 'order_reversal');


-- Transactions table
CREATE TABLE IF NOT EXISTS ph_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number VARCHAR(50) NOT NULL UNIQUE,
  transaction_details_id UUID NOT NULL REFERENCES ph_transaction_details(transaction_details_id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES ph_orders(order_id) ON DELETE CASCADE,
  customer_fullname VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20),
  method_of_payment method_of_payment_enum NOT NULL DEFAULT 'mpesa',
  transaction_type transaction_type_enum NOT NULL DEFAULT 'order_payment',
  payment_status payment_status_enum NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reconcilled  BOOLEAN DEFAULT FALSE,
  reconciled_by UUID REFERENCES ph_users(user_id),
  reconciled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction details 

CREATE TABLE IF NOT EXISTS ph_transaction_details (
  transaction_details_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method_of_payment method_of_payment_enum NOT NULL DEFAULT 'cash',
  total_amount_received NUMERIC(10, 2) NOT NULL DEFAULT 0,
  recieved_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



 