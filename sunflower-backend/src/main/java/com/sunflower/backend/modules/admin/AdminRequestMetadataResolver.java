package com.sunflower.backend.modules.admin;

import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class AdminRequestMetadataResolver {

    public AdminRequestMetadata resolveCurrentRequest() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (!(requestAttributes instanceof ServletRequestAttributes)) {
            return new AdminRequestMetadata("", "");
        }

        HttpServletRequest request = ((ServletRequestAttributes) requestAttributes).getRequest();
        String forwardedFor = Optional.ofNullable(request.getHeader("X-Forwarded-For")).orElse("");
        String requestIp = forwardedFor.split(",")[0].trim();
        if (requestIp.isEmpty()) {
            requestIp = Optional.ofNullable(request.getRemoteAddr()).orElse("");
        }
        String userAgent = Optional.ofNullable(request.getHeader(HttpHeaders.USER_AGENT)).orElse("").trim();
        return new AdminRequestMetadata(requestIp, userAgent);
    }
}
