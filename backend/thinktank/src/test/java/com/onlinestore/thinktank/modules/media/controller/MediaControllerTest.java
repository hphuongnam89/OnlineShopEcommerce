package com.onlinestore.thinktank.modules.media.controller;

import com.onlinestore.thinktank.common.exception.InvalidRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Kiểm tra API tải ảnh, validate định dạng và xử lý thay thế ảnh cũ.
class MediaControllerTest {

    @Test
    void uploadImage_shouldStoreFileAndReturnUrl() throws Exception {
        Path tempDir = Files.createTempDirectory("thinktank-upload-test");
        MediaController controller = new MediaController();
        ReflectionTestUtils.setField(controller, "uploadDir", tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "hero.png",
                "image/png",
                validPng()
        );

        var response = controller.uploadImage(file, null);

        assertEquals(201, response.getStatusCode().value());
        assertTrue(response.getBody().get("url").startsWith("/uploads/"));
        assertTrue(Files.list(tempDir).findAny().isPresent());
    }

    @Test
    void uploadImage_shouldReplaceOldFileWhenOldUrlProvided() throws Exception {
        Path tempDir = Files.createTempDirectory("thinktank-upload-replace-test");
        Path oldFile = tempDir.resolve("old.png");
        Files.write(oldFile, new byte[] {9, 9, 9});

        MediaController controller = new MediaController();
        ReflectionTestUtils.setField(controller, "uploadDir", tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "new.png",
                "image/png",
                validPng()
        );

        controller.uploadImage(file, "/uploads/old.png");

        assertTrue(Files.exists(tempDir));
        assertTrue(Files.list(tempDir).anyMatch(path -> path.getFileName().toString().endsWith(".png")));
        assertTrue(Files.list(tempDir).noneMatch(path -> path.getFileName().toString().equals("old.png")));
    }

    @Test
    void uploadImage_shouldRejectUnsupportedFileType() throws Exception {
        Path tempDir = Files.createTempDirectory("thinktank-upload-invalid-type-test");
        MediaController controller = new MediaController();
        ReflectionTestUtils.setField(controller, "uploadDir", tempDir.toString());

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                new byte[] {1, 2, 3}
        );

        assertThrows(InvalidRequestException.class, () -> controller.uploadImage(file, null));
    }

    @Test
    void uploadImage_shouldRejectFakeImageWithTrustedExtension() throws Exception {
        MediaController controller = new MediaController();
        ReflectionTestUtils.setField(controller, "uploadDir", Files.createTempDirectory("thinktank-upload-fake").toString());
        MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", new byte[] {1, 2, 3});

        assertThrows(InvalidRequestException.class, () -> controller.uploadImage(file, null));
    }

    private byte[] validPng() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
