---
title: Serverless databases
---

I'm intrigued by serverless computing, but doing anything interesting requires a database backend.
This post looks at (almost) all the options, as of September 2019.

{% include toc %}


## Serverless with free tier
These services are all serverless databases of some description with a permanent free tier.


### Amazon DynamoDB
[Amazon DynamoDB](https://aws.amazon.com/dynamodb/) is a NoSQL key/value and document store.
Widely used, considered the default storage solution for AWS Lambda.
Everyone hates it.
No full-text search.

Limitations:

* 25 GB storage
* 25 provisioned write capacity units (strongly-consistent <4KB writes/sec)
* 25 provisioned read capacity units (strongly-consistent <4KB reads/sec)


### GCP Firestore
[Google Cloud Platform Firestore](https://cloud.google.com/firestore/) is a brand new NoSQL document store.
It's predecessor (Firebase Realtime Database) has a bad reputation, but Firestore seems okay so far.
No full-text search.

Limitations:

* 1 GB storage (then USD$0.18/GB)
* 50K reads per day (then USD$0.06/100K)
* 20K writes per day (then USD$0.18/100K)
* 20K deletes per day (then USD$0.02/100K)
* 10 GiB/month network egress (then USD$0.12/GB, or more for Australia/China)

Note that egress to other GCP services in the same region is free, so it would work well with [Google Cloud Functions](https://cloud.google.com/functions/), which gets 5 GB/month.


### FaunaDB
[FaunaDB](https://fauna.com) is a multi-model (relational, document, graph, composite) NoSQL database.
No-one hates it and there's a bit of buzz around the technical aspects, but no-one has much to say about using it in production.
No full-text search.

Limitations:
* 5 GB storage (then USD$0.18/GB/month)
* 100K reads per day (then USD$0.05/100K)
* 50K writes per day (then USD$0.20/100K)
* 50MB egress per day (then USD$0.10/GB)

See [Netlify blog post](https://www.netlify.com/blog/2018/07/09/building-serverless-crud-apps-with-netlify-functions-faunadb/) on building CRUD apps with Netlify Functions and FaunaDB.





## Serverless without free tier
These services are serverless databases without a permanent free tier.


### Amazon Aurora
[Amazon Aurora](https://aws.amazon.com/rds/aurora) is a managed MySQL and PostgreSQL-compatible relational database.
It is not part of the AWS free tier.
You can get it as on-demand or reserved instances like the other Amazon RDS services (see [below](#amazon-rds)), or in the "Aurora Serverless" auto-scaling configuration.
In the serverless configuration it will pause when there are no connections for five minutes (by default), after which you are only charged for storage.
Unfortunately it takes so long to resume again (sometimes over 30 seconds) that [Lambda functions and API Gateway endpoints time out](https://dev.to/dvddpl/how-to-deal-with-aurora-serverless-coldstarts-ml0), which makes that feature less useful than it could be.
Running constantly in the lowest capacity setting costs USD$43.80/month, which is about twice as much as the smallest one-year reserved instance.
Additionally, storage is USD$0.1/GB/month and IO is USD$0.2/million requests.


### Azure Cosmos DB
[Azure Cosmos DB](https://azure.microsoft.com/en-us/services/cosmos-db/) is a multi-model NoSQl database.
The free tier has 400 RU/s (allegedly equivalent to 267.8B reads/s) of provisioned throughput and 5 GB of storage for the first year.
The minimum throughput is 400RU/s, which costs USD$23.36/month.
Storage is USD$0.25/GB/month.





## Not actually serverless, but free or convenient
These services are relational databases which either have a limited-time free tier, or are convenient to use with a common serverless platform.
For why you might not want to use these, see [Bharat Arimilli's post](https://medium.com/swlh/databases-that-play-nice-with-your-serverless-backend-13eb7dc1e1c).


### Amazon RDS
[Amazon RDS](https://aws.amazon.com/rds/) is managed PostgreSQL, MySQL, MariaDB, Oracle Database, and Microsoft SQL Server.
The free tier has a db.t2.micro for the first year.
After that, a one-year reserved db.t2.micro would be USD$9.25 for PostgreSQL, USD$8.50/month for MySQL, USD$10.92 for MariaDB, USD$18.40 for Oracle, or USD$10.91 for SQL Server.
A db.t3.micro would be the same price or cheaper and allegedly has better price/performance.

Limitations (db.t2.micro):

* 1 shared CPU core ("up to 3.3 GHz" Intel Xeon Scalable Processor)
* CPU credits equivalent to 10% of a core, which accrue when idle (until reaching \~5 hrs)
* 1 GB memory
* 20 GB storage
* 20 GB storage for backups snapshots
* "Low to moderate" network performance
* 1 GB/month network egress (then USD$0.09/GB)

Note that egress to most other AWS services in the same region is free, so it would work well with [AWS Lambda](https://aws.amazon.com/lambda/).



### Azure SQL Database
[Azure SQL Database](https://azure.microsoft.com/en-us/services/sql-database/) is managed Microsoft SQL Server.
The pricing is horrifically complicated.
The free tier has a single database at the Basic service tier under the DTU purchase model for the first year.
After that it would be USD$4.90/month.

Limitations:

* "Low" CPU
* 5 DTUs (12.5 IOPS)
* 2 GB storage



### Heroku Postgres
[Heroku Postgres](https://www.heroku.com/postgres) is managed PostgreSQL.
The Hobby Dev tier is free.

Limitations:

* 10,000 row limit
* No in-memory cache (poor performance)
* SLA is < 4 hr downtime per month (unannounced maintenance etc)

See [Matt Welke's post](https://mattwelke.com/2019/01/06/free-tier-managed-sql-with-aws-lambda-and-heroku-postgres.html) on Heroku Postgres with AWS Lambda.


### Host it yourself on Google Compute Engine
[Google Compute Engine](https://cloud.google.com/compute/) has a free F1-micro instance in the "always free" tier, which could be used to host any database.
Limitations:

* 1 shared CPU core
* 0.6 GB memory
* 30 GB storage (including OS)
* 1 GB/month network egress (charged for overage and traffic to Australia/China)

Note that egress to other GCP services in the same region is free, so it would work well with [Google Cloud Functions](https://cloud.google.com/functions/), which gets 5 GB/month.

See this [Google Community Tutorial](https://cloud.google.com/community/tutorials/setting-up-postgres) on setting up PostgreSQL.


### Host it yourself on Amazon EC2
[Amazon EC2](https://aws.amazon.com/ec2) has a free t2.micro instance for the first year, which could be used to host any database.
There is also 30 GB free [Elastic Block Storage](https://aws.amazon.com/ebs) for the first year, which includes the OS.
After that, a one-year reserved t2.nano is USD$2.41/month and EBS General Purpose (SSD) is USD$0.1/GB/month.
A t3.micro or t3a.micro would be the same price or cheaper and allegedly has better price/performance.

Limitations (t2.nano/t2.micro):

* 1 shared CPU core
* CPU credits equivalent to 5%/10% of a core, which accrue when idle (until reaching \~5 hrs)
* 0.5/1 GB memory
* "Low"/"low to moderate" network performance
* 1 GB/month network egress (then USD$0.09/GB)

Note that egress to most other AWS services in the same region is free, so it would work well with [AWS Lambda](https://aws.amazon.com/lambda/).





## Conclusions
Here's a very rough judgment on all of the above:

* DynamoDB sounds good on paper but probably isn't worth the trouble.
* Firestore is worth a look.
* FaunaDB is worth a look.
* Aurora Serverless could be good for scaling up, but doesn't scale down far enough to interest me.
* RDS is a cheap and easy way to get a standard database up and running.
* SQL Database only makes sense if you're already locked in to Microsoft SQL server.
* Heroku Postgres is too limited in the free/cheap tiers and much more expensive than Amazon RDS in the higher tiers.
* Hosting your own on GCP or EC2 is cheap, although fiddly.
