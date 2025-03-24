import csv
from django.core.management.base import BaseCommand
from conditioning_summary.models import ConditioningOverview

# Path to your CSV file
CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - Conditioning Overview (1).csv"

class Command(BaseCommand):
    help = "Update or create ConditioningOverview records from a CSV file."

    def handle(self, *args, **options):
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                # Expecting columns like: id, name, movements, rest, notes
                cond_id = row.get("id")
                if not cond_id:
                    self.stdout.write(
                        self.style.WARNING("Row is missing 'id' field; skipping.")
                    )
                    continue

                # Pull CSV fields
                new_name = row.get("name", "")
                new_movements_str = row.get("movements", "0")
                new_rest_str = row.get("rest", "0")
                new_notes = row.get("notes", "")

                # Convert to int
                try:
                    new_movements = int(new_movements_str)
                except ValueError:
                    new_movements = 0

                try:
                    new_rest = int(new_rest_str)
                except ValueError:
                    new_rest = 0

                try:
                    # 1) Attempt to fetch an existing record by id
                    overview = ConditioningOverview.objects.get(id=cond_id)

                    # 2) If found, update fields
                    overview.name = new_name
                    overview.movements = new_movements
                    overview.rest = new_rest
                    overview.notes = new_notes
                    overview.save()

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Updated ConditioningOverview ID {overview.id} with "
                            f"name='{new_name}', movements={new_movements}, rest={new_rest}, "
                            f"notes='{new_notes[:30]}...' (truncated)"
                        )
                    )

                except ConditioningOverview.DoesNotExist:
                    # 3) If it doesn't exist, create a new record
                    overview = ConditioningOverview.objects.create(
                        id=cond_id,
                        name=new_name,
                        movements=new_movements,
                        rest=new_rest,
                        notes=new_notes
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Created new ConditioningOverview ID {overview.id} with "
                            f"name='{new_name}', movements={new_movements}, rest={new_rest}, "
                            f"notes='{new_notes[:30]}...' (truncated)"
                        )
                    )

        self.stdout.write(self.style.SUCCESS("Update process completed."))
