"""
ASGI config for fitnessappbuild project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat_room.routing import websocket_urlpatterns  # Import your WebSocket routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fitnessappbuild.settings")

# Set up ASGI application to handle HTTP and WebSocket protocols
application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Handle traditional HTTP requests
    "websocket": AuthMiddlewareStack(  # Handle WebSocket connections
        URLRouter(
            websocket_urlpatterns  # Include WebSocket URL patterns
        )
    ),
})
