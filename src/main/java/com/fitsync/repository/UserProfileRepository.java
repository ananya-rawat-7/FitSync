package com.fitsync.repository;

import com.fitsync.model.UserProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}