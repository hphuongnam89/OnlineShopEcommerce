package com.onlinestore.thinktank.modules.media.controller;

import com.onlinestore.thinktank.common.exception.InvalidRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
                new byte[] {1, 2, 3}
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
                new byte[] {1, 2, 3}
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
}
