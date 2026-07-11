package com.onlinestore.thinktank.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Thinktank Online Store API",
                version = "1.0.0",
                description = "API documentation for the Thinktank online store platform",
                contact = @Contact(
                        name = "Thinktank Team",
                        url = "https://thinktank.com"
                )
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "JWT Bearer Token"
)
// Cấu hình tài liệu Swagger/OpenAPI để xem và thử các endpoint của backend.
public class OpenApiConfig {
}
