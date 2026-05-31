package com.sunflower.backend.modules.payment.wechat.persistence;

import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

@Entity
@Table(name = "wechat_notify_events")
public class WechatNotifyEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notify_id")
    private String notifyId;

    @Column(name = "notify_type")
    @Enumerated(EnumType.STRING)
    private WechatNotifyEventType notifyType;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "event_type")
    private String eventType;

    private String summary;

    @Enumerated(EnumType.STRING)
    private WechatNotifyEventStatus status;

    @Lob
    @Column(name = "raw_headers")
    private String rawHeaders;

    @Lob
    @Column(name = "raw_body")
    private String rawBody;

    @Lob
    @Column(name = "decrypted_body")
    private String decryptedBody;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNotifyId() {
        return notifyId;
    }

    public void setNotifyId(String notifyId) {
        this.notifyId = notifyId;
    }

    public WechatNotifyEventType getNotifyType() {
        return notifyType;
    }

    public void setNotifyType(WechatNotifyEventType notifyType) {
        this.notifyType = notifyType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public WechatNotifyEventStatus getStatus() {
        return status;
    }

    public void setStatus(WechatNotifyEventStatus status) {
        this.status = status;
    }

    public String getRawHeaders() {
        return rawHeaders;
    }

    public void setRawHeaders(String rawHeaders) {
        this.rawHeaders = rawHeaders;
    }

    public String getRawBody() {
        return rawBody;
    }

    public void setRawBody(String rawBody) {
        this.rawBody = rawBody;
    }

    public String getDecryptedBody() {
        return decryptedBody;
    }

    public void setDecryptedBody(String decryptedBody) {
        this.decryptedBody = decryptedBody;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
