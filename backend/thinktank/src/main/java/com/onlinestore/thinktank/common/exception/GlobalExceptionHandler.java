package com.onlinestore.thinktank.common.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Validation failed", "Dữ liệu đầu vào không hợp lệ", request, details);
    }

    @ExceptionHandler({
            InvalidRequestException.class,
            IllegalArgumentException.class,
            AuthenticationException.class,
            AccessDeniedException.class,
            EntityNotFoundException.class,
            ResourceNotFoundException.class,
            DuplicateResourceException.class,
            InsufficientStockException.class
    })
    public ResponseEntity<ApiErrorResponse> handleDomainException(Exception ex, HttpServletRequest request) {
        HttpStatus status = resolveStatus(ex);
        String message = normalizeMessage(ex.getMessage());
        log.warn("Handled domain exception: {}", ex.getMessage());
        return build(status, status.getReasonPhrase(), message, request, List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleFallback(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Đã xảy ra lỗi hệ thống", request, List.of());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String error, String message, HttpServletRequest request, List<String> details) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(
                Instant.now(),
                status.value(),
                error,
                message,
                request.getRequestURI(),
                details
        ));
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + (error.getDefaultMessage() != null ? error.getDefaultMessage() : "invalid");
    }

    private String normalizeMessage(String message) {
        return (message == null || message.isBlank()) ? "Đã xảy ra lỗi hệ thống" : message;
    }

    private HttpStatus resolveStatus(Exception ex) {
        if (ex instanceof AuthenticationException) return HttpStatus.UNAUTHORIZED;
        if (ex instanceof AccessDeniedException) return HttpStatus.FORBIDDEN;
        if (ex instanceof EntityNotFoundException || ex instanceof ResourceNotFoundException) return HttpStatus.NOT_FOUND;
        if (ex instanceof DuplicateResourceException) return HttpStatus.CONFLICT;
        if (ex instanceof InsufficientStockException || ex instanceof InvalidRequestException) return HttpStatus.BAD_REQUEST;

        String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
        if (message.contains("not found") || message.contains("không tìm thấy")) return HttpStatus.NOT_FOUND;
        if (message.contains("already taken") || message.contains("đã được sử dụng") || message.contains("duplicate")) return HttpStatus.CONFLICT;
        if (message.contains("insufficient stock") || message.contains("không hợp lệ") || message.contains("required") || message.contains("đã bị vô hiệu hóa") || message.contains("invalid password")) {
            return HttpStatus.BAD_REQUEST;
        }
        return HttpStatus.BAD_REQUEST;
    }
}
