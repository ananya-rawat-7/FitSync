package com.fitsync.api.workout;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    @GetMapping
    public List<ExerciseCatalog.ExerciseTemplate> findAll(@RequestParam(required = false) String goal) {
        return ExerciseCatalog.forGoal(goal);
    }
}
