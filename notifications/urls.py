from django.urls import path
from .views import SetExpoToken, NotificationsListView, NotificationsClearView

urlpatterns = [
    path('set_token/', SetExpoToken.as_view(), name='set-expo-token'),
    path('list/', NotificationsListView.as_view(), name='list-notifications'),
    path('clear/', NotificationsClearView.as_view(), name='clear-notifications'),
]