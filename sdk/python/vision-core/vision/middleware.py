import time
from .client import get_client

class VisionMiddleware:
    """Django Middleware for tracking requests."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        response = self.get_response(request)
        duration = int((time.time() - start_time) * 1000)

        client = get_client()
        if client:
            client.track("server_request", {
                "method": request.method,
                "path": request.path,
                "status": response.status_code,
                "duration_ms": duration
            })
            
        return response

class VisionASGIMiddleware:
    """FastAPI / Starlette Middleware for tracking requests."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        status_code = [500]

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code[0] = message["status"]
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration = int((time.time() - start_time) * 1000)
            client = get_client()
            if client:
                client.track("server_request", {
                    "method": scope.get("method", ""),
                    "path": scope.get("path", ""),
                    "status": status_code[0],
                    "duration_ms": duration
                })

SigmaMiddleware = VisionMiddleware
SigmaASGIMiddleware = VisionASGIMiddleware
