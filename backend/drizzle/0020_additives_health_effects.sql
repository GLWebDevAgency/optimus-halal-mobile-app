-- Migration 0020: Add health effect columns to additives table
-- Inspired by Yuka's HealthEffect model (4 effect types × confirmed/potential)

-- Health effect type: endocrine_disruptor, allergen, irritant, carcinogenic
ALTER TABLE additives ADD COLUMN IF NOT EXISTS health_effect_type VARCHAR(30);

-- Whether the effect is confirmed (true) or potential/suspected (false)
ALTER TABLE additives ADD COLUMN IF NOT EXISTS health_effect_confirmed BOOLEAN DEFAULT true;

-- Seed known health effects for high-concern additives
-- Source: EFSA opinions, IARC classifications, ANSES reports

-- Carcinogenic (probable — IARC Group 2A, not confirmed Group 1)
UPDATE additives SET health_effect_type = 'carcinogenic', health_effect_confirmed = false
WHERE code IN ('E249', 'E250', 'E251', 'E252') AND health_effect_type IS NULL;
-- Nitrites/Nitrates — IARC Group 2A (probable carcinogen when ingested as nitrite in processed meat)

-- Carcinogenic (potential)
UPDATE additives SET health_effect_type = 'carcinogenic', health_effect_confirmed = false
WHERE code IN ('E171') AND health_effect_type IS NULL;
-- Titanium dioxide — EFSA: no longer safe as food additive (2021), banned EU 2022

-- Endocrine disruptors (suspected — EFSA re-evaluation pending)
UPDATE additives SET health_effect_type = 'endocrine_disruptor', health_effect_confirmed = false
WHERE code IN ('E320', 'E321') AND health_effect_type IS NULL;
-- BHA (E320), BHT (E321) — suspected endocrine disruptors (NTP, EFSA re-evaluation pending)

-- Endocrine disruptors (potential)
UPDATE additives SET health_effect_type = 'endocrine_disruptor', health_effect_confirmed = false
WHERE code IN ('E214', 'E215', 'E218', 'E219') AND health_effect_type IS NULL;
-- Parabens — endocrine disruption potential (EFSA 2004/2020)

-- Allergens (confirmed)
UPDATE additives SET health_effect_type = 'allergen', health_effect_confirmed = true
WHERE code IN ('E120', 'E904', 'E901') AND health_effect_type IS NULL;
-- E120 (Carmine/cochineal) — documented allergic reactions
-- E904 (Shellac) — insect origin, allergenic
-- E901 (Beeswax) — allergenic for bee-sensitive individuals

-- Irritants (confirmed)
UPDATE additives SET health_effect_type = 'irritant', health_effect_confirmed = true
WHERE code IN ('E220', 'E221', 'E222', 'E223', 'E224', 'E226', 'E227', 'E228') AND health_effect_type IS NULL;
-- Sulfites — documented respiratory irritant, especially for asthmatics

-- Allergens (potential — Southampton Six)
UPDATE additives SET health_effect_type = 'allergen', health_effect_confirmed = false
WHERE code IN ('E102', 'E104', 'E110', 'E122', 'E124', 'E129') AND health_effect_type IS NULL;
-- Southampton Six colorants — EFSA: may cause hyperactivity in children, potential allergenicity
