#!/bin/bash

set -e

echo "Configuring Kong API Gateway..."

KONG_ADMIN_URL="http://localhost:8001"

wait_for_kong() {
    echo "Waiting for Kong to be ready..."
    until curl -s "${KONG_ADMIN_URL}" > /dev/null 2>&1; do
        echo "Kong is unavailable - sleeping"
        sleep 2
    done
    echo "Kong is up and running!"
}

create_service() {
    local name=$1
    local url=$2
    
    echo "Creating service: $name"
    curl -i -X POST "${KONG_ADMIN_URL}/services/" \
        --data "name=$name" \
        --data "url=$url"
}

create_route() {
    local service_name=$1
    local path=$2
    
    echo "Creating route for service: $service_name"
    curl -i -X POST "${KONG_ADMIN_URL}/services/${service_name}/routes" \
        --data "paths[]=$path" \
        --data "strip_path=true"
}

enable_rate_limiting() {
    local service_name=$1
    local minute_limit=${2:-100}
    local hour_limit=${3:-1000}
    
    echo "Enabling rate limiting for: $service_name"
    curl -i -X POST "${KONG_ADMIN_URL}/services/${service_name}/plugins" \
        --data "name=rate-limiting" \
        --data "config.minute=$minute_limit" \
        --data "config.hour=$hour_limit" \
        --data "config.policy=local"
}

enable_cors() {
    local service_name=$1
    
    echo "Enabling CORS for: $service_name"
    curl -i -X POST "${KONG_ADMIN_URL}/services/${service_name}/plugins" \
        --data "name=cors" \
        --data "config.origins=*" \
        --data "config.methods=GET,POST,PUT,PATCH,DELETE,OPTIONS" \
        --data "config.headers=Accept,Authorization,Content-Type" \
        --data "config.exposed_headers=X-Auth-Token" \
        --data "config.credentials=true" \
        --data "config.max_age=3600"
}

enable_jwt() {
    local service_name=$1
    
    echo "Enabling JWT authentication for: $service_name"
    curl -i -X POST "${KONG_ADMIN_URL}/services/${service_name}/plugins" \
        --data "name=jwt"
}

enable_logging() {
    local service_name=$1
    
    echo "Enabling logging for: $service_name"
    curl -i -X POST "${KONG_ADMIN_URL}/services/${service_name}/plugins" \
        --data "name=file-log" \
        --data "config.path=/tmp/kong-${service_name}.log"
}

wait_for_kong

create_service "auth-service" "http://auth-service:3001"
create_route "auth-service" "/api/auth"
enable_rate_limiting "auth-service" 50 500
enable_cors "auth-service"
enable_logging "auth-service"

create_service "user-service" "http://user-service:3002"
create_route "user-service" "/api/users"
enable_rate_limiting "user-service" 100 1000
enable_cors "user-service"
enable_jwt "user-service"
enable_logging "user-service"

create_service "restaurant-service" "http://restaurant-service:3003"
create_route "restaurant-service" "/api/restaurants"
enable_rate_limiting "restaurant-service" 200 2000
enable_cors "restaurant-service"
enable_logging "restaurant-service"

create_service "order-service" "http://order-service:3004"
create_route "order-service" "/api/orders"
enable_rate_limiting "order-service" 100 1000
enable_cors "order-service"
enable_jwt "order-service"
enable_logging "order-service"

create_service "delivery-service" "http://delivery-service:3005"
create_route "delivery-service" "/api/deliveries"
enable_rate_limiting "delivery-service" 100 1000
enable_cors "delivery-service"
enable_jwt "delivery-service"
enable_logging "delivery-service"

create_service "payment-service" "http://payment-service:3006"
create_route "payment-service" "/api/payments"
enable_rate_limiting "payment-service" 50 500
enable_cors "payment-service"
enable_jwt "payment-service"
enable_logging "payment-service"

create_service "geolocation-service" "http://geolocation-service:3008"
create_route "geolocation-service" "/api/geolocation"
enable_rate_limiting "geolocation-service" 200 2000
enable_cors "geolocation-service"
enable_logging "geolocation-service"

create_service "chat-service" "http://chat-service:3009"
create_route "chat-service" "/api/chat"
enable_rate_limiting "chat-service" 300 3000
enable_cors "chat-service"
enable_jwt "chat-service"
enable_logging "chat-service"

create_service "upload-service" "http://upload-service:3010"
create_route "upload-service" "/api/upload"
enable_rate_limiting "upload-service" 50 500
enable_cors "upload-service"
enable_jwt "upload-service"
enable_logging "upload-service"

create_service "stripe-payment-service" "http://stripe-payment-service:3011"
create_route "stripe-payment-service" "/api/stripe"
enable_rate_limiting "stripe-payment-service" 50 500
enable_cors "stripe-payment-service"
enable_jwt "stripe-payment-service"
enable_logging "stripe-payment-service"

create_service "sms-service" "http://sms-service:3012"
create_route "sms-service" "/api/sms"
enable_rate_limiting "sms-service" 50 500
enable_cors "sms-service"
enable_jwt "sms-service"
enable_logging "sms-service"

echo "Kong configuration completed successfully!"
