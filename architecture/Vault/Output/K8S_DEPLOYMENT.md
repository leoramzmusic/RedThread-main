# Kubernetes Deployment Guide

## Prerequisites

### 1. Install kubectl
```bash
# Windows (using Chocolatey)
choco install kubernetes-cli

# Verify installation
kubectl version --client
```

### 2. Install Kustomize
```bash
# Windows (using Chocolatey)
choco install kustomize

# Verify installation
kustomize version
```

### 3. Configure kubectl
```bash
# Set context to your cluster
kubectl config use-context your-cluster-name

# Verify connection
kubectl cluster-info
```

## Deployment Steps

### 1. Create Namespaces
```bash
kubectl apply -f k8s/namespaces.yaml
```

### 2. Create Secrets
**IMPORTANT**: Update secrets before deploying!

```bash
# Copy template
cp k8s/base/secrets.yaml.template k8s/base/secrets.yaml

# Edit with real values
# DO NOT commit secrets.yaml to git!
notepad k8s/base/secrets.yaml

# Apply secrets to each namespace
kubectl apply -f k8s/base/secrets.yaml -n dev
kubectl apply -f k8s/base/secrets.yaml -n staging
kubectl apply -f k8s/base/secrets.yaml -n prod
```

### 3. Deploy to Dev
```bash
kubectl apply -k k8s/overlays/dev

# Verify deployment
kubectl get pods -n dev
kubectl get services -n dev
kubectl get ingress -n dev
```

### 4. Deploy to Staging
```bash
kubectl apply -k k8s/overlays/staging

# Verify deployment
kubectl get pods -n staging
```

### 5. Deploy to Production
```bash
kubectl apply -k k8s/overlays/prod

# Verify deployment
kubectl get pods -n prod
```

## Verify Deployments

### Check Pod Status
```bash
kubectl get pods -n dev
kubectl logs -f deployment/redthread-backend -n dev
kubectl logs -f deployment/redthread-frontend -n dev
```

### Check Services
```bash
kubectl get services -n dev
kubectl describe service redthread-backend -n dev
```

### Check Ingress
```bash
kubectl get ingress -n dev
kubectl describe ingress redthread-ingress -n dev
```

## Scaling

### Manual Scaling
```bash
# Scale backend
kubectl scale deployment redthread-backend --replicas=5 -n prod

# Scale frontend
kubectl scale deployment redthread-frontend --replicas=5 -n prod
```

### Auto-scaling (HPA)
```bash
# Create HPA for backend
kubectl autoscale deployment redthread-backend \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n prod
```

## Updates

### Rolling Update
```bash
# Update image
kubectl set image deployment/redthread-backend \
  redthread-backend=your-registry.azurecr.io/redthread-backend:v1.2.0 \
  -n prod

# Check rollout status
kubectl rollout status deployment/redthread-backend -n prod

# Rollback if needed
kubectl rollout undo deployment/redthread-backend -n prod
```

## Monitoring

### View Logs
```bash
# Stream logs
kubectl logs -f deployment/redthread-backend -n prod

# Last 100 lines
kubectl logs --tail=100 deployment/redthread-backend -n prod
```

### Execute Commands in Pod
```bash
# Get shell access
kubectl exec -it deployment/redthread-backend -n prod -- /bin/bash

# Run one-off command
kubectl exec deployment/redthread-backend -n prod -- python manage.py migrate
```

## Troubleshooting

### Pod Not Starting
```bash
# Describe pod
kubectl describe pod <pod-name> -n dev

# Check events
kubectl get events -n dev --sort-by='.lastTimestamp'
```

### Service Not Accessible
```bash
# Check endpoints
kubectl get endpoints -n dev

# Test service internally
kubectl run test-pod --image=curlimages/curl -it --rm -- \
  curl http://redthread-backend:8000/health
```

### Database Connection Issues
```bash
# Check MongoDB pod
kubectl logs statefulset/mongodb -n dev

# Connect to MongoDB
kubectl exec -it mongodb-0 -n dev -- mongosh
```

## Cleanup

### Delete Specific Environment
```bash
kubectl delete -k k8s/overlays/dev
```

### Delete All Resources
```bash
kubectl delete namespace dev
kubectl delete namespace staging
kubectl delete namespace prod
```

## Security Best Practices

1. **Never commit secrets to git**
   - Add `k8s/base/secrets.yaml` to `.gitignore`
   - Use external secret management (Vault, AWS Secrets Manager)

2. **Use RBAC**
   - Create service accounts with minimal permissions
   - Implement pod security policies

3. **Network Policies**
   - Restrict pod-to-pod communication
   - Only allow necessary ingress/egress

4. **Resource Limits**
   - Always set resource requests and limits
   - Prevent resource exhaustion

## Next Steps

1. ✅ Create Kubernetes manifests (Done)
2. ⏭️ Install NGINX Ingress Controller
3. ⏭️ Setup cert-manager for TLS
4. ⏭️ Configure monitoring (Prometheus/Grafana)
5. ⏭️ Setup ArgoCD for GitOps (optional)
6. ⏭️ Create Helm charts (optional)
