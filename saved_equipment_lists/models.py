from django.db import models

class SavedEquipmentFilter(models.Model):
    filter_name = models.CharField(max_length=100, unique=True)  # e.g. "Home Gym", "Gym Setup"
    equipment = models.ManyToManyField(
        "equipment.Equipment", 
        related_name="saved_filters")  
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(
        'jwt_auth.User',
        related_name='equipment_filters',
        on_delete=models.CASCADE,
        default=None,
        blank=True,
        null=True,
        db_index=True 
    )
    class Meta:
        unique_together = ('owner', 'filter_name')


    def __str__(self):
        return f"{self.user.username} - {self.filter_name}"
