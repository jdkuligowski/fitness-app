from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, F

from .models import Movement
from .serializers.common import MovementSerializer
from .serializers.common import MovementSerializer
from saved_equipment_lists.models import SavedEquipmentFilter
from equipment_movements.models import EquipmentMovement

from django.core.mail import send_mail
import json



class MovementList(APIView):
    permission_classes = [AllowAny]  # Make this view publicly accessible

    def get(self, request):
        movements = Movement.objects.all()  # Fetch all Movement records
        if not movements:
            return Response({'message': 'No movements found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MovementSerializer(movements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class FilteredMovements(APIView):
    def get(self, request):
        filter_id = request.query_params.get("filter_id")
        if not filter_id:
            return Response(
                {"error": "filter_id query param is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        saved_filter = get_object_or_404(SavedEquipmentFilter, pk=filter_id)
        user_equipment_ids = list(saved_filter.equipment.values_list("id", flat=True))

        #
        # 1) PREPARE TWO KINDS OF COMBOS:
        #
        # A) Bodyweight combos => eq_needed=0
        # B) Covered combos => eq_needed=eq_have
        #
        bodyweight_combos = EquipmentMovement.objects.annotate(
            eq_needed=Count('equipment', distinct=True)
        ).filter(eq_needed=0)

        # If user has equipment, compute "covered combos"
        if user_equipment_ids:
            covered_combos = EquipmentMovement.objects.annotate(
                eq_needed=Count('equipment', distinct=True),
                eq_have=Count(
                    'equipment',
                    filter=Q(equipment__id__in=user_equipment_ids),
                    distinct=True
                )
            ).filter(eq_needed=F('eq_have'))
        else:
            covered_combos = EquipmentMovement.objects.none()  # No covered combos if no user equipment

        #
        # 2) BUILD THE MOVEMENT QUERY
        #
        # If user’s equipment is empty -> we only want movements that have at least one bodyweight combo
        # If user’s equipment is non-empty -> we want movements with either a covered combo OR a bodyweight combo
        #
        if not user_equipment_ids:
            # Bodyweight-only
            feasible_movements = Movement.objects.filter(
                equipment_combos__in=bodyweight_combos
            ).distinct()
        else:
            # Bodyweight + combos user can do
            feasible_movements = Movement.objects.filter(
                Q(equipment_combos__in=covered_combos) |
                Q(equipment_combos__in=bodyweight_combos)
            ).distinct()

        serializer = MovementSerializer(feasible_movements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)





# class NoPlanEmailView(APIView):
#     def post(self, request):
#         data = request.data

#         required_fields = [
#             "selectedWorkout",
#             "selectedTime",
#             "complexity",
#             "selectedFinish",
#             "equipmentFilter",
#             "candidatePlans"
#         ]
#         for field in required_fields:
#             if field not in data:
#                 return Response(
#                     {"error": f"'{field}' is required"},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#         # Convert candidatePlans to a nicely formatted JSON string
#         plans_str = json.dumps(data.get("candidatePlans"), indent=2)

#         subject = "Burst Alert: No strength plan generated"
#         body = (
#             "A user could not generate a workout plan with the following details:\n\n"
#             f"Selected Workout: {data.get('selectedWorkout')}\n"
#             f"Selected Time: {data.get('selectedTime')}\n"
#             f"Complexity: {data.get('complexity')}\n"
#             f"Selected Finish: {data.get('selectedFinish')}\n"
#             f"Equipment Filter: {data.get('equipmentFilter')}\n\n"
#             f"Workouts provided:\n{plans_str}"
#         )

#         send_mail(
#             subject,
#             body,
#             "jdkuligowski@gmail.com",      # or a valid 'from_email'
#             ["jdkuligowski@gmail.com"],    # recipients
#             fail_silently=False,
#         )

#         return Response({"message": "No-plan email sent successfully"}, status=status.HTTP_200_OK)


import re
from django.utils.html import format_html

# import re
# from django.core.mail import send_mail
# from django.utils.html import format_html
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status

class NoPlanEmailView(APIView):
    """
    POST endpoint to send a "no plan" email with a fixed-order table.
    Expects:
    {
      "selectedWorkout": "Strength",
      "selectedTime": 40,
      "complexity": "Intermediate",
      "selectedFinish": "Conditioning",
      "equipmentFilter": "...",
      "candidatePlans": [
         [
           {"partLabel":"Warm Up A","movements":["Jog"]},
           {"partLabel":"Strong 1","movements":["Deadlift","Lunge"]},
           {"partLabel":"Pump 1","movements":["Bicep Curl"]},
         ],
         ...
      ]
    }
    """

    def post(self, request):
        data = request.data

        required_fields = [
            "selectedWorkout",
            "selectedTime",
            "complexity",
            "selectedFinish",
            "equipmentFilter",
            "candidatePlans"
        ]
        for field in required_fields:
            if field not in data:
                return Response(
                    {"error": f"'{field}' is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 1) Gather the user’s submitted data
        selected_workout = data["selectedWorkout"]
        selected_time = data["selectedTime"]
        complexity = data["complexity"]
        selected_finish = data["selectedFinish"]
        equipment_filter = data["equipmentFilter"]
        all_plans = data["candidatePlans"]  # array of "plans"

        # 2) We define the EXACT order we want from left to right:
        LABEL_ORDER = ["Strong 1", "Strong 2",
                       "Build 1", "Build 2",
                       "Pump 1", "Pump 2"]

        # 3) Build the table header cells in that order
        # e.g. <th>Strong 1</th><th>Strong 2</th>...
        header_cells = "".join([f"<th>{label}</th>" for label in LABEL_ORDER])
        # We'll also have a "Plan #" column at the start
        table_header_html = f"<tr><th>Plan #</th>{header_cells}</tr>"

        # We'll skip sections that contain "warm" (for warm-ups)
        warmup_regex = re.compile(r"warm\s*up", re.IGNORECASE)

        # 4) Build table rows: one row per plan
        body_rows = []
        for idx, plan in enumerate(all_plans):
            # “plan” is a list of sections: [ {"partLabel":"Strong 1","movements":[...]} ... ]
            # create a dict: label-> list_of_movements
            label_to_movs = {}

            for section in plan:
                label = section.get("partLabel","")
                # ignore warm-ups
                if warmup_regex.search(label):
                    continue
                # store the movements list
                label_to_movs[label] = section.get("movements", [])

            # Now we create a <td> for each of the LABEL_ORDER items
            row_tds = []
            for label in LABEL_ORDER:
                if label in label_to_movs:
                    movs = label_to_movs[label]
                    if movs:
                        # We can show bullet points
                        bullet_list = "<ul>" + "".join(f"<li>{m}</li>" for m in movs) + "</ul>"
                        row_tds.append(f"<td>{bullet_list}</td>")
                    else:
                        # If label is present but no movements, highlight
                        row_tds.append("<td style='background-color:#fdd;'>No Movements</td>")
                else:
                    # If the plan has no such label at all
                    row_tds.append("<td style='background-color:#fdd;'>N/A</td>")

            # final row for this plan
            row_html = f"<tr><td>Plan {idx+1}</td>{''.join(row_tds)}</tr>"
            body_rows.append(row_html)

        table_body_html = "".join(body_rows)

        # 5) Combine into a final <table>
        table_html = f"""
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>{table_header_html}</thead>
          <tbody>{table_body_html}</tbody>
        </table>
        """

        # 6) Build the rest of your message + incorporate table_html
        subject = "Burst Alert: No strength plan generated"
        top_msg = f"""
        <p>A user could not generate a workout plan with the following details:</p>
        <ul>
          <li><b>Selected Workout</b>: {selected_workout}</li>
          <li><b>Selected Time</b>: {selected_time}</li>
          <li><b>Complexity</b>: {complexity}</li>
          <li><b>Selected Finish</b>: {selected_finish}</li>
          <li><b>Equipment Filter</b>: {equipment_filter}</li>
        </ul>
        <p><strong>Candidate Plans:</strong></p>
        """

        # final HTML
        html_body = top_msg + table_html

        # 7) Send the email with html_message
        send_mail(
            subject=subject,
            message="",  # plain-text version blank
            from_email="no-reply@myapp.com",
            recipient_list=["jdkuligowski@gmail.com"],
            html_message=html_body,
            fail_silently=False,
        )

        return Response({"message": "No-plan email sent successfully"}, status=200)
