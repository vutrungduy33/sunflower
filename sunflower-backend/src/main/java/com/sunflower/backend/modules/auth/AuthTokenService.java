package com.sunflower.backend.modules.auth;

import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuthTokenService {

    private static final String TOKEN_PREFIX = "mock_token_";
    private static final String BEARER_PREFIX = "Bearer ";

    public String buildToken(String userId) {
        return TOKEN_PREFIX + userId;
    }

    public Optional<String> extractTokenFromCurrentRequest() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (!(requestAttributes instanceof ServletRequestAttributes)) {
            return Optional.empty();
        }

        String authorization = ((ServletRequestAttributes) requestAttributes)
            .getRequest()
            .getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.trim().isEmpty()) {
            return Optional.empty();
        }

        String token = stripBearerPrefix(authorization.trim());
        if (token.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(token);
    }

    public Optional<String> parseUserId(String token) {
        if (!token.startsWith(TOKEN_PREFIX)) {
            return Optional.empty();
        }

        String userId = token.substring(TOKEN_PREFIX.length()).trim();
        if (userId.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(userId);
    }

    private String stripBearerPrefix(String authorization) {
        if (authorization.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            return authorization.substring(BEARER_PREFIX.length()).trim();
        }
        return authorization;
    }
}
