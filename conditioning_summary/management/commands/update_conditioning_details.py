import csv
from django.core.management.base import BaseCommand
from conditioning_summary.models import ConditioningOverview
from conditioning_details.models import ConditioningDetail

# Example CSV path – adjust as needed
CSV_FILE = "/Users/jameskuligowski/Downloads/Movement Database.xlsx - Conditioning Details.csv"

class Command(BaseCommand):
    help = "Create or update ConditioningDetail records from a CSV file."

    def handle(self, *args, **options):
        with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                # 1) Extract fields
                raw_detail_id = row.get("id", "").strip()  # primary key for detail
                raw_overview_id = row.get("conditioning_overview_id", "").strip()
                raw_movement_order = row.get("movement_order", "0")
                exercise = row.get("exercise", "")
                detail_str = row.get("detail", "")

                # 2) Try to find the referenced ConditioningOverview
                if not raw_overview_id:
                    self.stdout.write(
                        self.style.WARNING("Row missing conditioning_overview_id – skipping.")
                    )
                    continue

                try:
                    overview_id = int(raw_overview_id)
                except ValueError:
                    self.stdout.write(
                        self.style.WARNING(
                            f"conditioning_overview_id '{raw_overview_id}' is not an integer – skipping."
                        )
                    )
                    continue

                try:
                    overview = ConditioningOverview.objects.get(id=overview_id)
                except ConditioningOverview.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"No ConditioningOverview found with ID {overview_id}; skipping detail."
                        )
                    )
                    continue

                # 3) Convert movement_order to int
                try:
                    movement_order = int(raw_movement_order)
                except ValueError:
                    movement_order = 0

                # 4) Create or update ConditioningDetail
                # If 'detail_id' column is empty, we create a new row 
                # with auto-incremented primary key
                if raw_detail_id:
                    # If there's a detail_id, try to update or create with that ID
                    try:
                        detail_id = int(raw_detail_id)
                    except ValueError:
                        self.stdout.write(
                            self.style.WARNING(
                                f"detail_id '{raw_detail_id}' is invalid – skipping row."
                            )
                        )
                        continue

                    try:
                        cond_detail = ConditioningDetail.objects.get(id=detail_id)
                        # Update existing
                        cond_detail.conditioning_overview = overview
                        cond_detail.movement_order = movement_order
                        cond_detail.exercise = exercise
                        cond_detail.detail = detail_str
                        cond_detail.save()

                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Updated ConditioningDetail ID={detail_id} -> "
                                f"overview={overview.id}, order={movement_order}, "
                                f"exercise='{exercise}', detail='{detail_str[:30]}...' (truncated)"
                            )
                        )

                    except ConditioningDetail.DoesNotExist:
                        # Create new record with that explicit ID
                        cond_detail = ConditioningDetail.objects.create(
                            id=detail_id,
                            conditioning_overview=overview,
                            movement_order=movement_order,
                            exercise=exercise,
                            detail=detail_str
                        )
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Created new ConditioningDetail ID={cond_detail.id} -> "
                                f"overview={overview.id}, order={movement_order}, "
                                f"exercise='{exercise}', detail='{detail_str[:30]}...' (truncated)"
                            )
                        )
                else:
                    # No 'detail_id' => create new row letting DB handle auto ID
                    cond_detail = ConditioningDetail.objects.create(
                        conditioning_overview=overview,
                        movement_order=movement_order,
                        exercise=exercise,
                        detail=detail_str
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Created new ConditioningDetail with auto ID={cond_detail.id} -> "
                            f"overview={overview.id}, order={movement_order}, "
                            f"exercise='{exercise}', detail='{detail_str[:30]}...' (truncated)"
                        )
                    )

        self.stdout.write(self.style.SUCCESS("ConditioningDetail update process completed."))
