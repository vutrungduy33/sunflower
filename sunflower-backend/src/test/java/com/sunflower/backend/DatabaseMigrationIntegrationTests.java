package com.sunflower.backend;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class DatabaseMigrationIntegrationTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldCreateCoreTablesViaFlyway() {
        List<String> tableNames = jdbcTemplate.queryForList(
            "SELECT LOWER(table_name) FROM information_schema.tables WHERE table_schema = 'PUBLIC'",
            String.class
        );

        assertThat(tableNames)
            .contains("users", "user_profiles", "rooms", "room_prices", "room_inventory", "orders");
    }

    @Test
    void shouldSeedTestDataForCoreModules() {
        Integer users = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        Integer rooms = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM rooms", Integer.class);
        Integer orders = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM orders", Integer.class);

        assertThat(users).isNotNull().isGreaterThanOrEqualTo(1);
        assertThat(rooms).isNotNull().isGreaterThanOrEqualTo(3);
        assertThat(orders).isNotNull().isGreaterThanOrEqualTo(1);
    }
}
