package com.onlinestore.thinktank.modules.media.controller;

import com.onlinestore.thinktank.common.exception.InvalidRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/uploads")
public class MediaController {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/png", "image/jpeg", "image/webp");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".png", ".jpg", ".jpeg", ".webp");

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "oldUrl", required = false) String oldUrl
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("File không được để trống");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new InvalidRequestException("File vượt quá kích thước tối đa 5MB");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = getExtension(originalName);
        String contentType = file.getContentType();

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase()) || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new InvalidRequestException("Loại file không được hỗ trợ");
        }

        try (InputStream inputStream = file.getInputStream()) {
            String filename = UUID.randomUUID() + extension;
            Path uploadPath = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            Path target = uploadPath.resolve(filename).normalize();
            if (!target.startsWith(uploadPath)) {
                throw new InvalidRequestException("Đường dẫn lưu file không hợp lệ");
            }
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);

            deleteOldFileIfNeeded(oldUrl, uploadPath);

            Map<String, String> response = new HashMap<>();
            response.put("filename", filename);
            response.put("url", "/uploads/" + filename);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
    }

    private String getExtension(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "";
        }
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalName.length() - 1) {
            return "";
        }
        return originalName.substring(dotIndex);
    }

    private void deleteOldFileIfNeeded(String oldUrl, Path uploadPath) {
        if (oldUrl == null || oldUrl.isBlank()) return;
        if (!oldUrl.startsWith("/uploads/")) return;

        String oldFilename = oldUrl.substring("/uploads/".length());
        if (oldFilename.isBlank() || oldFilename.contains("..") || oldFilename.contains("/") || oldFilename.contains("\\")) {
            return;
        }

        Path oldFile = uploadPath.resolve(oldFilename).normalize();
        if (oldFile.startsWith(uploadPath)) {
            try {
                Files.deleteIfExists(oldFile);
            } catch (IOException ignored) {
                // Cleanup is intentionally best-effort; the new upload remains valid either way.
            }
        }
    }
}
