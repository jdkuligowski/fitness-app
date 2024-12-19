from django.db import models

# Create your models here.
class Workout(models.Model):
    workout_number = models.FloatField(default=None, null=True, blank=True)
    name = models.CharField(max_length=30, null=True, blank=True)
    description = models.CharField(max_length=150, null=True, blank=True)
    status = models.CharField(max_length=15, null=True, blank=True, db_index=True)
    complexity = models.SmallIntegerField(default=None, null=True, blank=True)
    duration = models.SmallIntegerField(default=None, null=True, blank=True)
    comments = models.CharField(max_length=150, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_date = models.DateField(null=True, blank=True, db_index=True)
    scheduled_date = models.DateField(null=True, blank=True)
    owner = models.ForeignKey(
        'jwt_auth.User',
        related_name='saved_workouts',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )

    # def save(self, *args, **kwargs):
    #     # Update the relevant date field based on status
    #     if self.status == 1 and not self.completed_date:
    #         self.completed_date = models.DateTimeField.now()
    #     elif self.status == 2 and not self.scheduled_date:
    #         self.scheduled_date = models.DateTimeField.now()
    #     super().save(*args, **kwargs)

    # def __str__(self):
    #     return self.name

