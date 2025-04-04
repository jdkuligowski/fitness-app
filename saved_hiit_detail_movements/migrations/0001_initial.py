# Generated by Django 5.1.3 on 2025-02-07 12:53

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("movements", "0005_movement_landscape_thumbnail"),
        ("saved_hiit_details", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SavedHIITMovement",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("exercise_name", models.CharField(max_length=150)),
                ("order", models.PositiveIntegerField()),
                ("rest_period", models.BooleanField(default=False)),
                (
                    "block",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="hiit_movements",
                        to="saved_hiit_details.savedhiitdetails",
                    ),
                ),
                (
                    "movements",
                    models.ForeignKey(
                        blank=True,
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="hiit_movement_details",
                        to="movements.movement",
                    ),
                ),
            ],
        ),
    ]
