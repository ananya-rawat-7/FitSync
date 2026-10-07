package com.fitsync.api.auth;

public record AuthResponse(String token, String tokenType, UserResponse user) {

    public static AuthResponse bearer(String token, UserAccount account) {
        return new AuthResponse(token, "Bearer", UserResponse.from(account));
    }
}
