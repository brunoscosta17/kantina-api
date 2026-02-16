up-local:
	docker compose --profile local-db --env-file env.docker.local up -d --build

down:
	docker compose --profile local-db down

down-clean:
	docker compose --profile local-db down -v

logs-api:
	docker logs -f kantina-api

logs-db:
	docker logs -f kantina-pg

health:
	curl -i http://localhost:3000/health
