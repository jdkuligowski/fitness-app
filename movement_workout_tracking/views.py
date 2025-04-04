# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Max
from django.db import transaction

import re
from .models import GeneratedWorkoutPlan, MovementUsage

class StoreWorkoutPlansView(APIView):
    """
    1) Finds current max request_number from GeneratedWorkoutPlan
    2) request_num = max + 1
    3) Creates 10 new plan rows with that request_num
    4) Updates MovementUsage as usual
    """
    @transaction.atomic
    def post(self, request):
        data = request.data

        required_fields = [
            "selectedWorkout", "selectedTime", "complexity",
            "selectedFinish", "equipmentFilter", "candidatePlans", "userEmail"
        ]
        missing = [f for f in required_fields if f not in data]
        if missing:
            return Response(
                {"error": f"Missing fields: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        selected_workout = data["selectedWorkout"]
        selected_time = data["selectedTime"]
        complexity = data["complexity"]
        selected_finish = data["selectedFinish"]
        equipment_filter = data["equipmentFilter"]
        all_plans = data["candidatePlans"]
        user_email = data["userEmail"]

        # 1) Determine new request_number by checking the max
        #    We'll do it in an atomic block to reduce the race window,
        #    but there's still a small concurrency risk if you have multiple servers etc.
        current_max = GeneratedWorkoutPlan.objects.aggregate(mx=Max('request_number'))['mx'] or 0
        new_request_number = current_max + 1

        warmup_regex = re.compile(r"warm\s*up", re.IGNORECASE)

        def set_strong(plan_data, sub, movements):
            col_name = f"strong_{sub}"
            if col_name in plan_data:
                plan_data[col_name] = ",".join(movements)

        def set_build(plan_data, sub, movements):
            if sub not in ["1","2"]:
                return
            for i, mov in enumerate(movements[:2]):
                col_name = f"build_{sub}_movement_{i+1}"
                plan_data[col_name] = mov

        def set_pump(plan_data, sub, movements):
            if sub not in ["1","2"]:
                return
            for i, mov in enumerate(movements[:2]):
                col_name = f"pump_{sub}_movement_{i+1}"
                plan_data[col_name] = mov

        usage_increments = {}
        plan_objs = []
        created_count = 0

        # Build plan data
        for plan_sections in all_plans:
            plan_data = {
                "workout_type": selected_workout,
                "duration": selected_time,
                "complexity": complexity,
                "finish_type": selected_finish,
                "request_number": new_request_number,  # store it here

                "strong_1": "",
                "strong_2": "",
                "build_1_movement_1": "",
                "build_1_movement_2": "",
                "build_2_movement_1": "",
                "build_2_movement_2": "",
                "pump_1_movement_1": "",
                "pump_1_movement_2": "",
                "pump_2_movement_1": "",
                "pump_2_movement_2": "",
            }

            for section in plan_sections:
                label = section.get("partLabel","")
                if warmup_regex.search(label):
                    continue
                movements = section.get("movements", [])
                splitted = label.split()
                if len(splitted) < 2:
                    continue

                cat_lower = splitted[0].lower()
                sub = splitted[1]

                if cat_lower == "strong":
                    set_strong(plan_data, sub, movements)
                elif cat_lower == "build":
                    set_build(plan_data, sub, movements)
                elif cat_lower == "pump":
                    set_pump(plan_data, sub, movements)

                full_label = splitted[0].capitalize() + " " + sub
                for mov in movements:
                    key = (mov, full_label, selected_workout, selected_time)
                    usage_increments[key] = usage_increments.get(key, 0) + 1

            plan_objs.append(GeneratedWorkoutPlan(**plan_data))
            created_count += 1

        # Bulk create plan rows
        GeneratedWorkoutPlan.objects.bulk_create(plan_objs)

        # Bulk update usage
        movements_list = [k[0] for k in usage_increments.keys()]
        existing_objs = MovementUsage.objects.filter(
            workout_type=selected_workout,
            workout_time=selected_time,
            movement__in=movements_list
        )
        existing_map = {}
        for obj in existing_objs:
            rowkey = (obj.movement, obj.category, obj.workout_type, obj.workout_time)
            existing_map[rowkey] = obj

        new_objs = []
        update_objs = []
        usage_updated = 0

        for key, increment in usage_increments.items():
            (movement_name, label_full, wtype, wtime) = key
            if key in existing_map:
                obj = existing_map[key]
                obj.usage_count += increment
                update_objs.append(obj)
                usage_updated += increment
            else:
                # new usage row
                new_obj = MovementUsage(
                    movement=movement_name,
                    category=label_full,
                    workout_type=wtype,
                    workout_time=wtime,
                    usage_count=increment
                )
                new_objs.append(new_obj)
                usage_updated += increment

        MovementUsage.objects.bulk_create(new_objs)
        MovementUsage.objects.bulk_update(update_objs, ['usage_count'])

        return Response({
            "message": f"Request #{new_request_number}: stored {created_count} plan(s), updated usage {usage_updated} times",
            "userEmail": user_email,
            "equipmentFilter": equipment_filter
        }, status=200)
