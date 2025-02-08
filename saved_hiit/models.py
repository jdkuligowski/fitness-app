from django.db import models

class SavedHIITWorkout(models.Model):
    workout_type = models.CharField(max_length=20, null=True, blank=True) 
    structure = models.CharField(max_length=100, null=True, blank=True)  
    duration = models.PositiveIntegerField(null=True, blank=True)
    rpe = models.PositiveSmallIntegerField(null=True, blank=True)  
    comments = models.TextField(null=True, blank=True)  
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True) 
    workout = models.ForeignKey(
        'saved_workouts.Workout',
        related_name='hiit_sessions',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.type} - {self.duration} min"