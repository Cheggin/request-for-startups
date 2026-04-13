# Color Palettes Reference

## Default Palette (Platform-Agnostic)

| Component Type | Background | Stroke |
|---------------|------------|--------|
| Frontend/UI | `#a5d8ff` | `#1971c2` |
| Backend/API | `#d0bfff` | `#7048e8` |
| Database | `#b2f2bb` | `#2f9e44` |
| Cache | `#ffec99` | `#f08c00` |
| Message Queue | `#ffc9c9` | `#e03131` |
| Storage | `#fff3bf` | `#f59f00` |
| External API | `#ffa8a8` | `#c92a2a` |
| Load Balancer | `#99e9f2` | `#0c8599` |
| CDN | `#eebefa` | `#9c36b5` |
| Orchestrator | `#ffc078` | `#e8590c` |
| Container | `#a5d8ff` | `#1864ab` |
| Serverless | `#d8f5a2` | `#66a80f` |
| Monitoring | `#ffe066` | `#fab005` |
| Security | `#ff8787` | `#fa5252` |

## AWS Palette

| Service Category | Background | Stroke |
|-----------------|------------|--------|
| Compute (EC2, Lambda) | `#ff9900` | `#cc7a00` |
| Storage (S3, EBS) | `#3f8624` | `#2d6119` |
| Database (RDS, DynamoDB) | `#3b48cc` | `#2d38a0` |
| Networking (VPC, CloudFront) | `#8c4fff` | `#6b3dcc` |
| Analytics (Redshift, Athena) | `#01a88d` | `#018571` |
| Integration (SQS, SNS) | `#e7157b` | `#b81162` |
| Security (IAM, Cognito) | `#dd344c` | `#b0293d` |

## Azure Palette

| Service Category | Background | Stroke |
|-----------------|------------|--------|
| Compute | `#0078d4` | `#005a9e` |
| Storage | `#0078d4` | `#005a9e` |
| Database | `#0078d4` | `#005a9e` |
| Networking | `#0078d4` | `#005a9e` |
| AI/ML | `#0078d4` | `#005a9e` |
| DevOps | `#0078d4` | `#005a9e` |

## GCP Palette

| Service Category | Background | Stroke |
|-----------------|------------|--------|
| Compute | `#4285f4` | `#3367d6` |
| Storage | `#4285f4` | `#3367d6` |
| Database | `#4285f4` | `#3367d6` |
| Networking | `#4285f4` | `#3367d6` |
| AI/ML | `#4285f4` | `#3367d6` |

## Kubernetes Palette

| Resource Type | Background | Stroke |
|--------------|------------|--------|
| Pod | `#326ce5` | `#2756b8` |
| Service | `#326ce5` | `#2756b8` |
| Deployment | `#326ce5` | `#2756b8` |
| ConfigMap | `#7f52ff` | `#6641cc` |
| Ingress | `#009688` | `#00796b` |
| Node | `#ff6f00` | `#cc5900` |
| Namespace | `#607d8b` | `#4d646f` |

## Diagram Type Recommendations

### Microservices Architecture
- Use default palette
- Vertical flow layout
- Group by domain boundaries

### Data Pipeline
- Horizontal flow layout
- Emphasize storage and processing nodes
- Use arrows to show data direction

### Event-Driven System
- Hub-and-spoke for event bus
- Message queue colors prominent
- Show async connections with dashed arrows

### Kubernetes Cluster
- Use Kubernetes palette
- Nest pods within nodes
- Show service mesh connections

### CI/CD Pipeline
- Horizontal flow
- DevOps colors
- Sequential stages with gates

### Network Diagram
- Networking colors
- Show security boundaries
- Layer by network zones

### User Flow
- Frontend colors for UI components
- Vertical or horizontal based on complexity
- Annotate with user actions
