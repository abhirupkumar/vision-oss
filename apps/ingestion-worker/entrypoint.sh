#!/bin/sh
set -e

# If KAFKA_SSL_CA_PEM is provided, install it into the system trust store.
# This is the most reliable way to make librdkafka (used by node-rdkafka) trust Aiven's CA.
if [ -n "$KAFKA_SSL_CA_PEM" ]; then
  echo "[entrypoint] Installing Aiven CA certificate into system trust store..."
  echo "$KAFKA_SSL_CA_PEM" > /usr/local/share/ca-certificates/aiven-kafka-ca.crt
  update-ca-certificates --fresh > /dev/null 2>&1
  echo "[entrypoint] CA certificate installed successfully."
fi

exec "$@"
