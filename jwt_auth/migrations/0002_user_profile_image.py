# Generated by Django 5.1.3 on 2024-12-19 17:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jwt_auth", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="profile_image",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
    ]
