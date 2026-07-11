package com.onlinestore.thinktank.common.exception;

// Báo lỗi khi số lượng sản phẩm trong kho không đủ để xử lý đơn hàng.
public class InsufficientStockException extends InvalidRequestException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
