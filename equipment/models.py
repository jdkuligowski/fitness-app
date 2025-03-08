from django.db import models

class Equipment(models.Model):
    equipment_name = models.CharField(max_length=50, unique=True)  # Example: "Dumbbell", "Barbell", etc.

    def __str__(self):
        return self.equipment_name
