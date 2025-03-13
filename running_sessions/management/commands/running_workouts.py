import csv
from django.core.management.base import BaseCommand
from running_sessions.models import RunningSession

# Point this to the CSV you showed that has:
# id, session_type, session_name, duration, warmup, cool_down, total_distance, notes
CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - Running Workouts (4).csv"

class Command(BaseCommand):
    help = "Import or update RunningSession rows from a CSV file."

    def handle(self, *args, **options):
        with open(CSV_FILE, mode="r", newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                try:
                    # Convert "id" from string to integer
                    session_id = int(row["id"])

                    # Convert warmup/cool_down/total_distance from string to float if present
                    warmup_distance = float(row["warmup"]) if row["warmup"] else None
                    cooldown_distance = float(row["cool_down"]) if row["cool_down"] else None
                    total_dist = float(row["total_distance"]) if row["total_distance"] else None

                    # We'll do get_or_create by the "id" primary key
                    obj, created = RunningSession.objects.get_or_create(
                        id=session_id,  # match the CSV's "id"
                        defaults={
                            "session_type": row["session_type"] or "",
                            "session_name": row["session_name"] or "",
                            "duration": row["duration"] or "",
                            "warmup_distance": warmup_distance,
                            "cool_down_distance": cooldown_distance,
                            "total_distance": total_dist,
                            "notes": row["notes"] or "",
                        },
                    )

                    if not created:
                        # Update existing fields
                        obj.session_type = row["session_type"] or ""
                        obj.session_name = row["session_name"] or ""
                        obj.duration = row["duration"] or ""
                        obj.warmup_distance = warmup_distance
                        obj.cool_down_distance = cooldown_distance
                        obj.total_distance = total_dist
                        obj.notes = row["notes"] or ""
                        obj.save()

                    action = "Created" if created else "Updated"
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"{action} RunningSession ID={session_id}: {obj.session_name}"
                        )
                    )

                except ValueError as ve:
                    self.stdout.write(self.style.WARNING(f"Error parsing numeric fields in row: {row} => {ve}"))
                except KeyError as ke:
                    self.stdout.write(self.style.WARNING(f"Missing column {ke} in CSV row: {row}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Unexpected error for row {row}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Import/Update of RunningSession completed."))
