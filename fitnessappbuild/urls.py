"""
URL configuration for fitnessappbuild project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path 
from .views import index
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/auth/', include('jwt_auth.urls')),
    path('api/movements/', include('movements.urls')),
    path('api/saved_workouts/', include('saved_workouts.urls')),
    path('api/workout_sections/', include('workout_sections.urls')),
    path('api/chat/', include('chat_message.urls')),
    path('api/running_sessions/', include('running_sessions.urls')),
    path('api/saved_runs/', include('saved_runs.urls')),
    path('api/conditioning_workouts/', include('conditioning_summary.urls')),
    path('api/mobility_workouts/', include('mobility_overview.urls')),
    path('api/saved_mobility/', include('saved_mobility.urls')),
    path('api/saved_hiit/', include('saved_hiit.urls')),
    path('api/suggested_strength_overview/', include('suggested_strength_overview.urls')),
    path('api/equipment_filters/', include('saved_equipment_lists.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/leaderboard/', include('leaderboard.urls')),
    path('api/stats/', include('user_stats.urls')),
    path('api/movement_workout_tracking/', include('movement_workout_tracking.urls')),
    path('api/movement_summary_stats/', include('movement_summary_stats.urls')),
]
