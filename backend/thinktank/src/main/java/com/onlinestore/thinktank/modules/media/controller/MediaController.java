package com.onlinestore.thinktank.modules.media.controller;

import com.onlinestore.thinktank.common.exception.InvalidRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/uploads")
public class MediaController {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final long MAX_PIXELS = 12_000_000L;
    private static final Set<String> ALLOWED_FORMATS = Set.of("png", "jpeg");

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

        try (ImageInputStream imageInput = ImageIO.createImageInputStream(file.getInputStream())) {
            if (imageInput == null) throw new InvalidRequestException("File ảnh không hợp lệ");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) throw new InvalidRequestException("File ảnh không hợp lệ");

            ImageReader reader = readers.next();
            String format;
            BufferedImage image;
            try {
                reader.setInput(imageInput, true, true);
                format = reader.getFormatName().toLowerCase();
                if (!ALLOWED_FORMATS.contains(format)) {
                    throw new InvalidRequestException("Chỉ hỗ trợ ảnh PNG hoặc JPEG");
                }
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_PIXELS) {
                    throw new InvalidRequestException("Kích thước ảnh không hợp lệ");
                }
                image = reader.read(0);
            } finally {
                reader.dispose();
            }

            String outputFormat = format.equals("jpeg") ? "jpg" : "png";
            String filename = UUID.randomUUID() + "." + outputFormat;
            Path uploadPath = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            Path target = uploadPath.resolve(filename).normalize();
            if (!target.startsWith(uploadPath)) {
                throw new InvalidRequestException("Đường dẫn lưu file không hợp lệ");
            }
            if (!ImageIO.write(image, outputFormat, target.toFile())) {
                throw new InvalidRequestException("Không thể xử lý file ảnh");
            }

            deleteOldFileIfNeeded(oldUrl, uploadPath);

            Map<String, String> response = new HashMap<>();
            response.put("filename", filename);
            response.put("url", "/uploads/" + filename);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
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
