package com.onlinestore.thinktank.common.exception;

public class InsufficientStockException extends InvalidRequestException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
