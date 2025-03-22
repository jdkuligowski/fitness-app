from django.db import models


class ScheduledNotification(models.Model):
    owner = models.ForeignKey(
        'jwt_auth.User',
        related_name='notifications',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )
    workout = models.ForeignKey(
        'saved_workouts.Workout',
        related_name='notifications',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )    
    scheduled_datetime = models.DateTimeField()
    sent = models.BooleanField(default=False)
    canceled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=255, blank=True)
    subtitle = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    cleared_by_user = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} -> {self.scheduled_datetime} (sent={self.sent}, canceled={self.canceled})"
