# Generated by Django 5.1.3 on 2025-01-05 13:32

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("running_sessions", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RunningInterval",
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
                ("repeat_variation", models.SmallIntegerField()),
                ("repeats", models.PositiveIntegerField()),
                ("repeat_distance", models.FloatField(blank=True, null=True)),
                ("target_pace", models.CharField(max_length=20)),
                ("rest_time", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="intervals",
                        to="running_sessions.runningsession",
                    ),
                ),
            ],
        ),
    ]