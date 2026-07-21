package com.onlinestore.thinktank.common.exception;

// Báo lỗi khi dữ liệu cần duy nhất, như email hoặc mã sản phẩm, đã tồn tại.
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
