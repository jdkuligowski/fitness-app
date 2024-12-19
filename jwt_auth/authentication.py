# BasicAuthentication is the base class that we will inherit as our auth class, and we'll overwrite the default behaviour by using the authenticate method
from rest_framework.authentication import BasicAuthentication
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
User = get_user_model()

# import settings
from django.conf import settings

#jwt
import jwt

# create a class for enabling authentication
class JWTAuthentication(BasicAuthentication):
    def authenticate(self, request):
        header = request.headers.get('Authorization')

        if not header:
            return None

        if not header.startswith('Bearer '):
            raise PermissionDenied('Invalid token header format.')

        token = header.replace('Bearer ', '')

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user = User.objects.get(pk=payload.get('sub'))
        except jwt.ExpiredSignatureError:
            raise PermissionDenied('Token has expired.')
        except jwt.InvalidTokenError:
            raise PermissionDenied('Invalid token.')
        except User.DoesNotExist:
            raise PermissionDenied('User not found.')

        return (user, token)
