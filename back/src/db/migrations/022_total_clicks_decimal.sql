-- Lets total_clicks carry a fractional remainder (e.g. a future x1.5
-- click-value upgrade) instead of only ever holding whole numbers.
-- DOUBLE PRECISION (not NUMERIC, which the pg driver returns as a string)
-- and not REAL either — REAL only keeps ~7 significant digits, too little
-- for a total that can run into the many millions, where BIGINT used to
-- be exact. DOUBLE PRECISION stays exact for integers up to 2^53, comfortably
-- past any realistic total_clicks value.
ALTER TABLE users ALTER COLUMN total_clicks TYPE DOUBLE PRECISION;
