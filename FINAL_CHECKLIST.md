# Final Submission Checklist

Current status: all items below were checked on 2026-06-09 and passed on the current codebase.

## 1. Backend sanity

- Run `./mvnw -q test`
- Confirm Spring Boot starts cleanly on port `8080`
- Confirm no 5xx responses on the admin endpoints below

## 2. Frontend sanity

- Run `npm run lint`
- Run `npm run build`
- Confirm Vite build completes successfully

## 3. Public flows

- Open `/`
- Open `/products`
- Open `/product/:id`
- Open `/cart`
- Open `/track-order`
- Open `/auth`
- Check that page routing works and no console errors appear

## 4. Admin access

- Open `/admin/login`
- Confirm the login page renders
- Confirm `/admin`, `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/reviews` redirect to login when unauthenticated
- Log in with the admin account and confirm the admin shell opens

## 5. Admin products

- `GET /api/admin/products?page=0&limit=5`
- `GET /api/admin/products?page=0&limit=5&search=Think`
- Create a product with one variant
- Update that product and the variant
- Delete the product
- Confirm the product is no longer visible on `GET /api/products/:id`
- Confirm the soft delete is applied in the database

## 6. Admin customers

- `GET /api/admin/customers`
- `GET /api/admin/customers?search=codex`

## 7. Admin orders

- `GET /api/admin/orders`
- `GET /api/admin/orders?status=PENDING`
- Confirm the public track-order endpoint still works after admin order checks

## 8. Admin reviews

- `GET /api/admin/reviews`

## 9. Admin reports

- `GET /api/admin/reports/revenue?period=monthly`
- `GET /api/admin/reports/customers`
- `GET /api/admin/reports/export/orders`
- `GET /api/admin/reports/export/customers`
- Confirm both export endpoints return `.xlsx` files

## 10. Final stop condition

- Do not add new features after this checklist passes
- If a new issue appears, fix only the root cause and rerun the same checklist
