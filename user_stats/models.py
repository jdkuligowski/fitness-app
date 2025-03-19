from django.db import models


class UserStats(models.Model):
    owner = models.OneToOneField(
        'jwt_auth.User',
        related_name='user_stats',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )
    # Body-part breakdown for each timeframe
    weekly_body_part = models.JSONField(default=dict)
    monthly_body_part = models.JSONField(default=dict)
    yearly_body_part = models.JSONField(default=dict)

    # Activity-type breakdown for each timeframe
    weekly_activity_type = models.JSONField(default=dict)
    monthly_activity_type = models.JSONField(default=dict)
    yearly_activity_type = models.JSONField(default=dict)

    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Stats for user {self.owner.username}"
