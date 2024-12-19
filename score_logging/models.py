from django.db import models
from django.utils.timezone import now

# Create your models here.
class ScoreLog(models.Model):
    user = models.ForeignKey (
        'jwt_auth.User', 
        on_delete=models.CASCADE, 
        related_name='score_logs'
    )
    score_type = models.CharField(max_length=50) 
    score_value = models.IntegerField() 
    timestamp = models.DateTimeField(default=now)
    workout_id = models.IntegerField(blank=True, null=True)  
    section_movement_id = models.IntegerField(blank=True, null=True)


    def __str__(self):
        return f"{self.user.username} - {self.score_type} - {self.score_value} points"
