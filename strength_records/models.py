# app/models.py
from django.db import models
from django.conf import settings
import datetime

class StrengthSet(models.Model):
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
    workout = models.ForeignKey(
        'saved_workouts.Workout',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    performed_date = models.DateField(db_index=True, default=datetime.date.today)
    set_number = models.PositiveSmallIntegerField(null=True, blank=True)
    reps = models.PositiveSmallIntegerField(default=0)
    weight = models.FloatField(default=0)
    rpe = models.FloatField(default=0)

    # total load (weight * reps)
    load = models.FloatField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.weight and self.reps:
            self.load = self.weight * self.reps
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.first_name} - {self.movement.exercise} on {self.performed_date}"
