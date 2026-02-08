CREATE TABLE IF NOT EXISTS bq_wishlist (
  wishlist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES bq_users(user_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES bq_products(product_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id)
);
