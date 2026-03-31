/**
 * Pharmacy Seed Script
 * Seeds categories, sub-categories, and products for a given business_id.
 * Run: node src/scripts/seed-pharmacy-data.js
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
const BUSINESS_ID = "c1be17ee-5b4e-4498-b831-01caa789763c";

// ─── DATA ────────────────────────────────────────────────────────────────────

const categories = [
  { name: "Prescription Medicines",  description: "Medicines that require a doctor's prescription" },
  { name: "Over-The-Counter (OTC)",  description: "Medicines available without a prescription" },
  { name: "Vitamins & Supplements",  description: "Nutritional supplements and vitamins" },
  { name: "Personal Care",           description: "Hygiene and personal care products" },
  { name: "Medical Devices",         description: "Health monitoring and medical equipment" },
];

// sub_categories keyed by category name
const subCategories = {
  "Prescription Medicines": [
    { name: "Antibiotics",       description: "Bacterial infection treatments" },
    { name: "Antihypertensives", description: "Blood pressure medications" },
    { name: "Antidiabetics",     description: "Diabetes management medications" },
  ],
  "Over-The-Counter (OTC)": [
    { name: "Pain Relief",       description: "Analgesics and anti-inflammatories" },
    { name: "Cold & Flu",        description: "Cough, cold and flu remedies" },
    { name: "Antacids",          description: "Digestive and heartburn relief" },
  ],
  "Vitamins & Supplements": [
    { name: "Multivitamins",     description: "Daily multivitamin supplements" },
    { name: "Minerals",          description: "Calcium, Iron, Zinc and more" },
    { name: "Herbal Supplements",description: "Plant-based health supplements" },
  ],
  "Personal Care": [
    { name: "Skin Care",         description: "Moisturisers, sunscreen and skin treatments" },
    { name: "Oral Care",         description: "Toothpaste, mouthwash and dental products" },
    { name: "Hair Care",         description: "Shampoos, conditioners and hair treatments" },
  ],
  "Medical Devices": [
    { name: "Blood Pressure Monitors", description: "Digital BP monitoring devices" },
    { name: "Glucometers",             description: "Blood glucose monitoring kits" },
    { name: "Thermometers",            description: "Digital and infrared thermometers" },
  ],
};

// products: { category, subCategory, name, description, buying_price, selling_price, stock, requires_prescription, dosage_form, strength, manufacturer, images[] }
const products = [
  // ── Antibiotics ──────────────────────────────────────────────────────────
  {
    category: "Prescription Medicines", subCategory: "Antibiotics",
    name: "Amoxicillin 500mg Capsules",
    description: "Broad-spectrum penicillin antibiotic used to treat bacterial infections including ear, nose, throat, and urinary tract infections.",
    buying_price: 180, selling_price: 495, stock: 120,
    requires_prescription: true, dosage_form: "Capsule", strength: "500mg", manufacturer: "GSK",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
  },
  {
    category: "Prescription Medicines", subCategory: "Antibiotics",
    name: "Azithromycin 250mg Tablets",
    description: "Macrolide antibiotic effective against respiratory tract infections, skin infections, and sexually transmitted diseases.",
    buying_price: 320, selling_price: 444, stock: 80,
    requires_prescription: true, dosage_form: "Tablet", strength: "250mg", manufacturer: "Pfizer",
    images: ["https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80"],
  },
  // ── Antihypertensives ────────────────────────────────────────────────────
  {
    category: "Prescription Medicines", subCategory: "Antihypertensives",
    name: "Amlodipine 5mg Tablets",
    description: "Calcium channel blocker used to treat high blood pressure and chest pain (angina).",
    buying_price: 150, selling_price: 303, stock: 200,
    requires_prescription: true, dosage_form: "Tablet", strength: "5mg", manufacturer: "Novartis",
    images: ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80"],
  },
  {
    category: "Prescription Medicines", subCategory: "Antihypertensives",
    name: "Losartan 50mg Tablets",
    description: "Angiotensin receptor blocker (ARB) for hypertension and kidney protection in diabetic patients.",
    buying_price: 200, selling_price: 550, stock: 150,
    requires_prescription: true, dosage_form: "Tablet", strength: "50mg", manufacturer: "Merck",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
  },
  // ── Antidiabetics ────────────────────────────────────────────────────────
  {
    category: "Prescription Medicines", subCategory: "Antidiabetics",
    name: "Metformin 500mg Tablets",
    description: "First-line oral medication for type 2 diabetes that helps control blood sugar levels.",
    buying_price: 120, selling_price: 700, stock: 300,
    requires_prescription: true, dosage_form: "Tablet", strength: "500mg", manufacturer: "Bristol-Myers Squibb",
    images: ["https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80"],
  },
  {
    category: "Prescription Medicines", subCategory: "Antidiabetics",
    name: "Glibenclamide 5mg Tablets",
    description: "Sulfonylurea used to stimulate insulin secretion in type 2 diabetes management.",
    buying_price: 100, selling_price: 200, stock: 180,
    requires_prescription: true, dosage_form: "Tablet", strength: "5mg", manufacturer: "Sanofi",
    images: ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80"],
  },
  // ── Pain Relief ──────────────────────────────────────────────────────────
  {
    category: "Over-The-Counter (OTC)", subCategory: "Pain Relief",
    name: "Paracetamol 500mg Tablets",
    description: "Common analgesic and antipyretic for relief of mild to moderate pain and fever reduction.",
    buying_price: 30, selling_price: 32, stock: 500,
    requires_prescription: false, dosage_form: "Tablet", strength: "500mg", manufacturer: "GSK",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
  },
  {
    category: "Over-The-Counter (OTC)", subCategory: "Pain Relief",
    name: "Ibuprofen 400mg Tablets",
    description: "Non-steroidal anti-inflammatory drug (NSAID) for pain, fever, and inflammation.",
    buying_price: 50, selling_price: 100, stock: 400,
    requires_prescription: false, dosage_form: "Tablet", strength: "400mg", manufacturer: "Pfizer",
    images: ["https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80"],
  },
  {
    category: "Over-The-Counter (OTC)", subCategory: "Pain Relief",
    name: "Diclofenac Gel 1% 50g",
    description: "Topical NSAID gel for localised pain relief in muscles and joints.",
    buying_price: 180, selling_price: 599, stock: 90,
    requires_prescription: false, dosage_form: "Gel", strength: "1%", manufacturer: "Novartis",
    images: ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80"],
  },
  // ── Cold & Flu ───────────────────────────────────────────────────────────
  {
    category: "Over-The-Counter (OTC)", subCategory: "Cold & Flu",
    name: "Actifed Cold & Flu Tablets",
    description: "Combination decongestant and antihistamine for relief of cold and flu symptoms.",
    buying_price: 80, selling_price: 500, stock: 200,
    requires_prescription: false, dosage_form: "Tablet", strength: "Combination", manufacturer: "Johnson & Johnson",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
  },
  {
    category: "Over-The-Counter (OTC)", subCategory: "Cold & Flu",
    name: "Benylin Cough Syrup 200ml",
    description: "Expectorant cough syrup that helps loosen and clear mucus from the airways.",
    buying_price: 200, selling_price: 550, stock: 150,
    requires_prescription: false, dosage_form: "Syrup", strength: "100mg/5ml", manufacturer: "Johnson & Johnson",
    images: ["https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80"],
  },
  // ── Antacids ─────────────────────────────────────────────────────────────
  {
    category: "Over-The-Counter (OTC)", subCategory: "Antacids",
    name: "Gaviscon Liquid 300ml",
    description: "Antacid and alginate for fast relief of heartburn, acid reflux, and indigestion.",
    buying_price: 350, selling_price: 900, stock: 100,
    requires_prescription: false, dosage_form: "Liquid", strength: "500mg/5ml", manufacturer: "Reckitt",
    images: ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80"],
  },
  {
    category: "Over-The-Counter (OTC)", subCategory: "Antacids",
    name: "Omeprazole 20mg Capsules",
    description: "Proton pump inhibitor for treatment of acid reflux, gastric ulcers, and GERD.",
    buying_price: 140, selling_price: 300, stock: 220,
    requires_prescription: false, dosage_form: "Capsule", strength: "20mg", manufacturer: "AstraZeneca",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
  },
  // ── Multivitamins ────────────────────────────────────────────────────────
  {
    category: "Vitamins & Supplements", subCategory: "Multivitamins",
    name: "Centrum Adults Multivitamin 60 Tablets",
    description: "Complete daily multivitamin with 24 essential vitamins and minerals for adults.",
    buying_price: 700, selling_price: 499, stock: 80,
    requires_prescription: false, dosage_form: "Tablet", strength: "Multivitamin blend", manufacturer: "Pfizer",
    images: ["https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80"],
  },
  {
    category: "Vitamins & Supplements", subCategory: "Multivitamins",
    name: "Supradyn Energy Effervescent Tablets",
    description: "Effervescent multivitamin with B-vitamins and minerals to combat fatigue and boost energy.",
    buying_price: 550, selling_price: 120, stock: 60,
    requires_prescription: false, dosage_form: "Effervescent Tablet", strength: "Multivitamin blend", manufacturer: "Bayer",
    images: ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80"],
  },
  // ── Minerals ─────────────────────────────────────────────────────────────
  {
    category: "Vitamins & Supplements", subCategory: "Minerals",
    name: "Calcium + Vitamin D3 Tablets",
    description: "Calcium carbonate with vitamin D3 for strong bones and teeth.",
    buying_price: 300, selling_price: 450, stock: 120,
    requires_prescription: false, dosage_form: "Tablet", strength: "500mg + 400IU", manufacturer: "Sandoz",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
  },
  {
    category: "Vitamins & Supplements", subCategory: "Minerals",
    name: "Ferrous Sulphate 200mg Tablets",
    description: "Iron supplement for prevention and treatment of iron-deficiency anaemia.",
    buying_price: 90, selling_price: 450, stock: 250,
    requires_prescription: false, dosage_form: "Tablet", strength: "200mg", manufacturer: "Teva",
    images: ["https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80"],
  },
  // ── Herbal Supplements ───────────────────────────────────────────────────
  {
    category: "Vitamins & Supplements", subCategory: "Herbal Supplements",
    name: "Echinacea Immune Support 60 Capsules",
    description: "Herbal supplement to support immune function and reduce duration of colds.",
    buying_price: 400, selling_price: 300, stock: 70,
    requires_prescription: false, dosage_form: "Capsule", strength: "400mg", manufacturer: "Nature's Way",
    images: ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80"],
  },
  // ── Skin Care ────────────────────────────────────────────────────────────
  {
    category: "Personal Care", subCategory: "Skin Care",
    name: "Nivea Soft Moisturising Cream 200ml",
    description: "Lightweight moisturising cream with jojoba oil and vitamin E for face, hands, and body.",
    buying_price: 250, selling_price: 250, stock: 150,
    requires_prescription: false, dosage_form: "Cream", strength: null, manufacturer: "Beiersdorf",
    images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80"],
  },
  {
    category: "Personal Care", subCategory: "Skin Care",
    name: "Neutrogena SPF 50 Sunscreen 88ml",
    description: "Broad-spectrum UVA/UVB sunscreen lotion for daily skin protection.",
    buying_price: 600, selling_price: 300, stock: 80,
    requires_prescription: false, dosage_form: "Lotion", strength: "SPF 50", manufacturer: "Neutrogena",
    images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80"],
  },
  // ── Oral Care ────────────────────────────────────────────────────────────
  {
    category: "Personal Care", subCategory: "Oral Care",
    name: "Colgate Total Toothpaste 150g",
    description: "Antibacterial toothpaste providing 12-hour protection against germs on teeth, tongue, cheeks, and gums.",
    buying_price: 120, selling_price: 450, stock: 300,
    requires_prescription: false, dosage_form: "Paste", strength: null, manufacturer: "Colgate-Palmolive",
    images: ["https://images.unsplash.com/photo-1559591937-abc3e3e4e1b5?w=600&q=80"],
  },
  {
    category: "Personal Care", subCategory: "Oral Care",
    name: "Listerine Cool Mint Mouthwash 500ml",
    description: "Antiseptic mouthwash that kills 99.9% of germs and freshens breath for up to 12 hours.",
    buying_price: 350, selling_price: 550, stock: 120,
    requires_prescription: false, dosage_form: "Liquid", strength: null, manufacturer: "Johnson & Johnson",
    images: ["https://images.unsplash.com/photo-1559591937-abc3e3e4e1b5?w=600&q=80"],
  },
  // ── Hair Care ────────────────────────────────────────────────────────────
  {
    category: "Personal Care", subCategory: "Hair Care",
    name: "Head & Shoulders Anti-Dandruff Shampoo 400ml",
    description: "Clinically proven anti-dandruff shampoo with zinc pyrithione for flake-free hair.",
    buying_price: 400, selling_price: 899, stock: 100,
    requires_prescription: false, dosage_form: "Shampoo", strength: "1% ZPT", manufacturer: "Procter & Gamble",
    images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80"],
  },
  // ── Blood Pressure Monitors ──────────────────────────────────────────────
  {
    category: "Medical Devices", subCategory: "Blood Pressure Monitors",
    name: "Omron HEM-7120 Automatic BP Monitor",
    description: "Clinically validated upper arm blood pressure monitor with irregular heartbeat detection.",
    buying_price: 2500, selling_price: 3000, stock: 30,
    requires_prescription: false, dosage_form: "Device", strength: null, manufacturer: "Omron",
    images: ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80"],
  },
  {
    category: "Medical Devices", subCategory: "Blood Pressure Monitors",
    name: "Beurer BM 27 Wrist BP Monitor",
    description: "Compact wrist blood pressure monitor with arrhythmia detection and 60-reading memory.",
    buying_price: 1800, selling_price: 3000, stock: 25,
    requires_prescription: false, dosage_form: "Device", strength: null, manufacturer: "Beurer",
    images: ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80"],
  },
  // ── Glucometers ──────────────────────────────────────────────────────────
  {
    category: "Medical Devices", subCategory: "Glucometers",
    name: "Accu-Chek Active Glucometer Kit",
    description: "Blood glucose monitoring system with 10 test strips, lancing device, and 10 lancets.",
    buying_price: 1500, selling_price: 2200, stock: 40,
    requires_prescription: false, dosage_form: "Device", strength: null, manufacturer: "Roche",
    images: ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80"],
  },
  {
    category: "Medical Devices", subCategory: "Glucometers",
    name: "OneTouch Select Plus Glucometer",
    description: "Simple blood glucose meter with colour-range indicator and no-coding technology.",
    buying_price: 1200, selling_price: 1800, stock: 35,
    requires_prescription: false, dosage_form: "Device", strength: null, manufacturer: "LifeScan",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"],
  },
  // ── Thermometers ─────────────────────────────────────────────────────────
  {
    category: "Medical Devices", subCategory: "Thermometers",
    name: "Braun ThermoScan 7 Ear Thermometer",
    description: "Professional-grade ear thermometer with ExacTemp technology for accurate readings in 2 seconds.",
    buying_price: 2800, selling_price: 4200, stock: 20,
    requires_prescription: false, dosage_form: "Device", strength: null, manufacturer: "Braun",
    images: ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80"],
  },
  {
    category: "Medical Devices", subCategory: "Thermometers",
    name: "Non-Contact Infrared Forehead Thermometer",
    description: "Instant-read infrared thermometer for forehead temperature measurement, suitable for all ages.",
    buying_price: 1000, selling_price: 1600, stock: 50,
    requires_prescription: false, dosage_form: "Device", strength: null, manufacturer: "Microlife",
    images: ["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80"],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Make a slug unique by appending a short random suffix
function uniqueSlug(base) {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${slugify(base)}-${suffix}`;
}

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ── Step 1: Insert categories (skip if name already exists) ──────────────
    console.log("\n📂  Seeding categories...");
    const categoryMap = {}; // name → category_id

    for (const cat of categories) {
      const res = await client.query(
        `INSERT INTO ph_categories (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING category_id, name`,
        [cat.name, cat.description]
      );
      categoryMap[res.rows[0].name] = res.rows[0].category_id;
      console.log(`  ✔ Category: ${res.rows[0].name} (${res.rows[0].category_id})`);
    }

    // ── Step 2: Insert sub-categories ────────────────────────────────────────
    console.log("\n📁  Seeding sub-categories...");
    const subCategoryMap = {}; // "catName|subName" → sub_category_id

    for (const [catName, subs] of Object.entries(subCategories)) {
      const categoryId = categoryMap[catName];
      if (!categoryId) {
        console.warn(`  ⚠  Category not found: ${catName}`);
        continue;
      }
      for (const sub of subs) {
        const res = await client.query(
          `INSERT INTO ph_subcategories (category_id, name, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (category_id, name) DO UPDATE SET description = EXCLUDED.description
           RETURNING sub_category_id, name`,
          [categoryId, sub.name, sub.description]
        );
        subCategoryMap[`${catName}|${sub.name}`] = res.rows[0].sub_category_id;
        console.log(`  ✔ Sub-category: ${catName} → ${res.rows[0].name}`);
      }
    }

    // ── Step 3: Insert products ───────────────────────────────────────────────
    console.log("\n💊  Seeding products...");

    for (const p of products) {
      const categoryId    = categoryMap[p.category];
      const subCategoryId = subCategoryMap[`${p.category}|${p.subCategory}`];

      if (!categoryId || !subCategoryId) {
        console.warn(`  ⚠  Skipping "${p.name}" — category/sub-category not resolved`);
        continue;
      }

      const slug   = uniqueSlug(p.name);
      const images = JSON.stringify(p.images);

      await client.query(
        `INSERT INTO ph_products
           (business_id, name, slug, description, stock, buying_price, selling_price,
            status, category_id, sub_category_id, images,
            requires_prescription, dosage_form, strength, manufacturer)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::product_status_enum,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (slug) DO NOTHING`,
        [
          BUSINESS_ID,
          p.name,
          slug,
          p.description,
          p.stock,
          p.buying_price,
          p.selling_price,
          "available",
          categoryId,
          subCategoryId,
          images,
          p.requires_prescription ?? false,
          p.dosage_form ?? null,
          p.strength ?? null,
          p.manufacturer ?? null,
        ]
      );
      console.log(`  ✔ Product: ${p.name}`);
    }

    await client.query("COMMIT");
    console.log("\n✅  Seed complete.\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌  Seed failed — rolled back.\n", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
