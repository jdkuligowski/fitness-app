import csv
from django.core.management.base import BaseCommand
from movements.models import Movement  

CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - v1 database on app (18).csv"  # Replace with the correct path

class Command(BaseCommand):
    help = "Update Movement table with video URLs"

    def handle(self, *args, **kwargs):
        # Read the CSV file
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                try:
                    movement = Movement.objects.get(id=row["id"])  # Match by ID
                    movement.landscape_video_url = row.get("landscape_video_url", "")
                    movement.portrait_video_url = row.get("portrait_video_url", "")
                    movement.landscape_thumbnail = row.get("landscape_thumbnail", "")
                    movement.save()
                    self.stdout.write(
                        f"Updated Movement ID {movement.id} with video URLs."
                    )
                except Movement.DoesNotExist:
                    self.stdout.write(
                        f"Movement with ID {row['id']} does not exist. Skipping."
                    )

        self.stdout.write("Update process completed.")
