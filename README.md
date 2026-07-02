# Kafka Demo Project Setup Guide

This project contains a Kafka-based event pipeline with:
- a main client/server app
- a CRS demo system
- a TLRC login demo system
- a Spark consumer for processing incoming events

The recommended run order is:
1. Start Apache Kafka
2. Start Spark
3. Start the server apps
4. Start the client apps

---

## 1) Prerequisites

Install the following on your machine:
- Node.js and npm
- Python 3
- Java (required for Spark)
- Docker Desktop (recommended for Kafka)

For Windows PowerShell, open a terminal and confirm:

```powershell
node -v
npm -v
python --version
java -version
docker --version
```

---

## 2) Start Apache Kafka

### Option A: Recommended - Docker Compose
From the project root:

```powershell
cd "c:\Users\hulle\OneDrive\Desktop\Internship\learning\Testing_kafka"
docker compose up -d
```

Check that the containers are running:

```powershell
docker compose ps
```

If you need to create the topic used by the project, run:

```powershell
docker exec -it broker-1 bash -c "kafka-topics.sh --create --topic test-topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1"
```

### Option B: Manual Apache Kafka Setup
If you prefer not to use Docker:
1. Download and install Apache Kafka.
2. Start Zookeeper.
3. Start the Kafka broker.
4. Create the topic `test-topic`.

Make sure your Kafka broker is reachable at `localhost:9092`.

---

## 3) Start Spark

The Spark consumer reads from Kafka and processes events.

### Create a Python environment

```powershell
cd "c:\Users\hulle\OneDrive\Desktop\Internship\learning\Testing_kafka"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install pyspark
```

### Run the Spark consumer

```powershell
python .\spark\spark_consumer.py
```

Keep this terminal open while the app is running.

---

## 4) Start the main server and client

### Main server

```powershell
cd "c:\Users\hulle\OneDrive\Desktop\Internship\learning\Testing_kafka\server"
npm install
npm run server
```

### Main client

Open another terminal:

```powershell
cd "c:\Users\hulle\OneDrive\Desktop\Internship\learning\Testing_kafka\client"
npm install
npm run dev
```

The Vite client should open in your browser, usually at:
- http://localhost:5173

---

## 5) Start the CRS system

### CRS server

```powershell
cd "c:\Users\hulle\OneDrive\Desktop\Internship\learning\Testing_kafka\systems\crs-system\server"
npm install
npm start
```

### CRS client

Open another terminal:

```powershell
cd "c:\Users\hulle\OneDrive\Desktop\Internship\learning\Testing_kafka\systems\crs-system\client"
npm install
npm run dev
```

---

## 6) Start the TLRC login system

### TLRC server

```powershell
cd "c:\Users\hulle\OneDrive\Desktop\Internship\learning\Testing_kafka\systems\tlrc-login-system\server"
npm install
npm start
```

### TLRC client

Open another terminal:

```powershell
cd "c:\Users\hulle\OneDrive\Desktop\Internship\learning\Testing_kafka\systems\tlrc-login-system\client"
npm install
npm run dev
```

---

## 7) Troubleshooting

If something does not start:
- confirm Kafka is listening on `localhost:9092`
- confirm Spark has Java available
- confirm all Node dependencies were installed
- check the terminal output for port conflicts
