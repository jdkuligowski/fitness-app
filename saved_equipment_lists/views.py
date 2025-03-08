# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from django.contrib.auth import get_user_model

from .models import SavedEquipmentFilter
from equipment.models import Equipment
from .serializers.common import SavedEquipmentFilterSerializer

User = get_user_model()

class ListAllEquipmentFilters(APIView):
    """
    GET: Return all saved filters for a user specified by user_id in query params.
    """
    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, pk=user_id)
        filters = SavedEquipmentFilter.objects.filter(user=user)
        serializer = SavedEquipmentFilterSerializer(filters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateSingleEquipmentFilter(APIView):
    """
    POST: Create a new SavedEquipmentFilter for a user specified by user_id in query params.
    """
    def post(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, pk=user_id)

        filter_name = request.data.get("name")          # e.g. "Home Gym"
        equipment_names = request.data.get("equipmentIds", [])  
        # e.g. ["barbell", "dumbbells", "bands"]

        if not filter_name:
            return Response({"error": "Filter name is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate name (per user)
        if SavedEquipmentFilter.objects.filter(owner=user, filter_name=filter_name).exists():
            return Response({"error": "Filter with this name already exists for this user."},
                            status=status.HTTP_400_BAD_REQUEST)

        # 1) Create the filter
        saved_filter = SavedEquipmentFilter.objects.create(
            owner=user,
            filter_name=filter_name
        )

        # 2) Query Equipment by "equipment_name" (not ID).
        #    This assumes your Equipment table has rows named exactly "barbell", "dumbbells", etc.
        equipment_qs = Equipment.objects.filter(equipment_name__in=equipment_names)
        # Optional: check if some of them didn’t exist
        found_names = list(equipment_qs.values_list("equipment_name", flat=True))
        missing = [ename for ename in equipment_names if ename not in found_names]
        if missing:
            # You can handle missing equipment or just ignore
            # e.g. "We didn't find these: ..." or skip them
            pass

        # 3) Attach them to the filter
        saved_filter.equipment.set(equipment_qs)
        saved_filter.save()

        # 4) Return result
        serializer = SavedEquipmentFilterSerializer(saved_filter)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



class GetSingleEquipmentFilter(APIView):
    """
    GET: Retrieve a single filter by filter_id & user_id.
    """
    def get(self, request, filter_id):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, pk=user_id)
        saved_filter = get_object_or_404(SavedEquipmentFilter, pk=filter_id, user=user)

        serializer = SavedEquipmentFilterSerializer(saved_filter)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateSingleEquipmentFilter(APIView):
    """
    PUT: Update name/equipment for an existing filter (by filter_id & user_id).
    """
    def put(self, request, filter_id):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, pk=user_id)
        saved_filter = get_object_or_404(SavedEquipmentFilter, pk=filter_id, user=user)

        name = request.data.get("name", saved_filter.name)
        equipment_ids = request.data.get("equipmentIds", [])

        # Check uniqueness if changing the name
        if (SavedEquipmentFilter.objects
             .filter(user=user, name=name)
             .exclude(pk=saved_filter.pk)
             .exists()):
            return Response({"error": "Filter name must be unique for this user."},
                            status=status.HTTP_400_BAD_REQUEST)

        saved_filter.name = name
        equipment_qs = Equipment.objects.filter(id__in=equipment_ids)
        saved_filter.equipment.set(equipment_qs)
        saved_filter.save()

        serializer = SavedEquipmentFilterSerializer(saved_filter)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeleteEquipmentFilter(APIView):
    """
    DELETE: Remove an existing filter (by filter_id & user_id).
    """
    def delete(self, request, filter_id):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, pk=user_id)
        saved_filter = get_object_or_404(SavedEquipmentFilter, pk=filter_id, user=user)

        saved_filter.delete()
        return Response({"message": "Filter deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
