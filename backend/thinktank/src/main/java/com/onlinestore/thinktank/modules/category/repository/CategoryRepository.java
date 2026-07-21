package com.onlinestore.thinktank.modules.category.repository;

import com.onlinestore.thinktank.modules.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
// Truy vấn danh mục sản phẩm trong cơ sở dữ liệu.
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
}
