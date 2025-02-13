# Generated by Django 5.1.3 on 2024-12-08 14:41

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("movements", "0001_initial"),
        ("workout_section_movement", "0002_rename_movement_sectionmovement_movements"),
    ]

    operations = [
        migrations.AlterField(
            model_name="sectionmovement",
            name="movements",
            field=models.ForeignKey(
                blank=True,
                default=None,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="movement_details",
                to="movements.movement",
            ),
        ),
    ]
