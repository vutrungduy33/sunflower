package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.sms.v20210111.SmsClient;
import com.tencentcloudapi.sms.v20210111.models.SendSmsRequest;
import com.tencentcloudapi.sms.v20210111.models.SendSmsResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.admin.sms.provider", havingValue = "tencent", matchIfMissing = true)
public class TencentAdminSmsSender implements AdminSmsSender {

    private final SmsClient smsClient;
    private final String sdkAppId;
    private final String signName;
    private final String activateTemplateId;
    private final String resetPasswordTemplateId;

    public TencentAdminSmsSender(
        @Value("${app.admin.sms.tencent.secret-id:}") String secretId,
        @Value("${app.admin.sms.tencent.secret-key:}") String secretKey,
        @Value("${app.admin.sms.tencent.region:ap-guangzhou}") String region,
        @Value("${app.admin.sms.tencent.sdk-app-id:}") String sdkAppId,
        @Value("${app.admin.sms.tencent.sign-name:}") String signName,
        @Value("${app.admin.sms.tencent.activate-template-id:}") String activateTemplateId,
        @Value("${app.admin.sms.tencent.reset-password-template-id:}") String resetPasswordTemplateId
    ) {
        this.sdkAppId = requireValue(sdkAppId, "app.admin.sms.tencent.sdk-app-id");
        this.signName = requireValue(signName, "app.admin.sms.tencent.sign-name");
        this.activateTemplateId = requireValue(activateTemplateId, "app.admin.sms.tencent.activate-template-id");
        this.resetPasswordTemplateId =
            requireValue(resetPasswordTemplateId, "app.admin.sms.tencent.reset-password-template-id");

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
        this.smsClient = new SmsClient(credential, requireValue(region, "app.admin.sms.tencent.region"), clientProfile);
    }

    @Override
    public AdminSmsSendResult sendVerificationCode(String phone, AdminSmsPurpose purpose, String code, int expiresInMinutes) {
        try {
            SendSmsRequest request = new SendSmsRequest();
            request.setSmsSdkAppId(sdkAppId);
            request.setSignName(signName);
            request.setTemplateId(resolveTemplateId(purpose));
            request.setTemplateParamSet(new String[] { code, String.valueOf(expiresInMinutes) });
            request.setPhoneNumberSet(new String[] { "+86" + phone });
            request.setSessionContext(purpose.name());
            SendSmsResponse response = smsClient.SendSms(request);
            return new AdminSmsSendResult(response.getRequestId(), "ACCEPTED");
        } catch (TencentCloudSDKException ex) {
            throw BusinessException.badRequest("短信服务暂不可用，请稍后重试");
        }
    }

    private String resolveTemplateId(AdminSmsPurpose purpose) {
        if (purpose == AdminSmsPurpose.ACTIVATE) {
            return activateTemplateId;
        }
        return resetPasswordTemplateId;
    }

    private String requireValue(String value, String propertyName) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new IllegalStateException(propertyName + " 未配置");
        }
        return normalized;
    }
}
