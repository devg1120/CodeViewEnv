
curl -X POST http://localhost:7900/api/v1/projects/scan \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project3",
    "path": "../",
    "description": "MyPro3"
  }'
