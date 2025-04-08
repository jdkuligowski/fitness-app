import csv
from django.core.management.base import BaseCommand
from movements.models import Movement
from django.db import IntegrityError

CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - v1 database on app (21).csv"  

class Command(BaseCommand):
    help = "Update existing movements and insert new movements from CSV while preserving offline database IDs"

    def handle(self, *args, **kwargs):
        # Read the CSV file
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                movement_id = row.get("id")  # Get the movement ID

                if movement_id:
                    try:
                        movement = Movement.objects.get(id=movement_id)
                        self.update_movement(movement, row)
                        self.stdout.write(f"✅ Updated Movement ID {movement.id}.")
                    except Movement.DoesNotExist:
                        self.stdout.write(f"🆕 Movement ID {movement_id} not found. Creating new entry.")
                        self.create_new_movement(row, movement_id)  
                else:
                    self.stdout.write(f"⚠️ Skipping row: No ID provided.")

        self.stdout.write("✅ Update and insert process completed.")

    def update_movement(self, movement, row):
        """Update an existing Movement record with CSV data."""
        movement.body_area = row.get("body_area", movement.body_area)
        movement.movement = row.get("movement", movement.movement)
        movement.exercise = row.get("exercise", movement.exercise)
        movement.complexity = row.get("complexity", movement.complexity)
        movement.movement_type = row.get("movement_type", movement.movement_type)
        movement.inter_movements = row.get("inter_movements", movement.inter_movements)
        movement.advanced_movements = row.get("advanced_movements", movement.advanced_movements)
        movement.primary_body_part = row.get("primary_body_part", movement.primary_body_part)
        movement.high_level_equipment = row.get("high_level_equipment", movement.high_level_equipment)
        movement.detail_equipment = row.get("detail_equipment", movement.detail_equipment)
        movement.hiit_flag = row.get("hiit_flag", movement.hiit_flag)
        movement.pump_flag = row.get("pump_flag", movement.pump_flag)
        movement.landscape_video_url = row.get("landscape_video_url", movement.landscape_video_url)
        movement.portrait_video_url = row.get("portrait_video_url", movement.portrait_video_url)
        movement.landscape_thumbnail = row.get("landscape_thumbnail", movement.landscape_thumbnail)
        
        movement.save()

    def create_new_movement(self, row, movement_id):
        """Create a new Movement record with a manually assigned ID."""
        try:
            new_movement = Movement.objects.create(
                id=movement_id,  # Explicitly setting the ID
                body_area=row.get("body_area", ""),
                movement=row.get("movement", ""),
                exercise=row.get("exercise", ""),
                complexity=row.get("complexity", None),
                movement_type=row.get("movement_type", ""),
                inter_movements=row.get("inter_movements", ""),
                advanced_movements=row.get("advanced_movements", ""),
                primary_body_part=row.get("primary_body_part", ""),
                high_level_equipment=row.get("high_level_equipment", ""),
                detail_equipment=row.get("detail_equipment", ""),
                hiit_flag=row.get("hiit_flag", None),
                pump_flag=row.get("pump_flag", None),
                landscape_video_url=row.get("landscape_video_url", ""),
                portrait_video_url=row.get("portrait_video_url", ""),
                landscape_thumbnail=row.get("landscape_thumbnail", ""),
            )
            self.stdout.write(f"✅ Created new Movement with ID {new_movement.id}.")
        except IntegrityError:
            self.stdout.write(f"⚠️ Error: Movement ID {movement_id} already exists. Skipping duplicate.")
