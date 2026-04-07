docker build -t ghcr.io/3engel/musheetflow-frontend:latest ./frontend
docker build -t ghcr.io/3engel/musheetflow-backend:latest ./backend

# Push to github if argument "push" is provided
if [ "$1" = "push" ]; then
	docker push ghcr.io/3engel/musheetflow-frontend:latest
	docker push ghcr.io/3engel/musheetflow-backend:latest
fi
