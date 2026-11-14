# Aurelia Commerce Platform: Frontend

Two Next.js 15 applications in one npm monorepo: the customer **storefront** and the
**admin console**. Both talk to the backend only through the Kong API gateway. This
repository also holds the Kubernetes manifests for the two apps, the monitoring stack
manifests, and the frontend CI pipeline.

The backend (NestJS services, database, Kong, platform runbook) lives in the
[`ecommerce-backend`](https://github.com/nuruzzaman24x/ecommerce-backend) repository.

<!-- TODO: project owner / maintainer name and contact -->
<!-- TODO: license -->

## Contents

- [Overview](#overview)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Run with Docker Compose](#run-with-docker-compose)
- [Build the images](#build-the-images)
- [Kubernetes deployment](#kubernetes-deployment)
- [Monitoring manifests](#monitoring-manifests)
- [CI/CD](#cicd)
- [Observability](#observability)
- [Troubleshooting](#troubleshooting)
- [Known gaps](#known-gaps)

## Overview

| App | Folder | Port | Image | Kubernetes Service |
|---|---|---|---|---|
| Storefront (customers) | `apps/public` | 3000 | `nuruzzaman24x/ecom-storefront` | `storefront`, NodePort `30000` |
| Admin console | `apps/admin` | 3100 | `nuruzzaman24x/ecom-admin-ui` | `admin-ui`, NodePort `30100` |

Both apps are built as Next.js standalone servers (`node apps/<app>/server.js`) and run as
the non-root `node` user. Both expose `GET /api/health` for probes.

```
Browser ──▶ storefront :3000 ─┐
Browser ──▶ admin-ui   :3100 ─┴──▶ Kong (http://kong:8000) ──▶ auth / admin / public services
```

Authentication is cookie based. The session cookie name is configurable
(`SESSION_COOKIE_NAME`, default in Kubernetes: `aurelia_session`).

## Repository layout

```
apps/
  public/                  storefront (Next.js)
  admin/                   admin console (Next.js)
packages/
  api-client/              shared API client
  config/                  shared configuration
  types/                   shared types
  ui/                      shared UI components
k8s-manifest/
  frontend.yaml            Deployments and Services for storefront and admin-ui
  kustomization.yaml       lists frontend.yaml only
  monitoring/              Prometheus, Grafana and exporters (plain manifests)
cicd/Jenkinsfile           CI pipeline
docker-compose.yml         local build and run of both apps
docs/                      further documentation
scripts/                   helper scripts
```

<!-- TODO: one-line description of docs/ and scripts/, and of the "BRAC MF" folder -->

The shared code in `packages/` is why every image is built from the **repository root**
(`context: .`) with the app's Dockerfile selected by `-f`.

## Prerequisites

- Docker (images are built with the host Docker daemon)
- For local development without Docker: Node.js and npm <!-- TODO: required Node version -->
- A running backend (Kong reachable at `API_GATEWAY_URL`) for the apps to be useful

<!-- TODO: npm scripts for local development (dev, lint, typecheck, test): copy from package.json -->

## Configuration

### Runtime environment variables

Set on the container (see `k8s-manifest/frontend/ (storefront.yaml, admin-ui.yaml)`):

| Variable | Value in Kubernetes | Purpose |
|---|---|---|
| `PORT` | `3000` (storefront), `3100` (admin-ui) | Listening port |
| `API_GATEWAY_URL` | `http://kong:8000` | Where the server-side code reaches the backend |
| `SESSION_COOKIE_NAME` | `aurelia_session` | Name of the session cookie |
| `SESSION_COOKIE_SECURE` | `false` | Set `true` only when served over HTTPS |
| `NODE_OPTIONS` | `--enable-source-maps` | Required by the tracing setup (see [Observability](#observability)) |

### Build-time arguments (`NEXT_PUBLIC_*`)

Next.js inlines `NEXT_PUBLIC_*` values into the JavaScript bundle at **build** time. Changing
one needs an image rebuild, not a restart. Defaults come from the Dockerfiles.

| Argument | Default | Value used by Jenkins | Meaning |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_NAME` | `BD Shop` | `BD Shop` | Shop name in titles and header |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (storefront), `http://localhost:3100` (admin) | `http://172.17.0.233:30000` | Public address of the storefront, the URL the browser uses |
| `NEXT_PUBLIC_ADMIN_URL` | `http://localhost:3100` | `http://172.17.0.233:30100` (storefront build) | Admin console address, used for links |
| `NEXT_PUBLIC_CURRENCY` | `BDT` | `BDT` | Currency code |
| `NEXT_PUBLIC_DELIVERY_FLAT_RATE` | `120` | `120` (admin build) | Flat delivery charge shown in the UI |
| `NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD` | `5000` | default | Order value for free shipping |
| `NEXT_PUBLIC_SITE_LOGO` | empty | default | Logo path or https URL |
| `NEXT_PUBLIC_SITE_LOGO_WIDTH` / `_HEIGHT` | `120` / `32` | default | Logo size |
| `NEXT_PUBLIC_SITE_LOGO_WITH_NAME` | `false` | default | Show shop name next to the logo |
| `NEXT_PUBLIC_OWNER_NAME` / `_ROLE` / `_IMAGE` | empty | default | Owner details in the footer |

The storefront Dockerfile declares all of them; the admin Dockerfile declares the first six.
The URL values must match the address users open in the browser. If you open the site on a
different node IP or a domain, rebuild with the new URLs.

## Run with Docker Compose

`docker-compose.yml` builds and runs both apps. Compose reads the same `NEXT_PUBLIC_*`
variables from your shell or a `.env` file and falls back to the defaults above.

```bash
export NEXT_PUBLIC_SITE_URL=http://localhost:3000
export NEXT_PUBLIC_ADMIN_URL=http://localhost:3100
docker compose up -d --build
docker compose ps
```

Storefront: `http://localhost:3000`, admin console: `http://localhost:3100`. The backend must
be reachable at the `API_GATEWAY_URL` configured in the compose file.

## Build the images

Run from the repository root. Jenkins runs exactly these commands (see [CI/CD](#cicd)).

```bash
export NODE_IP=172.17.0.233       # the IP you open the site on
export TAG=1.0

docker build -f apps/public/Dockerfile --target runtime \
  --build-arg NEXT_PUBLIC_SITE_NAME="BD Shop" \
  --build-arg NEXT_PUBLIC_SITE_URL="http://$NODE_IP:30000" \
  --build-arg NEXT_PUBLIC_ADMIN_URL="http://$NODE_IP:30100" \
  --build-arg NEXT_PUBLIC_CURRENCY="BDT" \
  -t nuruzzaman24x/ecom-storefront:$TAG .

docker build -f apps/admin/Dockerfile --target runtime \
  --build-arg NEXT_PUBLIC_SITE_NAME="BD Shop" \
  --build-arg NEXT_PUBLIC_SITE_URL="http://$NODE_IP:30000" \
  --build-arg NEXT_PUBLIC_CURRENCY="BDT" \
  --build-arg NEXT_PUBLIC_DELIVERY_FLAT_RATE="120" \
  -t nuruzzaman24x/ecom-admin-ui:$TAG .
```

`--target runtime` stops at the last Dockerfile stage so the image contains only what is
needed to run, not the build toolchain.

## Kubernetes deployment

`k8s-manifest/frontend/ (storefront.yaml, admin-ui.yaml)` defines, for both apps, a Deployment and a Service in the `ecom`
namespace:

- 1 replica, `enableServiceLinks: false`
- Readiness probe (`/api/health`, delay 10 s) and liveness probe (`/api/health`, delay 40 s)
- Resources: requests `100m` CPU / `128Mi` memory, limit `512Mi` memory (no CPU limit)
- Service type NodePort: `storefront` `3000:30000`, `admin-ui` `3100:30100`
- Tracing: the annotation `instrumentation.opentelemetry.io/inject-nodejs: "ecom-nodejs"`
  and `NODE_OPTIONS=--enable-source-maps`

The image tag in `frontend.yaml` is written by Jenkins on every build (`b<BUILD_NUMBER>`);
do not edit it by hand.

### Deployed by ArgoCD

The ArgoCD Application `ecom-frontend` tracks this repository (`main`, path `k8s-manifest`)
and applies it to the `ecom` namespace with automated sync (`selfHeal: true`,
`prune: false`). `k8s-manifest/kustomization.yaml` lists only `frontend.yaml`, so the
`monitoring/` folder is **not** deployed by ArgoCD.

```bash
kubectl -n argocd get applications            # ecom-frontend: Synced / Healthy
kubectl -n ecom get deploy storefront admin-ui \
  -o custom-columns=NAME:.metadata.name,IMAGE:.spec.template.spec.containers[0].image
```

ArgoCD polls Git about every 3 minutes. Use **Refresh** in the ArgoCD UI to sync sooner.

### Manual apply (without ArgoCD)

```bash
kubectl apply -k k8s-manifest
kubectl -n ecom rollout status deploy/storefront
kubectl -n ecom rollout status deploy/admin-ui
```

Disable automated sync on the Application first, otherwise ArgoCD reverts manual changes.

### Access

| App | URL |
|---|---|
| Storefront | `http://<NODE_IP>:30000` |
| Admin console | `http://<NODE_IP>:30100` |

`<NODE_IP>` is `172.17.0.232` or `172.17.0.233`. The URL must match the one the images were
built with (see [Configuration](#build-time-arguments-next_public_)).

## Monitoring manifests

`k8s-manifest/monitoring/` holds plain manifests (no Helm) for the `monitoring` namespace:
namespace, Prometheus (RBAC, config, deployment), kube-state-metrics, node-exporter,
blackbox-exporter, postgres-exporter, redis-exporter, Grafana (provisioning and deployment)
and dashboards.

```bash
cd k8s-manifest/monitoring
# 07-secrets.sh is run manually and is not applied by kustomize; review it first
kubectl apply -k .
```

<!-- TODO: document what 07-secrets.sh creates and the Grafana dashboards provided -->

Prometheus is exposed on NodePort `30090` and Grafana on `30300`. Prometheus also scrapes the
kubelet's cAdvisor endpoint for per-container CPU and memory.

## CI/CD

The Jenkins job `ecom-frontend-ci` (Pipeline script from SCM, branch `main`, Script Path
`cicd/Jenkinsfile`) runs these stages:

1. **Build storefront** and **Build admin-ui**: `docker build` with the `NEXT_PUBLIC_*`
   arguments from the table above.
2. **SonarQube scan**: scans `apps` and `packages` (project key `ecom-frontend`). The
   JavaScript analyzer needs `-Dsonar.javascript.node.timeout=600000` on this hardware;
   without it the scan failed after 300 seconds.
3. **Security scan (Trivy)**: HIGH findings are reported, CRITICAL findings fail the build.
4. **Push to Docker Hub**: tag `b<BUILD_NUMBER>`.
5. **Update manifest in git**: `sed` rewrites the image tag in `k8s-manifest/frontend/ (storefront.yaml, admin-ui.yaml)`,
   then Jenkins commits with `[skip ci]` and pushes to `main`.
6. **Deploy to Kubernetes**: `kubectl apply -k k8s-manifest` and a rollout check (see
   [Known gaps](#known-gaps)).

Jenkins credentials used: `docker-cred`, `github-cred`, `sonar-token`.

```
git push → Jenkins builds, scans, pushes image, writes new tag into frontend.yaml in Git
        → ArgoCD notices the change (≤ 3 min) → rolls out storefront and admin-ui
```

To roll back, revert the tag commit in Git; ArgoCD applies the previous image.

## Observability

- **Tracing.** Both apps are auto-instrumented by the OpenTelemetry Operator through the
  annotation in `frontend.yaml`. Traces go to the Collector in the `monitoring` namespace and
  are visible in Jaeger (`http://<NODE_IP>:30686`) under the services `storefront` and
  `admin-ui`. A `MetadataLookupWarning` in the app log is harmless on bare metal.
- **Logs.** Container logs are collected by Fluent Bit into Elasticsearch and searched in
  Kibana (`http://<NODE_IP>:30601`), for example
  `kubernetes.pod_name.keyword : storefront*`.
- **Metrics.** Pod CPU and memory come from cAdvisor and kube-state-metrics. The apps do not
  expose application-level metrics yet.

Each instrumented pod must contain the init container
`opentelemetry-auto-instrumentation-nodejs`:

```bash
kubectl -n ecom get pod -l app=storefront -o jsonpath='{.items[*].spec.initContainers[*].name}'; echo
```

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Links or API calls point to `localhost` | The image was built without the right `NEXT_PUBLIC_*` values. Rebuild with the URLs users open |
| Page loads but every API call fails | `API_GATEWAY_URL` is wrong or Kong is down: `kubectl -n ecom get pods`, check Kong |
| Pod `Running` but no traces in Jaeger | The pod started before the `ecom-nodejs` Instrumentation existed. Run `kubectl -n ecom rollout restart deploy/storefront deploy/admin-ui` |
| ArgoCD `OutOfSync` | `kubectl -n argocd describe application ecom-frontend \| tail -25`, or **App Diff** in the UI |
| Jenkins build fails in the SonarQube stage with `Failed to start the bridge server (300s timeout)` | The scanner's Node.js bridge starts slowly on this host. Keep the `sonar.javascript.node.timeout` option in the Jenkinsfile |
| Rollout hangs | `kubectl -n ecom describe pod -l app=storefront`; check the image tag exists on Docker Hub |

## Known gaps

- **Deploy overlap.** ArgoCD deploys this repository, but the Jenkinsfile still runs
  `kubectl apply` in a `Deploy to Kubernetes` stage. Remove that stage so ArgoCD is the only
  deployer.
- **Users are logged out after a deployment** (observed on the admin console). The cause has
  not been diagnosed yet. Check how the apps store and verify the session and whether
  anything in it is generated per process start. <!-- TODO: root cause and fix -->
- **Plain HTTP.** Services are exposed on NodePorts without TLS, so
  `SESSION_COOKIE_SECURE=false`. Put them behind ingress-nginx with a certificate and set it
  to `true`.
- **URLs are baked into the images.** A change of node IP or domain needs a rebuild.
- **Single replica** per app and no CPU limit.
- **Test and lint stages** are not part of the pipeline yet.
