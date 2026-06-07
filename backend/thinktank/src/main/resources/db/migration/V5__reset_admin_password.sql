UPDATE users
SET password_hash = '$2a$10$WWJDJj6CmaCnaR.Pz5Xi6eo8D0IGlQNbkxs3f1Lrg.3rMrsaQOxHi'
WHERE id = 1
  AND email = 'admin@thinktank.com';
