from django.db import models

class SavedMobilitySession(models.Model):
    workout = models.ForeignKey(
        'saved_workouts.Workout',
        related_name='mobility_sessions',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True,
    )
    number_of_movements = models.FloatField(null=True, blank=True)  
    session_video = models.CharField(max_length=256, null=True, blank=True)  
    rpe = models.PositiveSmallIntegerField(null=True, blank=True)  
    comments = models.TextField(null=True, blank=True)  
    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True) 
    
