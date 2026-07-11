DELETE FROM refresh_tokens;
ALTER TABLE refresh_tokens MODIFY COLUMN token CHAR(64) NOT NULL;

ALTER TABLE orders
    ADD COLUMN tracking_token VARCHAR(36) NULL,
    ADD COLUMN idempotency_key VARCHAR(36) NULL;

UPDATE orders
SET tracking_token = UUID(), idempotency_key = UUID()
WHERE tracking_token IS NULL OR idempotency_key IS NULL;

ALTER TABLE orders
    MODIFY COLUMN tracking_token VARCHAR(36) NOT NULL,
    MODIFY COLUMN idempotency_key VARCHAR(36) NOT NULL,
    ADD CONSTRAINT uk_orders_tracking_token UNIQUE (tracking_token),
    ADD CONSTRAINT uk_orders_idempotency_key UNIQUE (idempotency_key);

DELETE r1 FROM reviews r1
JOIN reviews r2
  ON r1.user_id = r2.user_id
 AND r1.product_id = r2.product_id
 AND r1.id > r2.id;

ALTER TABLE reviews
    ADD CONSTRAINT uk_reviews_user_product UNIQUE (user_id, product_id);
