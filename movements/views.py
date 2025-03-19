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

class MovementList(APIView):
    permission_classes = [AllowAny]  # Make this view publicly accessible

    def get(self, request):
        movements = Movement.objects.all()  # Fetch all Movement records
        if not movements:
            return Response({'message': 'No movements found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MovementSerializer(movements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



# class FilteredMovements(APIView):
#     """
#     GET: Return only the movements that the user can do, given filter_id.
#     Example: GET /api/movements/filtered?filter_id=123
#     """
#     def get(self, request):
#         filter_id = request.query_params.get("filter_id")
#         if not filter_id:
#             return Response({"error": "filter_id query param is required."}, status=status.HTTP_400_BAD_REQUEST)

#         # 1) Grab the user filter
#         saved_filter = get_object_or_404(SavedEquipmentFilter, pk=filter_id)
#         user_equipment_ids = set(saved_filter.equipment.values_list("id", flat=True))

#         # 2) Gather all movements
#         all_movements = Movement.objects.all()

#         # 3) Filter them via combos logic
#         feasible = []
#         for movement in all_movements:
#             # We'll check if ANY combo is satisfied
#             combos = movement.equipment_combos.all()
#             can_do = False
#             for combo in combos:
#                 combo_eq_ids = set(combo.equipment.values_list("id", flat=True))
#                 # If user_equipment_ids covers combo_eq_ids => we have a match
#                 if combo_eq_ids.issubset(user_equipment_ids):
#                     can_do = True
#                     break
#             # If can_do or if no combos at all => maybe treat as bodyweight
#             # Decide how you handle movements with no combos
#             if can_do or not combos.exists():
#                 feasible.append(movement)

#         serializer = MovementSerializer(feasible, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

# class FilteredMovements(APIView):
#     def get(self, request):
#         filter_id = request.query_params.get("filter_id")
#         if not filter_id:
#             return Response({"error": "filter_id query param is required."},
#                             status=status.HTTP_400_BAD_REQUEST)

#         # 1) Get the user filter
#         saved_filter = get_object_or_404(SavedEquipmentFilter, pk=filter_id)
#         user_equipment_ids = list(saved_filter.equipment.values_list("id", flat=True))

#         # 2) Find all combos fully covered by user_equipment_ids
#         #    i.e. the user has all items in the combo
#         covered_combos = EquipmentMovement.objects.annotate(
#             eq_needed=Count('equipment', distinct=True),
#             eq_have=Count(
#                 'equipment',
#                 filter=Q(equipment__id__in=user_equipment_ids),
#                 distinct=True
#             )
#         ).filter(eq_needed=F('eq_have'))

#         # 3) We want movements that:
#         #    (A) have at least one "covered" combo
#         #        OR
#         #    (B) have no combos at all => treat as "bodyweight"
#         feasible_movements = Movement.objects.filter(
#             Q(equipment_combos__in=covered_combos)
#             | Q(equipment_combos__isnull=True)
#         ).distinct()

#         # 4) Serialize and return
#         serializer = MovementSerializer(feasible_movements, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

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
