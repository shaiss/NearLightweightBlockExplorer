# NEAR Indexer Architecture on AWS

## Overview

Based on research of AWS best practices and NEAR's official indexer architecture, here's a comprehensive guide for setting up a NEAR blockchain indexer on AWS.

---

## NEAR Lake Indexer Architecture (Official Approach)

### What is NEAR Lake?

**NEAR Lake** is the official indexer built by Pagoda Inc. that stores blockchain data as JSON files on **AWS S3**. This is the foundation for building custom indexers.

### Key Components

1. **Data Storage**: AWS S3 (Public buckets maintained by Pagoda)
   - `near-lake-data-mainnet` (eu-central-1)
   - `near-lake-data-testnet` (eu-central-1)
   - Requester-pays model (you pay for S3 access with your AWS credentials)

2. **Data Structure**:
   ```
   <block_height>/
     block.json          # Block metadata
     shard_0.json        # Shard data
     shard_1.json
     ...
     shard_N.json
   ```

3. **NEAR Lake Framework**: Libraries to consume S3 data
   - Rust: `near-lake-framework-rs`
   - JavaScript: `@near-lake/framework`
   - Python: `near-lake-framework`

### Advantages
✅ No need to run your own NEAR node  
✅ Data already indexed and stored  
✅ Pay only for S3 access  
✅ Historical data readily available  

### Disadvantages
❌ Ongoing S3 costs (requester-pays)  
❌ Dependency on Pagoda's infrastructure  
❌ Latency from S3 reads  

---

## AWS Database Options for Blockchain Indexers

### 1. **Amazon RDS PostgreSQL** ⭐ RECOMMENDED for NEAR

**Why PostgreSQL?**
- Official NEAR Explorer uses PostgreSQL
- Rich indexing capabilities (B-tree, GiST, GIN, BRIN)
- JSON/JSONB support for flexible schema
- Full ACID compliance
- Mature ecosystem with extensive tooling

**Best For**:
- Complex queries across multiple tables
- Transaction history lookups
- Account activity tracking
- Relational data (blocks → transactions → receipts)

**AWS Options**:
- **Amazon RDS PostgreSQL**: Managed PostgreSQL, good for moderate scale
- **Amazon Aurora PostgreSQL**: Better performance, auto-scaling, higher availability
  - Up to 5x faster than standard PostgreSQL
  - Auto-scaling storage (10GB → 128TB)
  - 15 read replicas
  - Multi-AZ by default

**Estimated Costs** (us-east-1):
- RDS PostgreSQL db.r6g.xlarge: ~$280/month
- Aurora PostgreSQL db.r6g.xlarge: ~$350/month (serverless v2 available)

**Schema Considerations**:
```sql
-- Example tables for NEAR indexer
blocks (block_height, block_hash, timestamp, author, ...)
transactions (tx_hash, signer_id, receiver_id, block_height, ...)
receipts (receipt_id, predecessor_id, receiver_id, ...)
accounts (account_id, balance, storage_usage, ...)
ft_events (event_id, account_id, amount, token_contract, ...)
nft_events (event_id, account_id, token_id, contract, ...)
```

---

### 2. **Amazon DynamoDB** (NoSQL Alternative)

**When to Use**:
- Simple key-value lookups
- Extremely high throughput requirements (millions of requests/sec)
- Need microsecond latency
- Predictable access patterns

**Best For**:
- Account balance lookups by account_id
- Transaction status by tx_hash
- Block data by block_height
- Real-time dashboards with simple queries

**Limitations**:
- Complex queries are difficult (no JOINs)
- Expensive for high throughput
- Limited indexing (only primary key + secondary indexes)
- Not ideal for analytical queries

**Cost Model**:
- On-demand: $1.25 per million write requests, $0.25 per million read requests
- Provisioned: Pay for reserved capacity (cheaper at scale)
- Storage: $0.25/GB/month

**Use Case Example**:
```
Table: Blocks
  Primary Key: block_height
  Attributes: block_hash, timestamp, author, chunks_count

Table: Transactions  
  Primary Key: tx_hash
  GSI: signer_id-timestamp-index
  Attributes: receiver_id, block_height, status, actions
```

---

### 3. **Amazon Timestream** (Time-Series Database)

**When to Use**:
- Time-series analytics on blockchain data
- Metrics and monitoring (blocks/sec, gas usage over time)
- Historical trend analysis
- Aggregations over time windows

**Best For**:
- Block production rate tracking
- Gas price trends
- Transaction volume over time
- Validator performance metrics

**Advantages**:
- Optimized for time-series queries
- Automatic data lifecycle management
- Built-in time-series functions
- Cost-effective for large time-series datasets

**Cost**: ~$0.50 per million writes, $0.01 per GB scanned

**Not Suitable For**:
- Primary transaction/block storage
- Complex relational queries
- Account state lookups

---

### 4. **Hybrid Approach** ⭐⭐ RECOMMENDED for Production

Combine multiple databases for optimal performance:

```
┌─────────────────────────────────────────────────┐
│  NEAR Lake (S3)                                 │
│  - Source of truth                              │
│  - Historical blockchain data                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Indexer Service (EC2/ECS/Lambda)               │
│  - Processes S3 data                            │
│  - Transforms and routes to databases           │
└──────┬──────────┬──────────┬────────────────────┘
       │          │          │
       ▼          ▼          ▼
┌──────────┐ ┌─────────┐ ┌──────────────┐
│ Aurora   │ │DynamoDB │ │ Timestream   │
│PostgreSQL│ │         │ │              │
│          │ │         │ │              │
│- Complex │ │- Fast   │ │- Analytics   │
│  queries │ │  lookups│ │- Metrics     │
│- History │ │- Account│ │- Trends      │
│- Analytics│ │  state │ │              │
└──────────┘ └─────────┘ └──────────────┘
       │          │          │
       └──────────┴──────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  ElastiCache (Redis)                            │
│  - Cache layer for hot data                     │
│  - Latest blocks, account balances              │
└─────────────────────────────────────────────────┘
```

**Data Routing Strategy**:
1. **Aurora PostgreSQL**: All data for complex queries and analytics
2. **DynamoDB**: Hot data (latest blocks, account states) for fast lookups
3. **Timestream**: Metrics and time-series analytics
4. **Redis (ElastiCache)**: Cache for frequently accessed data

---

## Recommended AWS Architecture for NEAR Indexer

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Data Source                                                 │
│  ┌────────────────┐         ┌─────────────────┐            │
│  │ NEAR Lake S3   │   OR    │ NEAR Node (RPC) │            │
│  │ (Pagoda)       │         │ (Self-hosted)   │            │
│  └────────┬───────┘         └────────┬────────┘            │
└───────────┼──────────────────────────┼──────────────────────┘
            │                          │
            └──────────┬───────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Ingestion Layer                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Amazon MSK (Kafka) or Amazon Kinesis Data Streams      │ │
│  │ - Buffer incoming blockchain data                      │ │
│  │ - Decouple producers from consumers                    │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Processing Layer                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ AWS Lambda or ECS/Fargate                              │ │
│  │ - Parse blocks, transactions, receipts                 │ │
│  │ - Transform data for different databases               │ │
│  │ - Handle FT/NFT event extraction                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Alternative: Amazon Managed Service for Apache Flink       │
│  - Stream processing for real-time transformations          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Storage Layer                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Aurora       │  │ DynamoDB     │  │ Timestream   │      │
│  │ PostgreSQL   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ElastiCache (Redis) - Caching Layer                  │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  API Layer                                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ API Gateway + Lambda or ECS/Fargate                    │ │
│  │ - REST/GraphQL API for explorer frontend              │ │
│  │ - Query optimization and caching                       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. **Data Ingestion: MSK vs Kinesis**

#### Amazon MSK (Managed Streaming for Apache Kafka)
**Use When**:
- You need Kafka-specific features
- Multiple consumers need different views of the same data
- You want exactly-once semantics
- Complex stream processing with Kafka Streams

**Pros**:
- Industry-standard Kafka
- Rich ecosystem
- Multiple consumer groups
- Message replay capability

**Cons**:
- More expensive than Kinesis
- Requires Kafka expertise
- More complex setup

**Cost**: ~$300-500/month for small cluster (3 brokers, kafka.m5.large)

#### Amazon Kinesis Data Streams
**Use When**:
- AWS-native solution preferred
- Simpler use case
- Need tight integration with AWS services
- Lower operational overhead

**Pros**:
- Fully managed, serverless
- Easy integration with Lambda, Firehose
- Lower cost for moderate throughput
- Auto-scaling

**Cons**:
- AWS-specific (vendor lock-in)
- 7-day retention max (extended to 365 days with extra cost)

**Cost**: ~$15/month per shard (1MB/sec write, 2MB/sec read)

**Recommendation**: Use **Kinesis** for simpler setups, **MSK** for complex multi-consumer scenarios.

---

### 2. **Processing: Lambda vs ECS/Fargate vs Flink**

#### AWS Lambda
**Best For**:
- Event-driven processing
- Low to moderate throughput
- Stateless transformations
- Cost optimization (pay per invocation)

**Limitations**:
- 15-minute timeout
- Limited memory (10GB max)
- Cold starts

**Cost**: Very cheap for moderate volume (~$20-50/month for millions of invocations)

#### ECS/Fargate
**Best For**:
- Long-running indexer processes
- Stateful processing
- High throughput requirements
- Custom runtime environments

**Pros**:
- No timeout limits
- Full control over environment
- Can run complex indexer logic

**Cost**: ~$30-100/month per task (depending on CPU/memory)

#### Amazon Managed Service for Apache Flink
**Best For**:
- Complex stream processing
- Real-time analytics
- Stateful computations
- Window-based aggregations

**Use Case**: Real-time metrics, aggregations, complex event processing

**Cost**: ~$0.11/hour per KPU (Kinesis Processing Unit)

**Recommendation**: 
- **Lambda** for simple transformations
- **ECS/Fargate** for full indexer service
- **Flink** for real-time analytics

---

### 3. **Caching: ElastiCache Redis**

**Why Redis?**
- Sub-millisecond latency
- Reduce database load
- Cache frequently accessed data

**What to Cache**:
- Latest 100 blocks
- Account balances (with TTL)
- Popular account activity
- Network status/stats

**Cost**: ~$15-50/month (cache.t3.micro to cache.t3.medium)

---

## Cost Estimation (Monthly)

### Minimal Setup (Development/Small Scale)
- **Kinesis**: 2 shards → $30
- **Lambda**: Processing → $20
- **RDS PostgreSQL** (db.t3.medium): $60
- **ElastiCache** (cache.t3.micro): $15
- **S3 Lake Access**: $10-50 (depending on usage)
- **Total**: ~$135-175/month

### Production Setup (Medium Scale)
- **MSK**: 3 brokers (kafka.m5.large) → $400
- **ECS Fargate**: 2 tasks → $150
- **Aurora PostgreSQL** (db.r6g.xlarge): $350
- **DynamoDB**: On-demand → $50-200
- **ElastiCache** (cache.r6g.large): $150
- **Timestream**: $50
- **S3 Lake Access**: $100
- **Total**: ~$1,250-1,450/month

### Enterprise Setup (High Scale)
- **MSK**: 6 brokers (kafka.m5.2xlarge) → $1,600
- **ECS Fargate**: 5 tasks → $375
- **Aurora PostgreSQL** (db.r6g.4xlarge): $1,400
- **DynamoDB**: Provisioned capacity → $500
- **ElastiCache** (cache.r6g.2xlarge): $600
- **Timestream**: $200
- **S3 Lake Access**: $300
- **Total**: ~$4,975/month

---

## Best Practices

### 1. **Database Design**
- Use **partitioning** for large tables (partition by block_height ranges)
- Create **indexes** on frequently queried columns (account_id, tx_hash, block_height)
- Use **materialized views** for complex aggregations
- Implement **data retention policies** (archive old data to S3)

### 2. **Monitoring**
- **CloudWatch**: Metrics, logs, alarms
- **X-Ray**: Distributed tracing
- **RDS Performance Insights**: Database performance
- **Custom Metrics**: Indexer lag, blocks processed/sec

### 3. **Scaling**
- **Horizontal scaling**: Add more ECS tasks or Lambda concurrency
- **Database read replicas**: Distribute read load
- **Caching**: Reduce database queries
- **Data partitioning**: Improve query performance

### 4. **Reliability**
- **Multi-AZ deployment**: High availability
- **Automated backups**: RDS snapshots, DynamoDB backups
- **Dead letter queues**: Handle failed processing
- **Idempotent processing**: Handle duplicate events

### 5. **Security**
- **VPC**: Isolate resources
- **Security groups**: Restrict access
- **IAM roles**: Least privilege access
- **Encryption**: At rest and in transit
- **Secrets Manager**: Store credentials

---

## Recent AWS Resources (2024-2025)

1. **AWS Sample Blockchain Indexer** (GitHub)
   - https://github.com/aws-samples/sample-blockchain-indexer
   - Architecture: MSK + Flink + RDS
   - For Ethereum, but patterns apply to NEAR

2. **AWS Builder Center** (June 2025)
   - Best practices for blockchain indexer deployment
   - Cosmos-based chain example (similar to NEAR)

3. **AWS Public Blockchain Datasets** (2024)
   - Expanded to include more chains
   - Pattern for accessing blockchain data on AWS

---

## Comparison: Database Choices

| Database | Best Use Case | Query Complexity | Cost | Scalability | NEAR Compatibility |
|----------|---------------|------------------|------|-------------|-------------------|
| **Aurora PostgreSQL** | Primary indexer DB | High | $$$ | Excellent | ⭐⭐⭐⭐⭐ |
| **RDS PostgreSQL** | Budget indexer DB | High | $$ | Good | ⭐⭐⭐⭐ |
| **DynamoDB** | Fast lookups | Low | $-$$$ | Excellent | ⭐⭐⭐ |
| **Timestream** | Time-series analytics | Medium | $ | Excellent | ⭐⭐⭐ |
| **Redis (ElastiCache)** | Caching | N/A | $ | Good | ⭐⭐⭐⭐⭐ |

---

## Recommended Stack for NEAR Localnet

For **localnet development**, you don't need the full AWS stack. Instead:

1. **Local PostgreSQL** (Docker): Free, full-featured
2. **Local Redis** (Docker): Optional caching
3. **Direct RPC connection**: No need for Lake/S3
4. **Simple indexer script**: Python/Node.js script to poll RPC

This avoids AWS costs entirely while developing, then migrate to AWS for production.

---

## Conclusion

**For NEAR Indexer on AWS, the recommended approach is**:

1. **Data Source**: NEAR Lake (S3) for historical data + RPC for real-time
2. **Ingestion**: Amazon Kinesis Data Streams (simpler) or MSK (more robust)
3. **Processing**: ECS/Fargate for indexer service, Lambda for lightweight tasks
4. **Primary Database**: Aurora PostgreSQL (best balance of features/performance)
5. **Fast Lookups**: DynamoDB for hot data
6. **Analytics**: Timestream for metrics
7. **Caching**: ElastiCache Redis
8. **Monitoring**: CloudWatch + RDS Performance Insights

This architecture provides scalability, reliability, and cost-effectiveness for a production NEAR blockchain indexer.

