# Generated by Django 5.1.3 on 2025-02-07 14:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("saved_hiit_details", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="savedhiitdetails",
            old_name="hiit_details",
            new_name="hiit_workout",
        ),
    ]
