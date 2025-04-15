from django.db import models

# Create your models here.
class MovementSummary(models.Model):
    owner = models.ForeignKey(
        'jwt_auth.User',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )
    movement = models.ForeignKey(
        'movements.Movement',
        on_delete=models.CASCADE,
        db_index=True
    )
    best_weight = models.FloatField(null=True, blank=True)
    best_reps = models.FloatField(null=True, blank=True)
    estimated_1rm = models.FloatField(null=True, blank=True)


    class Meta:
        unique_together = ('owner', 'movement')
