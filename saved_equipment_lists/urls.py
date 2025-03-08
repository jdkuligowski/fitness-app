# urls.py
from django.urls import path
from .views import ( ListAllEquipmentFilters, CreateSingleEquipmentFilter, GetSingleEquipmentFilter, UpdateSingleEquipmentFilter, DeleteEquipmentFilter )

urlpatterns = [
    # GET /api/equipment-filters/list?user_id=...
    path("get_all", ListAllEquipmentFilters.as_view(), name="list-equipment-filters"),

    # POST /api/equipment-filters/create?user_id=...
    path("create", CreateSingleEquipmentFilter.as_view(), name="create-equipment-filter"),

    # GET /api/equipment-filters/<int:filter_id>/retrieve?user_id=...
    path("<int:filter_id>/get", GetSingleEquipmentFilter.as_view(), name="retrieve-equipment-filter"),

    # PUT /api/equipment-filters/<int:filter_id>/update?user_id=...
    path("<int:filter_id>/update", UpdateSingleEquipmentFilter.as_view(), name="update-equipment-filter"),

    # DELETE /api/equipment-filters/<int:filter_id>/delete?user_id=...
    path("<int:filter_id>/delete", DeleteEquipmentFilter.as_view(), name="delete-equipment-filter"),
]
