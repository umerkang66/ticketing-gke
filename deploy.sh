docker build -t ugulzar4512/ticketing-auth:$SHA -t ugulzar4512/ticketing-auth:latest -f ./auth/Dockerfile ./auth

docker build -t ugulzar4512/ticketing-tickets:$SHA -t ugulzar4512/ticketing-tickets:latest -f ./tickets/Dockerfile ./tickets

docker build -t ugulzar4512/ticketing-orders:$SHA -t ugulzar4512/ticketing-orders:latest -f ./orders/Dockerfile ./orders

docker build -t ugulzar4512/ticketing-payments:$SHA -t ugulzar4512/ticketing-payments:latest -f ./payments/Dockerfile ./payments

docker build -t ugulzar4512/ticketing-expiration:$SHA -t ugulzar4512/ticketing-expiration:latest -f ./expiration/Dockerfile ./expiration

docker build -t ugulzar4512/ticketing-client:$SHA -t ugulzar4512/ticketing-client:latest -f ./client/Dockerfile ./client



docker push ugulzar4512/ticketing-auth:latest
docker push ugulzar4512/ticketing-tickets:latest
docker push ugulzar4512/ticketing-orders:latest
docker push ugulzar4512/ticketing-payments:latest
docker push ugulzar4512/ticketing-expiration:latest
docker push ugulzar4512/ticketing-client:latest

docker push ugulzar4512/ticketing-auth:$SHA
docker push ugulzar4512/ticketing-tickets:$SHA
docker push ugulzar4512/ticketing-orders:$SHA
docker push ugulzar4512/ticketing-payments:$SHA
docker push ugulzar4512/ticketing-expiration:$SHA
docker push ugulzar4512/ticketing-client:$SHA

# if the cluster is starting first time, then there is no image
kubectl apply -f infra/k8s

# update the images in deployment
kubectl set image deployments/auth-depl auth=ugulzar4512/ticketing-auth:$SHA

kubectl set image deployments/tickets-depl tickets=ugulzar4512/ticketing-tickets:$SHA

kubectl set image deployments/orders-depl orders=ugulzar4512/ticketing-orders:$SHA

kubectl set image deployments/payments-depl payments=ugulzar4512/ticketing-payments:$SHA

kubectl set image deployments/expiration-depl expiration=ugulzar4512/ticketing-expiration:$SHA

kubectl set image deployments/client-depl client=ugulzar4512/ticketing-client:$SHA
