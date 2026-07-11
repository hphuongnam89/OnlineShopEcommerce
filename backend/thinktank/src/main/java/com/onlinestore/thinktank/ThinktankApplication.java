package com.onlinestore.thinktank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
// Điểm khởi động chính của backend Spring Boot.
public class ThinktankApplication {

	public static void main(String[] args) {
		SpringApplication.run(ThinktankApplication.class, args);
	}

}
