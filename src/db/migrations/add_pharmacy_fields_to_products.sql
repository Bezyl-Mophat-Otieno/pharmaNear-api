-- Migration: add pharmacy-specific fields to ph_products
ALTER TABLE ph_products
  ADD COLUMN IF NOT EXISTS requires_prescription BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dosage_form          VARCHAR(100),   -- e.g. Tablet, Capsule, Syrup, Injection
  ADD COLUMN IF NOT EXISTS strength             VARCHAR(100),   -- e.g. 500mg, 10mg/5ml
  ADD COLUMN IF NOT EXISTS manufacturer         VARCHAR(255);   -- e.g. Pfizer, GSK
