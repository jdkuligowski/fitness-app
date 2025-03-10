# Generated by Django 5.1.3 on 2025-02-07 12:53

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("saved_workouts", "0006_workout_activity_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="SavedHIITWorkout",
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
                (
                    "workout_type",
                    models.CharField(blank=True, max_length=20, null=True),
                ),
                ("structure", models.CharField(blank=True, max_length=20, null=True)),
                ("duration", models.PositiveIntegerField(blank=True, null=True)),
                ("rpe", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("comments", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "workout",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="hiit_sessions",
                        to="saved_workouts.workout",
                    ),
                ),
            ],
        ),
    ]
