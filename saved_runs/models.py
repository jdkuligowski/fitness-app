from django.db import models

class SavedRunningSession(models.Model):
    workout = models.ForeignKey(
        'saved_workouts.Workout',
        related_name='running_sessions',
        on_delete=models.CASCADE
    )
    running_session = models.ForeignKey(
        'running_sessions.RunningSession',
        related_name='saved_sessions',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    warmup_distance = models.FloatField(null=True, blank=True)  
    cooldown_distance = models.FloatField(null=True, blank=True)  
    total_distance = models.FloatField(null=True, blank=True)  
    workout_notes = models.TextField(null=True, blank=True)
    rpe = models.PositiveSmallIntegerField(null=True, blank=True)  
    comments = models.TextField(null=True, blank=True)  
    suggested_warmup_pace = models.PositiveIntegerField(null=True, blank=True)  
    actual_warmup_pace = models.PositiveIntegerField(null=True, blank=True)  
    suggested_cooldown_pace = models.PositiveIntegerField(null=True, blank=True) 
    actual_cooldown_pace = models.PositiveIntegerField(null=True, blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True) 
    
    def __str__(self):
        return f"SavedRunningSession {self.id} - {self.workout.name}"
