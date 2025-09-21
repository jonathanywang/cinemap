from django.middleware.csrf import CsrfViewMiddleware


class CSRFExemptAPIMiddleware(CsrfViewMiddleware):
    """
    Middleware that exempts API endpoints from CSRF protection
    """
    def process_request(self, request):
        # Mark API requests as CSRF exempt
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return super().process_request(request)

    def process_view(self, request, callback, callback_args, callback_kwargs):
        # Skip CSRF for API endpoints
        if request.path.startswith('/api/'):
            return None
        return super().process_view(request, callback, callback_args, callback_kwargs)