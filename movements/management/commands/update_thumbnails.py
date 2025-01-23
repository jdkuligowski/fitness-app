import csv
from django.core.management.base import BaseCommand
from movements.models import Movement  

CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - v1 database on app (4).csv"  # Replace with the correct path

class Command(BaseCommand):
    help = "Update Movement table with landscape thumbnails"

    def handle(self, *args, **kwargs):
        # Read the CSV file
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                try:
                    # Fetch the Movement object by ID
                    movement = Movement.objects.get(id=row["id"])  # Match by ID
                    # Update the landscape_thumbnail field
                    movement.landscape_thumbnail = row.get("landscape_thumbnail", "")
                    movement.save()
                    self.stdout.write(
                        f"Updated Movement ID {movement.id} with landscape thumbnail."
                    )
                except Movement.DoesNotExist:
                    self.stdout.write(
                        f"Movement with ID {row['id']} does not exist. Skipping."
                    )

        self.stdout.write("Thumbnail update process completed.")
