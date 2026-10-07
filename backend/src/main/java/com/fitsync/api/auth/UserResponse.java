package com.fitsync.api.auth;

public record UserResponse(Long id, String displayName, String email) {

    public static UserResponse from(UserAccount account) {
        return new UserResponse(account.getId(), account.getDisplayName(), account.getEmail());
    }
}
