package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.sms.v20210111.SmsClient;
import com.tencentcloudapi.sms.v20210111.models.SendStatus;
import com.tencentcloudapi.sms.v20210111.models.SendSmsRequest;
import com.tencentcloudapi.sms.v20210111.models.SendSmsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.admin.sms.provider", havingValue = "tencent", matchIfMissing = true)
public class TencentAdminSmsSender implements AdminSmsSender {

    private static final Logger log = LoggerFactory.getLogger(TencentAdminSmsSender.class);
    private static final String TENCENT_SMS_SUCCESS_CODE = "Ok";

    private final SmsClient smsClient;
    private final String sdkAppId;
    private final String signName;
    private final String activateTemplateId;
    private final String resetPasswordTemplateId;

    @Autowired
    public TencentAdminSmsSender(
        @Value("${app.admin.sms.tencent.secret-id:}") String secretId,
        @Value("${app.admin.sms.tencent.secret-key:}") String secretKey,
        @Value("${app.admin.sms.tencent.region:ap-guangzhou}") String region,
        @Value("${app.admin.sms.tencent.sdk-app-id:}") String sdkAppId,
        @Value("${app.admin.sms.tencent.sign-name:}") String signName,
        @Value("${app.admin.sms.tencent.activate-template-id:}") String activateTemplateId,
        @Value("${app.admin.sms.tencent.reset-password-template-id:}") String resetPasswordTemplateId
    ) {
        this(
            requireValue(sdkAppId, "app.admin.sms.tencent.sdk-app-id"),
            requireValue(signName, "app.admin.sms.tencent.sign-name"),
            requireValue(activateTemplateId, "app.admin.sms.tencent.activate-template-id"),
            requireValue(resetPasswordTemplateId, "app.admin.sms.tencent.reset-password-template-id"),
            buildSmsClient(secretId, secretKey, region)
        );
    }

    TencentAdminSmsSender(
        String sdkAppId,
        String signName,
        String activateTemplateId,
        String resetPasswordTemplateId,
        SmsClient smsClient
    ) {
        this.sdkAppId = sdkAppId;
        this.signName = signName;
        this.activateTemplateId = activateTemplateId;
        this.resetPasswordTemplateId = resetPasswordTemplateId;
        this.smsClient = smsClient;
    }

    @Override
    public AdminSmsSendResult sendVerificationCode(String phone, AdminSmsPurpose purpose, String code) {
        try {
            SendSmsRequest request = new SendSmsRequest();
            request.setSmsSdkAppId(sdkAppId);
            request.setSignName(signName);
            request.setTemplateId(resolveTemplateId(purpose));
            request.setTemplateParamSet(new String[] { code });
            request.setPhoneNumberSet(new String[] { "+86" + phone });
            request.setSessionContext(purpose.name());
            SendSmsResponse response = smsClient.SendSms(request);
            SendStatus sendStatus = requireSuccessfulStatus(response, phone, purpose);
            String providerMessageId = firstNonBlank(sendStatus.getSerialNo(), response.getRequestId());
            return new AdminSmsSendResult(providerMessageId, sendStatus.getCode());
        } catch (TencentCloudSDKException ex) {
            log.warn("Tencent SMS request failed for purpose={} phone={} error={}", purpose, phone, ex.getMessage());
            throw BusinessException.badRequest("短信服务暂不可用，请稍后重试");
        }
    }

    private SendStatus requireSuccessfulStatus(SendSmsResponse response, String phone, AdminSmsPurpose purpose) {
        SendStatus[] sendStatusSet = response.getSendStatusSet();
        if (sendStatusSet == null || sendStatusSet.length == 0 || sendStatusSet[0] == null) {
            log.warn(
                "Tencent SMS returned empty send status for purpose={} phone={} requestId={}",
                purpose,
                phone,
                response.getRequestId()
            );
            throw BusinessException.badRequest("短信发送失败，请稍后重试");
        }

        SendStatus sendStatus = sendStatusSet[0];
        String providerCode = normalize(sendStatus.getCode());
        if (!TENCENT_SMS_SUCCESS_CODE.equalsIgnoreCase(providerCode)) {
            String providerMessage = normalize(sendStatus.getMessage());
            log.warn(
                "Tencent SMS rejected request for purpose={} phone={} requestId={} code={} message={}",
                purpose,
                phone,
                response.getRequestId(),
                providerCode,
                providerMessage
            );
            throw BusinessException.badRequest(buildProviderErrorMessage(providerCode, providerMessage));
        }

        return sendStatus;
    }

    private String resolveTemplateId(AdminSmsPurpose purpose) {
        if (purpose == AdminSmsPurpose.ACTIVATE) {
            return activateTemplateId;
        }
        return resetPasswordTemplateId;
    }

    private String buildProviderErrorMessage(String providerCode, String providerMessage) {
        if (providerCode.startsWith("FailedOperation.Template") || providerCode.startsWith("InvalidParameterValue.Template")) {
            return "短信发送失败，请检查腾讯云短信模板配置";
        }
        if (providerCode.startsWith("FailedOperation.Signature")) {
            return "短信发送失败，请检查腾讯云短信签名配置";
        }
        return firstNonBlank(providerMessage, "短信发送失败，请稍后重试");
    }

    private static SmsClient buildSmsClient(String secretId, String secretKey, String region) {
        Credential credential = new Credential(
            requireValue(secretId, "app.admin.sms.tencent.secret-id"),
            requireValue(secretKey, "app.admin.sms.tencent.secret-key")
        );
        HttpProfile httpProfile = new HttpProfile();
        httpProfile.setConnTimeout(10);
        httpProfile.setWriteTimeout(10);
        httpProfile.setReadTimeout(10);
        httpProfile.setEndpoint("sms.tencentcloudapi.com");

        ClientProfile clientProfile = new ClientProfile();
        clientProfile.setHttpProfile(httpProfile);
        return new SmsClient(credential, requireValue(region, "app.admin.sms.tencent.region"), clientProfile);
    }

    private static String requireValue(String value, String propertyName) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalStateException(propertyName + " 未配置");
        }
        return normalized;
    }

    private String firstNonBlank(String primary, String fallback) {
        String normalizedPrimary = normalize(primary);
        if (!normalizedPrimary.isEmpty()) {
            return normalizedPrimary;
        }
        return normalize(fallback);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
