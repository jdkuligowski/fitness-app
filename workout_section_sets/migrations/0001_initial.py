# Generated by Django 5.1.3 on 2024-12-05 14:37

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("workout_section_movement", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Set",
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
                    "set_number",
                    models.SmallIntegerField(blank=True, default=None, null=True),
                ),
                ("reps", models.SmallIntegerField(blank=True, default=None, null=True)),
                ("weight", models.FloatField(blank=True, default=None, null=True)),
                (
                    "section_movement",
                    models.ForeignKey(
                        blank=True,
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workout_sets",
                        to="workout_section_movement.sectionmovement",
                    ),
                ),
            ],
        ),
    ]
