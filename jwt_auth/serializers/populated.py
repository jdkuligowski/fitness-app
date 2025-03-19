from jwt_auth.serializers.common import UserSerializer
from rest_framework import serializers 

from django.contrib.auth import get_user_model
User = get_user_model()

from saved_workouts.serializers.common import WorkoutSerializer
from saved_workouts.serializers.populated import PopulatedWorkoutSerializer
from leaderboard.serializers.common import LeaderboardSerializer
from saved_equipment_lists.serializers.common import SavedEquipmentFilterSerializer
from notifications.serializers.common import NotificationSerializer
from user_stats.serializers.common import UserStatsSerializer

# define our own serializer class - this is generic and will return all fields from the Review model
class PopulatedUserSerializer(UserSerializer):
    saved_workouts = PopulatedWorkoutSerializer(many=True)
    leaderboard = LeaderboardSerializer()
    equipment_filters = SavedEquipmentFilterSerializer(many=True)
    notifications = NotificationSerializer(many=True)
    user_stats = UserStatsSerializer()

    class Meta:
        model = User
        fields = '__all__'
        
        
# define our own serializer class - this is generic and will return all fields from the Review model
class SimplifiedPopulatedUserSerializer(UserSerializer):
    saved_workouts = WorkoutSerializer(many=True)
    leaderboard = LeaderboardSerializer()
    user_stats = UserStatsSerializer()
    
    class Meta:
        model = User
        fields = '__all__'