package com.fitsync.api.config;

import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods = false)
public class EnvironmentConfigValidationConfiguration {

    @Bean
    static BeanFactoryPostProcessor validateEnvironment(Environment environment) {
        return beanFactory -> EnvironmentConfigValidator.validate(environment);
    }
}
