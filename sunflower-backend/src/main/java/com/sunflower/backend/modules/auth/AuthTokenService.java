package com.sunflower.backend.modules.auth;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuthTokenService {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final byte[] signingKey;
    private final long tokenTtlSeconds;

    public AuthTokenService(
        @Value("${app.auth.token.secret}") String tokenSecret,
        @Value("${app.auth.token.ttl-seconds:7200}") long tokenTtlSeconds
    ) {
        if (tokenSecret == null || tokenSecret.trim().isEmpty()) {
            throw new IllegalStateException("app.auth.token.secret 未配置");
        }
        if (tokenTtlSeconds <= 0) {
            throw new IllegalStateException("app.auth.token.ttl-seconds 必须大于 0");
        }
        this.signingKey = tokenSecret.getBytes(StandardCharsets.UTF_8);
        this.tokenTtlSeconds = tokenTtlSeconds;
    }

    public String buildToken(String userId) {
        return buildToken(userId, 1);
    }

    public String buildToken(String userId, int authVersion) {
        long expiresAtEpochSeconds = Instant.now().plusSeconds(tokenTtlSeconds).getEpochSecond();
        String payload = userId + ":" + authVersion + ":" + expiresAtEpochSeconds;
        String payloadSegment = encodeBase64Url(payload.getBytes(StandardCharsets.UTF_8));
        String signatureSegment = encodeBase64Url(sign(payloadSegment));
        return payloadSegment + "." + signatureSegment;
    }

    public Optional<String> extractTokenFromCurrentRequest() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (!(requestAttributes instanceof ServletRequestAttributes)) {
            return Optional.empty();
        }

        String authorizationHeader = ((ServletRequestAttributes) requestAttributes)
            .getRequest()
            .getHeader(HttpHeaders.AUTHORIZATION);
        return extractTokenFromAuthorization(authorizationHeader);
    }

    public Optional<String> extractTokenFromAuthorization(String authorization) {
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
        return parseClaims(token).map(AuthTokenClaims::getUserId);
    }

    public Optional<AuthTokenClaims> parseClaims(String token) {
        String[] segments = token.split("\\.");
        if (segments.length != 2) {
            return Optional.empty();
        }

        String payloadSegment = segments[0].trim();
        String signatureSegment = segments[1].trim();
        if (payloadSegment.isEmpty() || signatureSegment.isEmpty()) {
            return Optional.empty();
        }

        byte[] actualSignature;
        try {
            actualSignature = decodeBase64Url(signatureSegment);
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }

        byte[] expectedSignature = sign(payloadSegment);
        if (!MessageDigest.isEqual(actualSignature, expectedSignature)) {
            return Optional.empty();
        }

        String payload;
        try {
            payload = new String(decodeBase64Url(payloadSegment), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }

        String[] payloadParts = payload.split(":");
        if (payloadParts.length != 3) {
            return Optional.empty();
        }

        String userId = payloadParts[0].trim();
        String authVersionText = payloadParts[1].trim();
        String expiresAtText = payloadParts[2].trim();
        if (userId.isEmpty() || authVersionText.isEmpty()) {
            return Optional.empty();
        }

        int authVersion;
        try {
            authVersion = Integer.parseInt(authVersionText);
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }

        long expiresAtEpochSeconds;
        try {
            expiresAtEpochSeconds = Long.parseLong(expiresAtText);
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }

        if (expiresAtEpochSeconds <= Instant.now().getEpochSecond()) {
            return Optional.empty();
        }
        return Optional.of(new AuthTokenClaims(userId, authVersion, expiresAtEpochSeconds));
    }

    private String stripBearerPrefix(String authorization) {
        if (authorization.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            return authorization.substring(BEARER_PREFIX.length()).trim();
        }
        return authorization;
    }

    private byte[] sign(String payloadSegment) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(signingKey, HMAC_ALGORITHM));
            return mac.doFinal(payloadSegment.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("签名 token 失败", ex);
        }
    }

    private String encodeBase64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] decodeBase64Url(String value) {
        return Base64.getUrlDecoder().decode(value);
    }
}
