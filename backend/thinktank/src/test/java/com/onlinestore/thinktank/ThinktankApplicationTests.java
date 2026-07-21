package com.onlinestore.thinktank;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
// Kiểm tra Spring có thể khởi tạo đầy đủ application context của backend.
class ThinktankApplicationTests {

	@Test
	void contextLoads() {
	}

}
