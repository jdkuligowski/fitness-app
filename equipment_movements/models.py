from django.db import models

# Create your models here.
class EquipmentMovement(models.Model):
    movement = models.ForeignKey(
        'movements.Movement', 
        related_name="equipment_combos",
        on_delete=models.CASCADE,
        null=True,
        blank=True
        )
    equipment = models.ManyToManyField('equipment.Equipment') 
    combo_label = models.CharField(max_length=200, blank=True, null=True) 
    
    def __str__(self):
        return f"{self.movement.exercise} ({self.combo_label})"
