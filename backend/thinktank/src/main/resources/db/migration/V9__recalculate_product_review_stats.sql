UPDATE products p
LEFT JOIN (
    SELECT product_id, COUNT(*) AS review_count, COALESCE(AVG(rating), 0) AS average_rating
    FROM reviews
    WHERE deleted = FALSE
    GROUP BY product_id
) r ON r.product_id = p.id
SET p.review_count = COALESCE(r.review_count, 0),
    p.average_rating = COALESCE(r.average_rating, 0);
