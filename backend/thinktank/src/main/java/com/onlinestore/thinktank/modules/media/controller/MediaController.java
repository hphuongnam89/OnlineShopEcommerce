package com.onlinestore.thinktank.modules.media.controller;

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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/uploads")
public class MediaController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "oldUrl", required = false) String oldUrl
    ) throws IOException {
        // Upload the new file first so we never lose the replacement image if cleanup fails.
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File không được để trống");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = "";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalName.substring(dotIndex);
        }

        String filename = UUID.randomUUID() + extension;
        Path uploadPath = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        Path target = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // Best-effort cleanup of the previous file when the caller passes an old upload URL.
        deleteOldFileIfNeeded(oldUrl, uploadPath);

        Map<String, String> response = new HashMap<>();
        response.put("filename", filename);
        response.put("url", "/uploads/" + filename);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private void deleteOldFileIfNeeded(String oldUrl, Path uploadPath) {
        // Only delete files that live inside the managed /uploads folder.
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
