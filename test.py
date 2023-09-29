import requests

r = requests.get("http://192.168.1.210/Port/Details/Input/1")
print(r.json())