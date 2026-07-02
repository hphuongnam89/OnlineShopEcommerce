package com.onlinestore.thinktank.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> implements Serializable {
    private boolean success;
    private String message;
    private String messageVi;
    private T data;
    private Object pagination;
    private long timestamp;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Success")
                .messageVi("Thành công")
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static <T> ApiResponse<T> ok(T data, Object pagination) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Success")
                .messageVi("Thành công")
                .data(data)
                .pagination(pagination)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String messageVi) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .messageVi(messageVi)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
