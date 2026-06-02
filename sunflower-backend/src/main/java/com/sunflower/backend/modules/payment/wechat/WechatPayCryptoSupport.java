package com.sunflower.backend.modules.payment.wechat;

import com.sunflower.backend.common.exception.BusinessException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class WechatPayCryptoSupport {

    private static final String SIGNATURE_ALGORITHM = "SHA256withRSA";
    private static final String RSA_ALGORITHM = "RSA";
    private static final String AES_GCM_ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final long CALLBACK_TIMESTAMP_TOLERANCE_SECONDS = 300L;

    private final WechatPayProperties properties;
    private volatile PrivateKey cachedPrivateKey;
    private volatile PublicKey cachedPublicKey;

    public WechatPayCryptoSupport(WechatPayProperties properties) {
        this.properties = properties;
    }

    public String buildAuthorization(String method, String canonicalUrl, String body, long timestamp, String nonce) {
        requireRealConfig("微信支付请求签名");
        String normalizedBody = body == null ? "" : body;
        String message = method + "\n" + canonicalUrl + "\n" + timestamp + "\n" + nonce + "\n" + normalizedBody + "\n";
        String signature = signBase64(message);
        return "WECHATPAY2-SHA256-RSA2048 mchid=\""
            + properties.getMchId()
            + "\",nonce_str=\""
            + nonce
            + "\",timestamp=\""
            + timestamp
            + "\",serial_no=\""
            + properties.getMerchantSerialNo()
            + "\",signature=\""
            + signature
            + "\"";
    }

    public String signMiniProgramPayment(String appId, String timeStamp, String nonceStr, String packageValue, String signType) {
        requireRealConfig("小程序支付签名");
        String message = appId + "\n" + timeStamp + "\n" + nonceStr + "\n" + packageValue + "\n" + signType + "\n";
        return signBase64(message);
    }

    public boolean verifySignature(String serialNo, String timestamp, String nonce, String body, String signatureValue) {
        requireVerifyConfig();
        if (signatureValue == null || signatureValue.trim().isEmpty()) {
            return false;
        }
        long timestampSeconds = parseTimestamp(timestamp);
        if (timestampSeconds <= 0L) {
            return false;
        }
        if (Math.abs(Instant.now().getEpochSecond() - timestampSeconds) > CALLBACK_TIMESTAMP_TOLERANCE_SECONDS) {
            return false;
        }
        String configuredSerial = normalize(properties.getPublicKeyId());
        if (!configuredSerial.isEmpty() && !configuredSerial.equals(normalize(serialNo))) {
            return false;
        }
        String message = normalize(timestamp) + "\n" + normalize(nonce) + "\n" + (body == null ? "" : body) + "\n";
        try {
            Signature verifier = Signature.getInstance(SIGNATURE_ALGORITHM);
            verifier.initVerify(resolvePublicKey());
            verifier.update(message.getBytes(StandardCharsets.UTF_8));
            return verifier.verify(Base64.getDecoder().decode(signatureValue));
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            return false;
        }
    }

    public String decryptResource(String associatedData, String nonce, String ciphertext) {
        String apiV3Key = normalize(properties.getApiV3Key());
        if (apiV3Key.isEmpty()) {
            throw new IllegalStateException("app.pay.wechat.api-v3-key 未配置");
        }
        try {
            Cipher cipher = Cipher.getInstance(AES_GCM_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(apiV3Key.getBytes(StandardCharsets.UTF_8), "AES");
            cipher.init(
                Cipher.DECRYPT_MODE,
                keySpec,
                new GCMParameterSpec(GCM_TAG_LENGTH, normalize(nonce).getBytes(StandardCharsets.UTF_8))
            );
            String aad = associatedData == null ? "" : associatedData;
            cipher.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(ciphertext));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            throw BusinessException.badRequest("微信回调报文解密失败");
        }
    }

    public String signBase64(String message) {
        try {
            Signature signer = Signature.getInstance(SIGNATURE_ALGORITHM);
            signer.initSign(resolvePrivateKey());
            signer.update(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(signer.sign());
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("微信支付签名失败", ex);
        }
    }

    private void requireRealConfig(String operation) {
        if (properties.isMockEnabled()) {
            return;
        }
        if (normalize(properties.getAppId()).isEmpty()
            || normalize(properties.getMchId()).isEmpty()
            || normalize(properties.getMerchantSerialNo()).isEmpty()) {
            throw new IllegalStateException(operation + "所需的 appId/mchId/merchantSerialNo 未配置");
        }
    }

    private void requireVerifyConfig() {
        if (normalize(properties.getPublicKeyContent()).isEmpty() && normalize(properties.getPublicKeyPath()).isEmpty()) {
            throw new IllegalStateException("app.pay.wechat.public-key-content/public-key-path 未配置");
        }
    }

    private long parseTimestamp(String timestamp) {
        try {
            return Long.parseLong(normalize(timestamp));
        } catch (NumberFormatException ex) {
            return -1L;
        }
    }

    private PrivateKey resolvePrivateKey() {
        PrivateKey local = cachedPrivateKey;
        if (local != null) {
            return local;
        }
        synchronized (this) {
            if (cachedPrivateKey == null) {
                cachedPrivateKey = parsePrivateKey(readPem(properties.getPrivateKeyContent(), properties.getPrivateKeyPath(), "privateKey"));
            }
            return cachedPrivateKey;
        }
    }

    private PublicKey resolvePublicKey() {
        PublicKey local = cachedPublicKey;
        if (local != null) {
            return local;
        }
        synchronized (this) {
            if (cachedPublicKey == null) {
                cachedPublicKey = parsePublicKey(readPem(properties.getPublicKeyContent(), properties.getPublicKeyPath(), "publicKey"));
            }
            return cachedPublicKey;
        }
    }

    private String readPem(String inlinePem, String pemPath, String label) {
        String inline = normalize(inlinePem);
        if (!inline.isEmpty()) {
            return inline;
        }
        String path = normalize(pemPath);
        if (path.isEmpty()) {
            throw new IllegalStateException("app.pay.wechat." + label + " 未配置");
        }
        try {
            return Files.readString(Paths.get(path), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("读取微信支付密钥文件失败: " + path, ex);
        }
    }

    private PrivateKey parsePrivateKey(String pem) {
        try {
            byte[] keyBytes = Base64.getMimeDecoder().decode(stripPemHeaders(pem));
            return KeyFactory.getInstance(RSA_ALGORITHM).generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("解析微信支付私钥失败", ex);
        }
    }

    private PublicKey parsePublicKey(String pem) {
        try {
            byte[] keyBytes = Base64.getMimeDecoder().decode(stripPemHeaders(pem));
            return KeyFactory.getInstance(RSA_ALGORITHM).generatePublic(new X509EncodedKeySpec(keyBytes));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("解析微信支付公钥失败", ex);
        }
    }

    private String stripPemHeaders(String pem) {
        return pem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "")
            .replaceAll("\\s+", "");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
