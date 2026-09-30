import urllib.request
import json

try:
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/auth/google/url?redirect_uri=http://localhost:5173/auth/google/callback")
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print("Error:", e)
