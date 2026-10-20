package com.fitsync.api.nutrition;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class NutritionSeeder implements CommandLineRunner {

    private final NutritionSeedService seedService;

    public NutritionSeeder(NutritionSeedService seedService) {
        this.seedService = seedService;
    }

    @Override
    public void run(String... args) {
        seedService.seed();
    }
}
