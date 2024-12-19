from django.urls import path
# import view to use in register route
from .views import RegisterView, LoginView, SimpleUserView, FullUserView, ProfileImageUploadView, UpdateUserView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('profile/upload-image/', ProfileImageUploadView.as_view()),
    path('profile/<int:user_id>/', SimpleUserView.as_view()),
    path('full-profile/<int:user_id>/', FullUserView.as_view()),
    path('update-profile/<int:user_id>/', UpdateUserView.as_view()),
    
]