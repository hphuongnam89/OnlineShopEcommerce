package com.onlinestore.thinktank.common.exception;

import java.time.Instant;
import java.util.List;

// Cấu trúc phản hồi lỗi thống nhất mà API trả về cho frontend.
public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> details
) {
}
