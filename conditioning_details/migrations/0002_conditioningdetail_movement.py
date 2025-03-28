# Generated by Django 5.1.3 on 2025-01-27 17:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("conditioning_details", "0001_initial"),
        ("movements", "0005_movement_landscape_thumbnail"),
    ]

    operations = [
        migrations.AddField(
            model_name="conditioningdetail",
            name="movement",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="conditioning_details",
                to="movements.movement",
            ),
        ),
    ]
