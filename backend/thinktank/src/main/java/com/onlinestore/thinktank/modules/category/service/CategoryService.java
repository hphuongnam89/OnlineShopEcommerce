package com.onlinestore.thinktank.modules.category.service;

import com.onlinestore.thinktank.common.exception.ResourceNotFoundException;
import com.onlinestore.thinktank.modules.category.entity.Category;
import com.onlinestore.thinktank.modules.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
// Xử lý nghiệp vụ đọc danh mục sản phẩm cho giao diện cửa hàng.
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với id: " + id));
    }
}
