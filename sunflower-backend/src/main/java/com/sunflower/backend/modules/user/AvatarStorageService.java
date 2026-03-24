package com.sunflower.backend.modules.user;

import com.sunflower.backend.common.exception.BusinessException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AvatarStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE_BYTES = 2L * 1024L * 1024L;
    private static final String PUBLIC_PREFIX = "/api/media/avatars/";

    private final Path storageRoot;

    public AvatarStorageService(@Value("${app.media.avatar.storage-path:./data/uploads/avatars}") String storagePath) {
        this.storageRoot = Paths.get(storagePath).toAbsolutePath().normalize();
    }

    public String store(String userId, MultipartFile file, String existingRelativePath) {
        validate(file);

        try {
            Files.createDirectories(storageRoot.resolve(userId));
            String extension = resolveExtension(file);
            String relativePath = userId + "/" + UUID.randomUUID().toString().replace("-", "") + "." + extension;
            Path target = storageRoot.resolve(relativePath).normalize();
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            deleteIfExists(existingRelativePath);
            return relativePath.replace('\\', '/');
        } catch (IOException ex) {
            throw new IllegalStateException("保存头像失败", ex);
        }
    }

    public String toPublicUrl(String relativePath) {
        String normalized = normalizeRelativePath(relativePath);
        return normalized.isEmpty() ? "" : PUBLIC_PREFIX + normalized;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("头像文件不能为空");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw BusinessException.badRequest("头像文件不能超过 2MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw BusinessException.badRequest("仅支持 JPG、PNG、WebP 头像");
        }
    }

    private String resolveExtension(MultipartFile file) {
        String contentType = file.getContentType() == null ? "" : file.getContentType().trim().toLowerCase(Locale.ROOT);
        if ("image/png".equals(contentType)) {
            return "png";
        }
        if ("image/webp".equals(contentType)) {
            return "webp";
        }
        return "jpg";
    }

    private void deleteIfExists(String relativePath) throws IOException {
        String normalized = normalizeRelativePath(relativePath);
        if (normalized.isEmpty()) {
            return;
        }
        Files.deleteIfExists(storageRoot.resolve(normalized).normalize());
    }

    private String normalizeRelativePath(String relativePath) {
        if (relativePath == null) {
            return "";
        }
        return relativePath.trim().replace('\\', '/').replaceAll("^/+", "");
    }
}
