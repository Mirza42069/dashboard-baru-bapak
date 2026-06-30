-- fn_recalc_boq_weights crashed (NOT NULL on boq_items.weight) when a derived
-- leaf had a null value (blank quantity or rate): value / total -> NULL.
-- Treat a null-valued leaf as weight 0 so activation no longer 500s.
CREATE OR REPLACE FUNCTION fn_recalc_boq_weights(p_version uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_total numeric;
BEGIN
    SELECT COALESCE(SUM(value),0) INTO v_total
    FROM boq_items i
    WHERE i.boq_version_id = p_version AND i.weight_source = 'derived'
      AND i.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM boq_items c WHERE c.parent_id = i.id);

    UPDATE boq_items i
    SET weight = CASE WHEN v_total > 0 THEN COALESCE(value,0) / v_total * 100 ELSE 0 END
    WHERE i.boq_version_id = p_version AND i.weight_source = 'derived'
      AND NOT EXISTS (SELECT 1 FROM boq_items c WHERE c.parent_id = i.id);

    UPDATE boq_versions SET total_value = v_total WHERE id = p_version;
END; $$;
