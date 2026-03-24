package com.sunflower.backend.modules.user;

import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class MediaWebConfig implements WebMvcConfigurer {

    private final String storageLocation;

    public MediaWebConfig(@Value("${app.media.avatar.storage-path:./data/uploads/avatars}") String storagePath) {
        String normalized = Paths.get(storagePath).toAbsolutePath().normalize().toUri().toString();
        this.storageLocation = normalized.endsWith("/") ? normalized : normalized + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/media/avatars/**").addResourceLocations(storageLocation);
    }
}
