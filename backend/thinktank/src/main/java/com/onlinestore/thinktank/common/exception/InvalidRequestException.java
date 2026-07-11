package com.onlinestore.thinktank.common.exception;

// Báo lỗi khi dữ liệu hoặc thao tác người dùng gửi lên không hợp lệ.
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}
