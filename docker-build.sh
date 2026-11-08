docker build -t ghcr.io/3engel/musheetflow:latest .

# Push to github if argument "push" is provided
if [ "$1" = "push" ]; then
	docker push ghcr.io/3engel/musheetflow:latest
fi
