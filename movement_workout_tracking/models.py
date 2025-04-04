# movement_workout_tracking/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class GeneratedWorkoutPlan(models.Model):
    workout_type = models.CharField(max_length=50, blank=True)
    duration = models.PositiveIntegerField(default=0)
    complexity = models.CharField(max_length=50, blank=True)
    finish_type = models.CharField(max_length=50, blank=True)

    strong_1 = models.TextField(blank=True)
    strong_2 = models.TextField(blank=True)
    build_1_movement_1 = models.TextField(blank=True)
    build_1_movement_2 = models.TextField(blank=True)
    build_2_movement_1 = models.TextField(blank=True)
    build_2_movement_2 = models.TextField(blank=True)
    pump_1_movement_1 = models.TextField(blank=True)
    pump_1_movement_2 = models.TextField(blank=True)
    pump_2_movement_1 = models.TextField(blank=True)
    pump_2_movement_2 = models.TextField(blank=True)

    request_number = models.PositiveIntegerField(default=0)


    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.workout_type} ({self.duration} min) - {self.complexity}/{self.finish_type}"


class MovementUsage(models.Model):
    movement = models.CharField(max_length=255)
    category = models.CharField(max_length=50, blank=True) 
    workout_type = models.CharField(max_length=50, blank=True)
    workout_time = models.PositiveIntegerField(null=True, blank=True)

    usage_count = models.PositiveIntegerField(default=0)

    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # If you want to enforce uniqueness for each (movement, category, workout_type, workout_time),
        # so there's only 1 row per combination, do:
        unique_together = ('movement', 'category', 'workout_type', 'workout_time')


    def __str__(self):
        return f"{self.movement} ({self.category}) - {self.usage_count} uses"
