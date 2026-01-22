# Deployment Architecture

## Deployment Overview

This document describes the actual deployment architecture of the Officeless platform on AWS, including infrastructure components, networking, and operational considerations.

## Infrastructure Foundation

### AWS Region and Availability Zones
- **Region**: ap-southeast-1 (Singapore)
- **Availability Zones**: 
  - ap-southeast-1a
  - ap-southeast-1b
  - ap-southeast-1c
- **Multi-AZ Deployment**: All critical components deployed across 3 availability zones

### VPC Architecture

#### VPC Configuration
- **CIDR Block**: 10.1.0.0/16
- **DNS Support**: Enabled
- **DNS Hostnames**: Enabled
- **VPC Name**: `officeless-production-vpc`

#### Subnet Architecture
**Public Subnets** (3 subnets, one per AZ):
- `officeless-production-public-ap-southeast-1a`: 10.1.0.0/20
- `officeless-production-public-ap-southeast-1b`: 10.1.16.0/20
- `officeless-production-public-ap-southeast-1c`: 10.1.80.0/20
- **Purpose**: NAT Gateway, Internet-facing load balancers
- **Tags**: `kubernetes.io/role/elb = 1` for ALB placement

**Private Subnets** (3 subnets, one per AZ):
- `officeless-production-private-ap-southeast-1a`: 10.1.32.0/20
- `officeless-production-private-ap-southeast-1b`: 10.1.48.0/20
- `officeless-production-private-ap-southeast-1c`: 10.1.64.0/20
- **Purpose**: EKS cluster nodes, application workloads
- **Tags**: `kubernetes.io/role/internal-elb = 1` for internal load balancers

#### Networking Components
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateway**: 
  - Single NAT Gateway in public subnet (ap-southeast-1a)
  - Elastic IP associated
  - Provides outbound internet access for private subnets
- **Route Tables**: 
  - Public route table with IGW route
  - Private route table with NAT Gateway route

## EKS Cluster Deployment

### Cluster Configuration
- **Cluster Name**: `officeless-production`
- **Kubernetes Version**: 1.33
- **Endpoint Access**:
  - Private endpoint: Enabled (from VPC CIDR only)
  - Public endpoint: Disabled (production security)
- **Security Group**: Cluster-specific security group allowing HTTPS (443) from VPC CIDR
- **CloudWatch Logging**: 
  - API server logs
  - Audit logs
  - Authenticator logs
  - Controller manager logs
  - Scheduler logs
  - Retention: 7 days

### Node Group Configuration
- **Node Group Name**: `riung-workers`
- **Deployment**: Private subnets across 3 AZs
- **Instance Types**: 
  - Primary: `t3.xlarge` (4 vCPU, 16 GB RAM)
  - Fallback: `m6i.large` (2 vCPU, 8 GB RAM)
- **AMI**: Bottlerocket x86_64 (AWS-optimized container OS)
- **Capacity Type**: ON_DEMAND
- **Disk**: 200 GB per node
- **Scaling**:
  - Minimum: 3 nodes
  - Desired: 3 nodes (auto-managed by autoscaler)
  - Maximum: 6 nodes
- **Update Strategy**: 
  - Max unavailable: 1 node
  - Rolling updates with zero-downtime
- **Labels**: 
  - `environment = production`
  - `workload = riung`

## Storage Architecture

### EBS (Elastic Block Store)
- **CSI Driver**: AWS EBS CSI Driver v1.42.0-eksbuild.1
- **Storage Class**: gp3 (provisioned IOPS)
- **Features**:
  - Volume expansion: Enabled
  - Volume binding: WaitForFirstConsumer (zone-aware)
  - Encryption: AWS managed keys
- **Use Cases**: Database volumes, application persistent storage

### EFS (Elastic File System)
- **File System**: `eks_production`
- **CSI Driver**: AWS EFS CSI Driver v3.1.8
- **Configuration**:
  - Performance mode: General Purpose
  - Throughput mode: Bursting
  - Encryption: Enabled at rest
- **Mount Targets**: One per private subnet (3 total)
- **Security**: Uses EKS cluster security group
- **Storage Class**: `efs` with EFS Access Points
- **Use Cases**: Shared file storage, content repositories

### S3 (Simple Storage Service)
- **Application Buckets**: Custom buckets as needed
- **Monitoring Buckets**:
  - `officeless-mimir-production` - Metrics storage
  - `officeless-mimir-alertmanager-production` - Alertmanager state
  - `officeless-mimir-ruler-production` - Recording rules
  - `officeless-loki-chunks-production` - Log chunks
  - `officeless-loki-ruler-production` - Log rules
  - `officeless-tempo-production` - Trace storage

## Load Balancing

### AWS Load Balancer Controller
- **Version**: 1.12.0 (Helm chart)
- **Namespace**: kube-system
- **IAM Integration**: Pod Identity with dedicated IAM role
- **Capabilities**:
  - Automatic ALB/NLB creation from Ingress/Service resources
  - SSL/TLS termination
  - Path-based routing
  - Host-based routing

### Load Balancer Types
- **Application Load Balancer (ALB)**: HTTP/HTTPS traffic
- **Network Load Balancer (NLB)**: TCP/UDP traffic
- **Placement**: Based on subnet tags (`kubernetes.io/role/elb`)

## VPN and Remote Access

### VPN Server
- **Instance Type**: t3.large
- **AMI**: Ubuntu 24.04
- **Deployment**: Public subnet (ap-southeast-1a)
- **Elastic IP**: Static public IP assigned
- **Storage**: 
  - Root volume: 20 GB gp3, encrypted
  - Additional volume: 20 GB gp3, encrypted
- **Software Stack**:
  - Pritunl VPN Server
  - OpenVPN
  - WireGuard
  - MongoDB 8.0 (for Pritunl)
- **Security Group**: 
  - SSH (22)
  - VPN (1194 UDP)
  - HTTP (80)
  - HTTPS (443)
  - Jenkins Agent JNLP (50000)
  - Docker Registry (5000)

### CI/CD Integration
- **Jenkins Agent**: Pre-configured on VPN instance
- **Tools Installed**:
  - Docker (latest)
  - kubectl (latest)
  - Java 21 (OpenJDK)
  - AWS CLI v2
  - Git, build-essential
  - jq, yq, tree, htop

## Infrastructure as Code

### Terraform Structure
```
terraform-officeless/
├── 01-vpc/          # VPC, subnets, networking
├── 02-eks/          # EKS cluster, node groups, addons
├── 03-s3/           # S3 buckets
├── 04-ec2/          # VPN instance
├── 05-helm/         # Helm charts (addons)
├── 07-valkey/       # Valkey (Redis) module
└── modules/         # Reusable modules
```

### State Management
- **Backend**: S3 with versioning and encryption
- **State Locking**: DynamoDB (recommended)
- **State Organization**: Separate state files per module

## Scaling Strategies

### Horizontal Pod Autoscaling
- **Metrics Server**: Provides CPU/memory metrics
- **HPA**: Application-level pod autoscaling
- **Custom Metrics**: Support for Prometheus metrics

### Cluster Autoscaling
- **Cluster Autoscaler**: v9.45.0
- **Auto-discovery**: Automatically discovers node groups
- **Scaling Triggers**: Pod scheduling requirements
- **Scale-down**: Graceful node termination

### Manual Scaling
- Node group desired size can be adjusted
- Terraform lifecycle ignores desired_size changes (allows external scaling)

## High Availability

### Multi-AZ Deployment
- **EKS Control Plane**: Managed by AWS across multiple AZs
- **Node Groups**: Nodes distributed across 3 AZs
- **EFS**: Mount targets in all 3 private subnets
- **Load Balancers**: Multi-AZ by default

### Pod Disruption Budgets
- **Update Strategy**: Max 1 unavailable node during updates
- **Rolling Updates**: Zero-downtime deployments

### Backup and Recovery
- **EBS Snapshots**: Manual or automated via AWS Backup
- **EFS Backups**: AWS Backup service
- **S3 Versioning**: Enabled for critical buckets
- **Kubernetes Resources**: GitOps-based backup (recommended)

## Network Architecture

### Network Segmentation
- **Public Subnets**: Internet-facing resources (NAT, ALB)
- **Private Subnets**: Application workloads, EKS nodes
- **Security Groups**: 
  - Cluster security group
  - Node security group
  - Application-specific security groups

### Security Zones
- **DMZ**: Public subnets with Internet Gateway
- **Application Zone**: Private subnets with NAT Gateway
- **Database Zone**: Private subnets (future database deployment)

### Connectivity
- **Internet Access**: Via NAT Gateway for private subnets
- **VPN Access**: Pritunl VPN server for secure remote access
- **Direct Connect**: Can be added for hybrid connectivity

### GCP Deployment
- GKE (Google Kubernetes Engine)
- Cloud SQL, Firestore, Cloud Storage
- VPC networking
- Cloud IAM integration

### Azure Deployment
- AKS (Azure Kubernetes Service)
- Azure SQL, Cosmos DB, Blob Storage
- Virtual Network
- Azure AD integration

## Scaling Strategies

### Horizontal Scaling
- Stateless service scaling
- Database read replicas
- Caching layers
- Load balancing

### Vertical Scaling
- Resource allocation
- Performance tuning
- Capacity planning

### Auto-Scaling Policies
- CPU-based scaling
- Memory-based scaling
- Request-based scaling
- Custom metrics

## High Availability

### Redundancy
- Multi-availability zone deployment
- Database replication
- Service redundancy

### Failover Mechanisms
- Automatic failover
- Health checks
- Circuit breakers

### Disaster Recovery
- Backup strategies
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)

## Network Architecture

### Network Segmentation
- Public-facing services
- Internal services
- Database isolation

### Security Zones
- DMZ configuration
- Private subnets
- Network security groups

### Connectivity
- VPN connections
- Direct connect/ExpressRoute
- Internet gateway

## Resource Management

### Compute Resources
- CPU allocation
- Memory allocation
- Storage allocation

### Cost Optimization
- Reserved instances
- Spot instances
- Resource tagging
- Cost monitoring

## Operational Considerations

### Deployment Process
- Blue-green deployments
- Canary releases
- Rolling updates

### Configuration Management
- Environment variables
- Config maps
- Secrets management

### Monitoring and Alerting
- Infrastructure metrics
- Application metrics
- Alert rules
- Incident response

## Related Documentation

- [Platform Architecture](./02-platform-architecture.md)
- [Observability](./06-observability.md)
- [Hybrid and Multicloud](./07-hybrid-and-multicloud.md)
