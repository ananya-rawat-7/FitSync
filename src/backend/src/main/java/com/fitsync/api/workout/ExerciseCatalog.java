package com.fitsync.api.workout;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public final class ExerciseCatalog {

    public static final String DEFAULT_GOAL = "MAINTAIN_FITNESS";

    private static final Set<String> STRENGTH_GOALS = Set.of(
            "BUILD_STRENGTH", "GAIN_WEIGHT", "LOSE_WEIGHT", "MAINTAIN_FITNESS", "OTHER");
    private static final Set<String> CARDIO_GOALS = Set.of(
            "LOSE_WEIGHT", "IMPROVE_ENDURANCE", "GAIN_WEIGHT", "MAINTAIN_FITNESS", "OTHER");
    private static final Set<String> HIIT_GOALS = Set.of(
            "LOSE_WEIGHT", "IMPROVE_ENDURANCE", "OTHER");
    private static final Set<String> CORE_GOALS = Set.of(
            "BUILD_STRENGTH", "GAIN_WEIGHT", "LOSE_WEIGHT", "MAINTAIN_FITNESS", "OTHER");
    private static final Set<String> ALL_GOALS = Set.of(
            "BUILD_STRENGTH", "GAIN_WEIGHT", "LOSE_WEIGHT", "IMPROVE_ENDURANCE",
            "IMPROVE_FLEXIBILITY", "MAINTAIN_FITNESS", "OTHER");

    public static final List<ExerciseTemplate> EXERCISES = List.of(
            new ExerciseTemplate("Bodyweight Squat", "Strength", "None", "Beginner", 3, "12-15", 60,
                    "Stand with feet shoulder-width apart, lower your hips while keeping your chest up, then stand.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Goblet Squat", "Strength", "Dumbbell", "Intermediate", 3, "10-12", 75,
                    "Hold a dumbbell at your chest, squat down between your knees, and drive through your heels.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Bulgarian Split Squat", "Strength", "Dumbbell and bench", "Advanced", 3, "8-10 each leg", 90,
                    "Place your rear foot on a bench, lower into a split squat, and keep your front knee tracking over your toes.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Reverse Lunge", "Strength", "None", "Beginner", 3, "10 each leg", 60,
                    "Step backward into a lunge, keep your torso tall, then return to standing.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Romanian Deadlift", "Strength", "Dumbbell or barbell", "Intermediate", 3, "10-12", 75,
                    "Hinge at your hips with a slight knee bend, lower the weight, then squeeze your glutes to stand.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Glute Bridge", "Strength", "None", "Beginner", 3, "12-15", 45,
                    "Lie on your back, press through your heels, and lift your hips until your body forms a line.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Push-Up", "Strength", "None", "Beginner", 3, "8-15", 60,
                    "Keep your body in a straight line, lower your chest toward the floor, and press back up.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Dumbbell Bench Press", "Strength", "Dumbbell and bench", "Intermediate", 3, "10-12", 75,
                    "Lie on a bench with weights at chest height, press upward, and lower with control.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Dumbbell Row", "Strength", "Dumbbell", "Beginner", 3, "10-12 each side", 60,
                    "Hinge forward, pull the dumbbell toward your hip, and lower it slowly without twisting.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Overhead Press", "Strength", "Dumbbell", "Intermediate", 3, "8-12", 75,
                    "Start with weights at shoulder height, press overhead, and keep your ribs down.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Standing Calf Raise", "Strength", "None", "Beginner", 3, "15-20", 45,
                    "Rise onto the balls of your feet, pause at the top, and lower slowly.",
                    STRENGTH_GOALS),
            new ExerciseTemplate("Plank", "Core", "None", "Beginner", 3, "30-45 sec", 45,
                    "Brace your core and hold a straight line from head to heels without letting your hips sag.",
                    CORE_GOALS),
            new ExerciseTemplate("Side Plank", "Core", "None", "Intermediate", 3, "20-30 sec each side", 45,
                    "Support yourself on one forearm, lift your hips, and keep your body straight.",
                    CORE_GOALS),
            new ExerciseTemplate("Dead Bug", "Core", "None", "Beginner", 3, "10 each side", 45,
                    "Lie on your back and slowly extend the opposite arm and leg while keeping your lower back down.",
                    CORE_GOALS),
            new ExerciseTemplate("Bicycle Crunch", "Core", "None", "Beginner", 3, "12 each side", 45,
                    "Bring the opposite elbow toward the knee as you extend the other leg, moving with control.",
                    CORE_GOALS),
            new ExerciseTemplate("Mountain Climbers", "HIIT", "None", "Intermediate", 3, "30 sec", 45,
                    "From a plank, drive your knees toward your chest one at a time at a steady pace.",
                    HIIT_GOALS),
            new ExerciseTemplate("Burpee", "HIIT", "None", "Intermediate", 3, "8-12", 60,
                    "Squat, place your hands down, step or jump back, return, and stand or jump up.",
                    HIIT_GOALS),
            new ExerciseTemplate("Jumping Jacks", "Cardio", "None", "Beginner", 3, "45 sec", 30,
                    "Jump your feet out while raising your arms, then return to the start with a light rhythm.",
                    CARDIO_GOALS),
            new ExerciseTemplate("High Knees", "Cardio", "None", "Beginner", 3, "30 sec", 30,
                    "March or jog in place while lifting your knees toward hip height.",
                    CARDIO_GOALS),
            new ExerciseTemplate("Jump Rope", "Cardio", "Jump rope", "Beginner", 3, "2 min", 60,
                    "Keep a soft bounce and turn the rope with your wrists at a comfortable pace.",
                    CARDIO_GOALS),
            new ExerciseTemplate("Brisk Walk", "Cardio", "None", "Beginner", 1, "30-45 min", 0,
                    "Walk at a pace that feels purposeful but still lets you speak in short sentences.",
                    CARDIO_GOALS),
            new ExerciseTemplate("Easy Run", "Cardio", "None", "Intermediate", 1, "20-30 min", 0,
                    "Run at a conversational pace and shorten the session if your form starts to break down.",
                    CARDIO_GOALS),
            new ExerciseTemplate("Cycling", "Cardio", "Bike", "Beginner", 1, "25-40 min", 0,
                    "Cycle at a comfortable cadence with a light to moderate resistance.",
                    CARDIO_GOALS),
            new ExerciseTemplate("Incline Treadmill Walk", "Cardio", "Treadmill", "Beginner", 1, "25-30 min", 0,
                    "Set a gentle incline and walk at a pace you can maintain without holding the rails.",
                    CARDIO_GOALS),
            new ExerciseTemplate("Cat-Cow", "Mobility", "None", "Beginner", 2, "8-10 reps", 30,
                    "Move slowly between rounding and arching your spine, following your breath.",
                    ALL_GOALS),
            new ExerciseTemplate("World's Greatest Stretch", "Mobility", "None", "Beginner", 2, "5 each side", 30,
                    "Step into a lunge, place both hands down, rotate toward the front leg, and switch sides.",
                    ALL_GOALS),
            new ExerciseTemplate("Hip Flexor Stretch", "Mobility", "None", "Beginner", 2, "45 sec each side", 30,
                    "Kneel in a half-lunge, tuck your pelvis, and shift gently forward until you feel a stretch.",
                    ALL_GOALS),
            new ExerciseTemplate("Hamstring Stretch", "Mobility", "None", "Beginner", 2, "45 sec each side", 30,
                    "Extend one leg with a soft knee and hinge forward until you feel a gentle stretch.",
                    ALL_GOALS),
            new ExerciseTemplate("Thoracic Rotation", "Mobility", "None", "Beginner", 2, "8 each side", 30,
                    "From a seated or kneeling position, rotate your upper back slowly while keeping your hips still.",
                    ALL_GOALS),
            new ExerciseTemplate("Downward Dog", "Mobility", "None", "Beginner", 2, "45 sec", 30,
                    "Press your hands into the floor, lift your hips, and lengthen your spine with bent knees if needed.",
                    ALL_GOALS),
            new ExerciseTemplate("Child's Pose", "Recovery", "None", "Beginner", 1, "60 sec", 30,
                    "Kneel, sit back toward your heels, and reach your arms forward while breathing slowly.",
                    ALL_GOALS),
            new ExerciseTemplate("Foam Roll Quads", "Recovery", "Foam roller", "Beginner", 1, "60-90 sec each side", 30,
                    "Roll slowly along the front of your thigh and pause on tender spots without pressing into pain.",
                    ALL_GOALS),
            new ExerciseTemplate("Deep Breathing", "Recovery", "None", "Beginner", 1, "5 min", 0,
                    "Breathe in through your nose and out slowly, letting your shoulders and jaw relax.",
                    ALL_GOALS));

    private static final Map<String, List<DayTemplate>> WEEK_TEMPLATES = Map.of(
            "LOSE_WEIGHT", List.of(
                    day("Full-body strength", "Strength", 35,
                            "Keep rest short and focus on controlled form.",
                            "Bodyweight Squat", "Push-Up", "Dumbbell Row", "Glute Bridge", "Plank"),
                    day("Interval cardio", "HIIT", 25,
                            "Work hard for each interval, then recover enough to keep your form.",
                            "Jumping Jacks", "High Knees", "Mountain Climbers", "Burpee"),
                    day("Steady cardio", "Cardio", 35,
                            "Stay at a pace you could hold for the whole session.",
                            "Brisk Walk", "Easy Run", "Cycling"),
                    day("Core and mobility", "Core", 30,
                            "Move slowly, breathe, and avoid rushing the stretches.",
                            "Dead Bug", "Bicycle Crunch", "Side Plank", "Cat-Cow", "World's Greatest Stretch"),
                    day("Full-body strength", "Strength", 35,
                            "Aim for steady reps and add a little resistance when the last reps feel easy.",
                            "Reverse Lunge", "Overhead Press", "Dumbbell Row", "Glute Bridge", "Plank"),
                    day("Cardio circuit", "HIIT", 25,
                            "Rotate through the movements and rest as needed between rounds.",
                            "Jump Rope", "High Knees", "Burpee", "Mountain Climbers"),
                    day("Active recovery", "Recovery", 25,
                            "Keep this light. The goal is to feel better afterward, not exhausted.",
                            "Brisk Walk", "Cat-Cow", "Hip Flexor Stretch", "Child's Pose")),
            "GAIN_WEIGHT", List.of(
                    day("Upper-body strength", "Strength", 45,
                            "Add a small amount of weight or one rep when your form stays solid.",
                            "Push-Up", "Dumbbell Bench Press", "Dumbbell Row", "Overhead Press", "Plank"),
                    day("Lower-body strength", "Strength", 45,
                            "Use a challenging but controlled resistance and take full rest between sets.",
                            "Goblet Squat", "Romanian Deadlift", "Reverse Lunge", "Glute Bridge", "Plank"),
                    day("Easy cardio and mobility", "Cardio", 30,
                            "Keep this light so it supports recovery and appetite.",
                            "Brisk Walk", "Cycling", "Cat-Cow", "Hip Flexor Stretch"),
                    day("Push strength", "Strength", 40,
                            "Press with control and stop a rep or two before failure.",
                            "Push-Up", "Dumbbell Bench Press", "Overhead Press", "Side Plank"),
                    day("Pull and posterior chain", "Strength", 40,
                            "Pull with your back, hinge at your hips, and avoid rounding your spine.",
                            "Dumbbell Row", "Romanian Deadlift", "Glute Bridge", "Bicycle Crunch"),
                    day("Full-body strength", "Strength", 45,
                            "Focus on progressive overload: small increases in weight, reps, or sets over time.",
                            "Goblet Squat", "Push-Up", "Dumbbell Row", "Reverse Lunge", "Plank"),
                    day("Recovery day", "Recovery", 25,
                            "Take a genuine recovery day and prioritize sleep and regular meals.",
                            "Brisk Walk", "Cat-Cow", "Hamstring Stretch", "Child's Pose")),
            "BUILD_STRENGTH", List.of(
                    day("Full-body strength A", "Strength", 40,
                            "Use a resistance that leaves two or three good reps in reserve.",
                            "Goblet Squat", "Push-Up", "Dumbbell Row", "Glute Bridge", "Plank"),
                    day("Easy cardio", "Cardio", 30,
                            "Keep the effort conversational so it does not interfere with recovery.",
                            "Brisk Walk", "Cycling"),
                    day("Full-body strength B", "Strength", 40,
                            "Prioritize controlled reps and steady breathing.",
                            "Romanian Deadlift", "Overhead Press", "Reverse Lunge", "Dumbbell Row", "Dead Bug"),
                    day("Mobility", "Mobility", 25,
                            "Move gently and spend extra time on stiff areas.",
                            "Cat-Cow", "World's Greatest Stretch", "Thoracic Rotation", "Hip Flexor Stretch"),
                    day("Full-body strength C", "Strength", 40,
                            "Track your sets so you can add a little weight or a rep next time.",
                            "Bulgarian Split Squat", "Dumbbell Bench Press", "Dumbbell Row", "Glute Bridge", "Side Plank"),
                    day("Conditioning", "Cardio", 30,
                            "Keep this session moderate; strength is the priority this week.",
                            "Incline Treadmill Walk", "Jump Rope"),
                    day("Recovery", "Recovery", 25,
                            "Finish the week with easy movement and sleep.",
                            "Brisk Walk", "Child's Pose", "Hamstring Stretch", "Deep Breathing")),
            "IMPROVE_ENDURANCE", List.of(
                    day("Easy run", "Cardio", 35,
                            "Keep the pace conversational and walk if needed.",
                            "Easy Run", "Hamstring Stretch"),
                    day("Strength for runners", "Strength", 35,
                            "Build resilient legs and a stable core without lifting to failure.",
                            "Reverse Lunge", "Glute Bridge", "Dead Bug", "Plank"),
                    day("Tempo walk or jog", "Cardio", 35,
                            "Alternate a slightly harder effort with easy recovery.",
                            "Brisk Walk", "Incline Treadmill Walk"),
                    day("Mobility", "Mobility", 25,
                            "Loosen your hips, calves, and upper back.",
                            "Cat-Cow", "Hip Flexor Stretch", "World's Greatest Stretch", "Thoracic Rotation"),
                    day("Cross training", "Cardio", 35,
                            "Use a low-impact option and keep the effort steady.",
                            "Cycling", "Jump Rope"),
                    day("Long easy cardio", "Cardio", 45,
                            "Go longer, not harder. Finish feeling like you could continue.",
                            "Brisk Walk", "Easy Run", "Cycling"),
                    day("Recovery", "Recovery", 20,
                            "Breathe, stretch, and prepare for the next week.",
                            "Child's Pose", "Hamstring Stretch", "Deep Breathing")),
            "IMPROVE_FLEXIBILITY", List.of(
                    day("Morning mobility", "Mobility", 25,
                            "Move within a comfortable range and breathe slowly.",
                            "Cat-Cow", "World's Greatest Stretch", "Thoracic Rotation", "Downward Dog"),
                    day("Easy walk", "Cardio", 30,
                            "Walk comfortably and focus on a relaxed posture.",
                            "Brisk Walk"),
                    day("Hip and hamstring flow", "Mobility", 25,
                            "Hold each stretch gently without bouncing.",
                            "Hip Flexor Stretch", "Hamstring Stretch", "Downward Dog", "Child's Pose"),
                    day("Core and posture", "Core", 25,
                            "Use slow, controlled movements and keep breathing.",
                            "Dead Bug", "Side Plank", "Thoracic Rotation", "Cat-Cow"),
                    day("Full-body stretch", "Mobility", 30,
                            "Move through each position slowly and stay comfortable.",
                            "World's Greatest Stretch", "Downward Dog", "Hip Flexor Stretch", "Hamstring Stretch", "Child's Pose"),
                    day("Easy walk", "Cardio", 30,
                            "Keep the pace easy and enjoy the movement.",
                            "Brisk Walk"),
                    day("Rest and breathe", "Recovery", 20,
                            "Use this day to relax and reset.",
                            "Deep Breathing", "Child's Pose", "Cat-Cow")),
            DEFAULT_GOAL, List.of(
                    day("Full-body strength", "Strength", 35,
                            "Use controlled reps and a resistance that feels manageable.",
                            "Bodyweight Squat", "Push-Up", "Dumbbell Row", "Glute Bridge", "Plank"),
                    day("Cardio", "Cardio", 30,
                            "Keep the effort comfortable and consistent.",
                            "Brisk Walk", "Easy Run"),
                    day("Mobility", "Mobility", 25,
                            "Move gently and breathe through each position.",
                            "Cat-Cow", "World's Greatest Stretch", "Thoracic Rotation", "Hip Flexor Stretch"),
                    day("Strength and core", "Strength", 35,
                            "Focus on steady form rather than speed.",
                            "Reverse Lunge", "Overhead Press", "Dead Bug", "Bicycle Crunch"),
                    day("Cardio", "Cardio", 30,
                            "Choose the option that feels best for your joints and energy.",
                            "Cycling", "Jump Rope"),
                    day("Recovery", "Recovery", 25,
                            "Keep this easy and finish feeling refreshed.",
                            "Brisk Walk", "Child's Pose", "Hamstring Stretch"),
                    day("Rest day", "Recovery", 20,
                            "Rest, hydrate, and prepare for the next week.",
                            "Deep Breathing", "Cat-Cow", "Child's Pose")));

    private ExerciseCatalog() {
    }

    public static List<ExerciseTemplate> forGoal(String goal) {
        if (goal == null || goal.isBlank()) {
            return EXERCISES;
        }
        return EXERCISES.stream()
                .filter(exercise -> exercise.goals().contains(goal))
                .toList();
    }

    public static List<DayTemplate> weekFor(String goal) {
        String normalized = normalizeGoal(goal);
        return WEEK_TEMPLATES.getOrDefault(normalized, WEEK_TEMPLATES.get(DEFAULT_GOAL));
    }

    public static String normalizeGoal(String goal) {
        if (goal == null || goal.isBlank()) {
            return DEFAULT_GOAL;
        }
        return WEEK_TEMPLATES.containsKey(goal) ? goal : DEFAULT_GOAL;
    }

    public static Optional<ExerciseTemplate> find(String name) {
        return EXERCISES.stream()
                .filter(exercise -> exercise.name().equals(name))
                .findFirst();
    }

    private static DayTemplate day(String title, String category, int durationMinutes,
                                   String note, String... exerciseNames) {
        return new DayTemplate(title, category, durationMinutes, note, List.of(exerciseNames));
    }

    public record ExerciseTemplate(
            String name,
            String category,
            String equipment,
            String difficulty,
            int setCount,
            String reps,
            int restSeconds,
            String instructions,
            Set<String> goals) {
    }

    public record DayTemplate(
            String title,
            String category,
            int durationMinutes,
            String note,
            List<String> exerciseNames) {
    }
}
