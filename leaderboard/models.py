from django.db import models
from django.utils.timezone import now

class Leaderboard(models.Model):
    user = models.OneToOneField (
        'jwt_auth.User', 
        on_delete=models.CASCADE, 
        related_name='leaderboard', 
        db_index=True
    )
    total_score = models.IntegerField(default=0, db_index=True)
    weekly_score = models.IntegerField(default=0) 
    monthly_score = models.IntegerField(default=0) 
    total_rank = models.IntegerField(default=0)  
    weekly_rank = models.IntegerField(default=0)
    monthly_rank = models.IntegerField(default=0) 
    last_updated = models.DateTimeField(auto_now=True)  # Last time the score was updated

    def __str__(self):
        return f"{self.user.username} - Total Score: {self.total_score}, Weekly Score: {self.weekly_score}"
