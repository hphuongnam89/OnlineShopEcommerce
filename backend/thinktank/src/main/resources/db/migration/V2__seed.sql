-- ROLES
INSERT INTO roles (name, created_at, updated_at)
VALUES
('ROLE_ADMIN', NOW(), NOW()),
('ROLE_CUSTOMER', NOW(), NOW());

-- PERMISSIONS
INSERT INTO permissions (name, created_at, updated_at)
VALUES
('PRODUCT_CREATE', NOW(), NOW()),
('PRODUCT_UPDATE', NOW(), NOW()),
('PRODUCT_DELETE', NOW(), NOW()),
('ORDER_MANAGE', NOW(), NOW()),
('USER_MANAGE', NOW(), NOW());

-- ROLE_PERMISSION (ADMIN full quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ROLE_ADMIN';

-- CUSTOMER chỉ xem order
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ROLE_CUSTOMER'
AND p.name = 'ORDER_MANAGE';

-- CUSTOMER TIERS
INSERT INTO customer_tiers (name, min_spending, discount_percent, created_at, updated_at)
VALUES
('BRONZE', 0, 0, NOW(), NOW()),
('SILVER', 5000000, 3, NOW(), NOW()),
('GOLD', 15000000, 7, NOW(), NOW()),
('PLATINUM', 50000000, 12, NOW(), NOW());