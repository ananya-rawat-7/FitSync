package com.fitsync.api.workout;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CatalogSeeder implements CommandLineRunner {

    private final CatalogSeedService seedService;

    public CatalogSeeder(CatalogSeedService seedService) {
        this.seedService = seedService;
    }

    @Override
    public void run(String... args) {
        seedService.seed();
    }
}
