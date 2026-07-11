package com.onlinestore.thinktank;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

// Hỗ trợ đóng gói và triển khai ứng dụng dưới dạng WAR trên servlet container bên ngoài.
public class ServletInitializer extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(ThinktankApplication.class);
	}

}
