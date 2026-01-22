---
layout: default
title: Database and Storage
permalink: /docs/04-database-and-storage.html
---

# Database and Storage

## Data Architecture Overview

This document describes the data architecture, persistence models, storage solutions, and data management strategies for the Officeless platform deployed on AWS.

## Storage Architecture Diagram

<div class="mermaid-diagram-container">

![Mermaid Diagram]({{ site.baseurl }}/assets/diagrams/rendered/04-database-and-storage-diagram-1-bd370083.svg)

<details>
<summary>View Mermaid source code</summary>

```mermaid
graph TB
    subgraph "Application Layer - EKS Pods"
        App1[Application Pod 1]
        App2[Application Pod 2]
        App3[Application Pod 3]
    end
    
    subgraph "Block Storage - EBS"
        EBS1[(EBS Volume 1<br/>gp3<br/>200GB)]
        EBS2[(EBS Volume 2<br/>gp3<br/>200GB)]
        EBS3[(EBS Volume 3<br/>gp3<br/>200GB)]
    end
    
    subgraph "File Storage - EFS"
        EFS[(EFS File System<br/>eks-shared-storage<br/>Encrypted<br/>General Purpose)]
        EFS_AP1[EFS Access Point 1]
        EFS_AP2[EFS Access Point 2]
    end
    
    subgraph "Object Storage - S3"
        S3_App[S3 Application Buckets]
        S3_Mimir[(S3: Mimir Metrics<br/>mimir-metrics)]
        S3_Loki[(S3: Loki Logs<br/>loki-chunks)]
        S3_Tempo[(S3: Tempo Traces<br/>tempo-traces)]
        S3_Alert[(S3: Alertmanager<br/>mimir-alertmanager)]
    end
    
    subgraph "Cache Layer - Valkey"
        Valkey[(Valkey Cluster<br/>Redis-Compatible<br/>ElastiCache)]
    end
    
    subgraph "Database Layer"
        DB1[(Database Pod 1<br/>PostgreSQL/MySQL<br/>on EBS)]
        DB2[(Database Pod 2<br/>PostgreSQL/MySQL<br/>on EBS)]
    end
    
    subgraph "Monitoring Stack"
        Mimir[Mimir]
        Loki[Loki]
        Tempo[Tempo]
    end
    
    App1 --> EBS1
    App2 --> EBS2
    App3 --> EBS3
    
    App1 --> EFS_AP1
    App2 --> EFS_AP1
    App3 --> EFS_AP2
    EFS_AP1 --> EFS
    EFS_AP2 --> EFS
    
    App1 --> S3_App
    App2 --> S3_App
    App3 --> S3_App
    
    App1 --> Valkey
    App2 --> Valkey
    App3 --> Valkey
    
    App1 --> DB1
    App2 --> DB1
    App3 --> DB2
    DB1 --> EBS1
    DB2 --> EBS2
    
    Mimir --> S3_Mimir
    Loki --> S3_Loki
    Tempo --> S3_Tempo
    Mimir --> S3_Alert
    
    App1 --> Mimir
    App2 --> Loki
    App3 --> Tempo
```

</details>

</div>

</details>

</div>

## Storage Architecture

The Officeless platform uses a multi-tier storage architecture leveraging AWS storage services:

### Block Storage (EBS)

#### AWS EBS CSI Driver
- **Version**: v1.42.0-eksbuild.1 (EKS Add-on)
- **Storage Provisioner**: `kubernetes.io/aws-ebs`
- **Storage Class**: `gp3-sc` (GP3 with provisioned IOPS)

#### Storage Class Configuration
- **Type**: gp3 (General Purpose SSD)
- **File System**: ext4
- **Volume Binding Mode**: WaitForFirstConsumer (zone-aware scheduling)
- **Reclaim Policy**: Delete
- **Volume Expansion**: Enabled
- **IOPS**: Configurable (default 3000)
- **Throughput**: Configurable (default 125 MB/s)

#### Use Cases
- Database persistent volumes (PostgreSQL, MySQL, etc.)
- Application stateful storage
- High-performance workloads requiring low latency
- Single-pod access patterns

### File Storage (EFS)

#### AWS EFS CSI Driver
- **Version**: v3.1.8 (Helm chart)
- **Storage Provisioner**: `efs.csi.aws.com`
- **Storage Class**: `efs`

#### EFS File System Configuration
- **File System ID**: `eks-shared-storage`
- **Performance Mode**: General Purpose
- **Throughput Mode**: Bursting
- **Encryption**: Enabled at rest (AWS managed keys)
- **Mount Targets**: 3 (one per availability zone in private subnets)
- **Security**: Uses EKS cluster security group

#### Storage Class Configuration
- **Provisioning Mode**: EFS Access Points (efs-ap)
- **Directory Permissions**: 700
- **Mount Options**: IAM (for authentication)
- **Access Points**: Dynamic creation per PersistentVolumeClaim

#### Use Cases
- Shared file storage across multiple pods
- Content repositories
- Application logs (shared)
- Read-write-many (RWX) access patterns
- Multi-pod concurrent access

### Object Storage (S3)

#### S3 Buckets for Application Data
- Custom buckets created as needed for application requirements
- Versioning: Enabled for critical buckets
- Encryption: Server-side encryption (SSE-S3 or SSE-KMS)
- Lifecycle policies: Configurable for cost optimization

#### S3 Buckets for Observability Stack
- **Mimir Metrics**: `mimir-metrics`
- **Alertmanager State**: `mimir-alertmanager`
- **Mimir Rules**: `mimir-ruler`
- **Loki Chunks**: `loki-chunks`
- **Loki Rules**: `loki-ruler`
- **Tempo Traces**: `tempo-traces`

#### S3 Access Management
- IAM roles with Pod Identity for service accounts
- Bucket policies for fine-grained access control
- S3 access via AWS SDK or S3 API

### Caching Layer (Valkey)

#### Valkey (Redis-Compatible)
- **Module**: Gruntwork terraform-aws-cache module
- **Version**: v1.0.1
- **Compatibility**: Redis-compatible
- **Deployment**: ElastiCache-based

#### Configuration Options
- **Instance Types**: Configurable
- **Encryption**: 
  - At rest: Optional
  - In transit: Optional
- **High Availability**:
  - Single instance mode: Optional
  - Multi-AZ: Optional
  - Automatic failover: Optional
- **Scaling**: Auto-scaling support
- **Security**: 
  - VPC-based security groups
  - CIDR block restrictions
  - Auth token support

#### Use Cases
- Application caching
- Session storage
- Rate limiting
- Real-time data

## Data Architecture Principles

### Data Modeling
- Domain-driven design
- Normalization strategies for relational data
- Denormalization for performance (NoSQL)
- Schema evolution support

### Data Consistency
- **ACID Transactions**: Relational databases (RDS, self-managed)
- **Eventual Consistency**: NoSQL databases, caching layers
- **Distributed Transactions**: Application-level handling
- **Conflict Resolution**: Application-specific strategies

### Data Security
- **Encryption at Rest**: 
  - EBS: AWS managed keys (default)
  - EFS: AWS managed keys (enabled)
  - S3: Server-side encryption (SSE-S3 or SSE-KMS)
  - Valkey: Optional encryption at rest
- **Encryption in Transit**: 
  - TLS/SSL for database connections
  - TLS for EFS (via IAM authentication)
  - HTTPS for S3
  - TLS for Valkey (optional)
- **Access Controls**: 
  - IAM roles and policies
  - Kubernetes RBAC
  - Security groups
  - Network policies
- **Data Masking**: Application-level implementation

## Database Types and Usage

### Relational Databases
**Use Cases:**
- Transactional data
- Structured data with relationships
- ACID compliance requirements

**Technologies:**
- PostgreSQL
- MySQL/MariaDB
- SQL Server
- Oracle (enterprise)

**Features:**
- ACID transactions
- Complex queries
- Referential integrity
- SQL standard

### NoSQL Databases

#### Document Stores
**Use Cases:**
- Semi-structured data
- Content management
- User profiles

**Technologies:**
- MongoDB
- CouchDB
- DynamoDB (AWS)

#### Key-Value Stores
**Use Cases:**
- Caching
- Session storage
- Real-time data

**Technologies:**
- Redis
- Memcached
- DynamoDB

#### Column Stores
**Use Cases:**
- Time-series data
- Analytics
- Large-scale data

**Technologies:**
- Cassandra
- HBase
- Bigtable (GCP)

#### Graph Databases
**Use Cases:**
- Relationship-heavy data
- Social networks
- Recommendation engines

**Technologies:**
- Neo4j
- Amazon Neptune

## Storage Solutions

### Object Storage
**Use Cases:**
- File storage
- Media assets
- Backup and archival

**Technologies:**
- S3 (AWS)
- Cloud Storage (GCP)
- Blob Storage (Azure)
- MinIO (on-premises)

### Block Storage
**Use Cases:**
- Database volumes
- Application data
- High-performance storage

### File Storage
**Use Cases:**
- Shared file systems
- Legacy application support

## Data Patterns

### CQRS (Command Query Responsibility Segregation)
- Separate read and write models
- Event sourcing integration
- Read model optimization

### Event Sourcing
- Event store
- Event replay
- State reconstruction

### Data Replication
- Master-slave replication
- Multi-master replication
- Cross-region replication

### Sharding and Partitioning
- Horizontal partitioning
- Vertical partitioning
- Shard key selection

## Data Migration

### Migration Strategies
- Big bang migration
- Phased migration
- Parallel run
- Blue-green migration

### Data Transformation
- ETL processes
- Data validation
- Data quality checks

## Backup and Recovery

### Backup Strategies
- Full backups
- Incremental backups
- Continuous backup
- Point-in-time recovery

### Recovery Procedures
- Backup restoration
- Disaster recovery
- Data consistency verification

## Data Governance

### Data Classification
- Public data
- Internal data
- Confidential data
- Restricted data

### Data Retention
- Retention policies
- Data archival
- Data deletion

### Compliance
- GDPR compliance
- Data residency requirements
- Audit trails

## Performance Optimization

### Indexing Strategies
- Primary indexes
- Secondary indexes
- Composite indexes
- Index maintenance

### Query Optimization
- Query analysis
- Execution plans
- Query caching

### Caching Strategies
- Application-level caching
- Database query caching
- CDN caching

## Related Documentation

- [Platform Architecture](./02-platform-architecture.md)
- [Security and Governance](./05-security-and-governance.md)
- [Observability](./06-observability.md)
