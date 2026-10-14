package com.fitsync.api.auth;

import java.math.BigDecimal;

public record UserResponse(Long id, String displayName, String email, BigDecimal weightKg,
                           BigDecimal heightCm, Integer age, String gender, String fitnessGoal) {

    public static UserResponse from(UserAccount account) {
        return new UserResponse(account.getId(), account.getDisplayName(), account.getEmail(),
                account.getWeightKg(), account.getHeightCm(), account.getAge(),
                account.getGender(), account.getFitnessGoal());
    }
}
