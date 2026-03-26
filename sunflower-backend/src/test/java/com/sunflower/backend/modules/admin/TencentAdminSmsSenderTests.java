package com.sunflower.backend.modules.admin;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sunflower.backend.common.exception.BusinessException;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.sms.v20210111.SmsClient;
import com.tencentcloudapi.sms.v20210111.models.SendSmsRequest;
import com.tencentcloudapi.sms.v20210111.models.SendSmsResponse;
import com.tencentcloudapi.sms.v20210111.models.SendStatus;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class TencentAdminSmsSenderTests {

    @Test
    void shouldUseConfiguredTemplateAndPersistTencentStatusOnSuccess() throws TencentCloudSDKException {
        SmsClient smsClient = mock(SmsClient.class);
        TencentAdminSmsSender sender = new TencentAdminSmsSender(
            "1400123456",
            "Sunflower",
            "1876543",
            "1987654",
            smsClient
        );
        SendSmsResponse response = new SendSmsResponse();
        response.setRequestId("request-123");
        response.setSendStatusSet(new SendStatus[] { buildStatus("serial-001", "Ok", "send success") });
        when(smsClient.SendSms(any(SendSmsRequest.class))).thenReturn(response);

        AdminSmsSendResult result = sender.sendVerificationCode("17712344579", AdminSmsPurpose.ACTIVATE, "123456");

        assertEquals("serial-001", result.getProviderMessageId());
        assertEquals("Ok", result.getProviderStatus());

        ArgumentCaptor<SendSmsRequest> requestCaptor = ArgumentCaptor.forClass(SendSmsRequest.class);
        verify(smsClient).SendSms(requestCaptor.capture());
        SendSmsRequest request = requestCaptor.getValue();
        assertEquals("1400123456", request.getSmsSdkAppId());
        assertEquals("Sunflower", request.getSignName());
        assertEquals("1876543", request.getTemplateId());
        assertArrayEquals(new String[] { "123456" }, request.getTemplateParamSet());
        assertArrayEquals(new String[] { "+8617712344579" }, request.getPhoneNumberSet());
        assertEquals("ACTIVATE", request.getSessionContext());
    }

    @Test
    void shouldFailWhenTencentReturnsTemplateErrorStatus() throws TencentCloudSDKException {
        SmsClient smsClient = mock(SmsClient.class);
        TencentAdminSmsSender sender = new TencentAdminSmsSender(
            "1400123456",
            "Sunflower",
            "1876543",
            "1987654",
            smsClient
        );
        SendSmsResponse response = new SendSmsResponse();
        response.setRequestId("request-456");
        response.setSendStatusSet(
            new SendStatus[] {
                buildStatus(
                    "",
                    "FailedOperation.TemplateParamSetNotMatchApprovedTemplate",
                    "request content does not match the template content"
                ),
            }
        );
        when(smsClient.SendSms(any(SendSmsRequest.class))).thenReturn(response);

        BusinessException error = assertThrows(
            BusinessException.class,
            () -> sender.sendVerificationCode("17712344579", AdminSmsPurpose.ACTIVATE, "123456")
        );

        assertEquals("短信发送失败，请检查腾讯云短信模板配置", error.getMessage());
    }

    @Test
    void shouldFailWhenTencentReturnsEmptyStatusSet() throws TencentCloudSDKException {
        SmsClient smsClient = mock(SmsClient.class);
        TencentAdminSmsSender sender = new TencentAdminSmsSender(
            "1400123456",
            "Sunflower",
            "1876543",
            "1987654",
            smsClient
        );
        SendSmsResponse response = new SendSmsResponse();
        response.setRequestId("request-789");
        response.setSendStatusSet(new SendStatus[0]);
        when(smsClient.SendSms(any(SendSmsRequest.class))).thenReturn(response);

        BusinessException error = assertThrows(
            BusinessException.class,
            () -> sender.sendVerificationCode("17712344579", AdminSmsPurpose.RESET_PASSWORD, "654321")
        );

        assertEquals("短信发送失败，请稍后重试", error.getMessage());
    }

    private SendStatus buildStatus(String serialNo, String code, String message) {
        SendStatus sendStatus = new SendStatus();
        sendStatus.setSerialNo(serialNo);
        sendStatus.setCode(code);
        sendStatus.setMessage(message);
        return sendStatus;
    }
}
