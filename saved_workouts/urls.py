from django.urls import path
from .views import SaveWorkoutView, GetAllWorkoutsView, GetSingleWorkoutView, UpdateWorkoutStatusView, DeleteWorkoutView, UpdateWorkoutDateView, CompleteWorkoutAPIView, GetUpcomingWorkouts, GetSingleRunningWorkoutView, GetSingleMobilityWorkoutView

urlpatterns = [
    path('save-workout/', SaveWorkoutView.as_view(), name='save-workout'),
    path('complete-workout/<int:workout_id>/', CompleteWorkoutAPIView.as_view(), name='complete-workout'),
    path('get-all-workouts/', GetAllWorkoutsView.as_view(), name='get-all-workouts'),
    path('upcoming-workouts/', GetUpcomingWorkouts.as_view(), name='get-upcoming-workouts'),
    path('get-single-workout/<int:workout_id>/', GetSingleWorkoutView.as_view(), name='get-single-workout'),
    path('update-workout-status/<int:workout_id>/', UpdateWorkoutStatusView.as_view(), name='update-workout-status'),
    path('delete-workout/<int:workout_id>/', DeleteWorkoutView.as_view(), name='delete_workout'), 
    path('update-workout-date/<int:workout_id>/', UpdateWorkoutDateView.as_view(), name='update_workout_date'), 
    path('get-single-running-workout/<int:workout_id>/', GetSingleRunningWorkoutView.as_view(), name='get_single_running_workout'),
    path('get-single-mobility-workout/<int:workout_id>/', GetSingleMobilityWorkoutView.as_view(), name='get_single_mobility_workout'),

]
