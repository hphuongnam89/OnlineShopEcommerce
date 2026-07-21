ALTER TABLE products
    MODIFY COLUMN additional_images JSON NULL,
    MODIFY COLUMN highlights JSON NULL;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL UNIQUE,
    expiry_date DATETIME(6) NOT NULL,
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
