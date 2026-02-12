CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    openid VARCHAR(128) NOT NULL,
    unionid VARCHAR(128),
    phone VARCHAR(20),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_openid UNIQUE (openid),
    CONSTRAINT uk_users_unionid UNIQUE (unionid),
    CONSTRAINT uk_users_phone UNIQUE (phone)
);

CREATE TABLE user_profiles (
    user_id VARCHAR(64) PRIMARY KEY,
    nickname VARCHAR(64) NOT NULL,
    avatar VARCHAR(255),
    tags_json VARCHAR(512) NOT NULL DEFAULT '[]',
    preferences_json VARCHAR(1024) NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE rooms (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    subtitle VARCHAR(255) NOT NULL,
    cover VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    area INT NOT NULL,
    bed_type VARCHAR(128) NOT NULL,
    scenic_type VARCHAR(64) NOT NULL,
    tags_json VARCHAR(512) NOT NULL DEFAULT '[]',
    base_price INT NOT NULL,
    breakfast VARCHAR(64) NOT NULL,
    intro VARCHAR(2048) NOT NULL,
    amenities_json VARCHAR(1024) NOT NULL DEFAULT '[]',
    rules_json VARCHAR(1024) NOT NULL DEFAULT '[]',
    can_cancel_before_hours INT NOT NULL DEFAULT 24,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE room_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(64) NOT NULL,
    biz_date DATE NOT NULL,
    price INT NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'BASE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_room_prices_room_date UNIQUE (room_id, biz_date),
    CONSTRAINT fk_room_prices_room FOREIGN KEY (room_id) REFERENCES rooms (id)
);

CREATE TABLE room_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(64) NOT NULL,
    biz_date DATE NOT NULL,
    total_stock INT NOT NULL,
    available_stock INT NOT NULL,
    locked_stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_room_inventory_room_date UNIQUE (room_id, biz_date),
    CONSTRAINT fk_room_inventory_room FOREIGN KEY (room_id) REFERENCES rooms (id)
);

CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY,
    order_no VARCHAR(32) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'direct',
    room_id VARCHAR(64) NOT NULL,
    room_name VARCHAR(128) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INT NOT NULL,
    guest_name VARCHAR(64) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    arrival_time VARCHAR(32) NOT NULL,
    remark VARCHAR(512) NOT NULL DEFAULT '',
    total_amount INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    paid_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_orders_order_no UNIQUE (order_no),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_orders_room FOREIGN KEY (room_id) REFERENCES rooms (id)
);

CREATE INDEX idx_room_prices_room_date ON room_prices (room_id, biz_date);
CREATE INDEX idx_room_inventory_room_date ON room_inventory (room_id, biz_date);
CREATE INDEX idx_orders_user_status_created ON orders (user_id, status, created_at);
CREATE INDEX idx_orders_checkin_checkout ON orders (check_in_date, check_out_date);
