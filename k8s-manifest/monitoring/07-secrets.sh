#!/bin/bash
# ecom-secrets theke monitoring namespace-e password copy kore (password git-e thake na)
set -e
get() { kubectl get secret ecom-secrets -n ecom -o jsonpath="{.data.$1}" | base64 -d; }

kubectl create secret generic monitoring-secrets -n monitoring \
  --from-literal=REDIS_PASSWORD="$(get REDIS_PASSWORD)" \
  --from-literal=POSTGRES_PASSWORD="$(get POSTGRES_PASSWORD)" \
  --dry-run=client -o yaml | kubectl apply -f -

# Grafana admin password: shudhu prothom bar random toiri hobe
if ! kubectl get secret grafana-secrets -n monitoring >/dev/null 2>&1; then
  kubectl create secret generic grafana-secrets -n monitoring \
    --from-literal=GF_SECURITY_ADMIN_PASSWORD="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 16)"
fi
