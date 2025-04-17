# download file and create image
FROM alpine:3.14 AS downloader
RUN apk add --no-cache curl
# RUN curl -sL https://github.com/SnuK87/keycloak-kafka/releases/download/1.2.0/keycloak-kafka-1.2.0-jar-with-dependencies.jar -o /tmp/keycloak-kafka-1.2.0-jar-with-dependencies.jar

FROM quay.io/keycloak/keycloak:26.0.0 AS builder

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure a database vendor
ENV KC_DB=postgres
# COPY --from=downloader /tmp/keycloak-kafka-1.2.0-jar-with-dependencies.jar /opt/keycloak/providers/keycloak-kafka-1.2.0-jar-with-dependencies.jar
WORKDIR /opt/keycloak
# for demonstration purposes only, please make sure to use proper certificates in production instead
RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:localhost,IP:127.0.0.1" -keystore conf/server.keystore
# install curl
# wget instead of curl
#RUN wget https://github.com/SnuK87/keycloak-kafka/releases/download/1.2.0/keycloak-kafka-1.2.0-jar-with-dependencies.jar -O /opt/keycloak/providers/keycloak-kafka-1.2.0-jar-with-dependencies.jar


RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.0.0
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# change these values to point to a running postgres instance
ENV KC_DB=postgres
ENV KC_DB_URL=jdbc:postgresql://databases_postgres-keycloak:5432/postgres
ENV KC_DB_USERNAME=postgres
ENV KC_DB_PASSWORD==your-super-secret-and-long-postgres-password
ENV KEYCLOAK_ADMIN=admin
ENV KEYCLOAK_ADMIN_PASSWORD=admin
ENV KAFKA_TOPIC=keycloak
ENV KAFKA_BOOTSTRAP_SERVERS=kafka-stack_kafka-eds:29095,kafka-stack_kafka-eds2:29095
ENV KAFKA_GROUP_ID=keycloak
ENV KAFKA_CLIENT_ID=keycloak
ENV KAFKA_AUTO_OFFSET_RESET=earliest
ENV KAFKA_ENABLE_AUTO_COMMIT=true
ENV KAFKA_AUTO_COMMIT_INTERVAL_MS=1000
ENV KAFKA_SESSION_TIMEOUT_MS=30000
ENV KAFKA_ADMIN_TOPIC=keycloak-admin

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
