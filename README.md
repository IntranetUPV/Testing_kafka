# Kafka Demo Project Setup Guide

This project contains a Kafka-based event pipeline with:
- a main client/server app
- a CRS demo system
- a TLRC login demo system
- a Spark consumer for processing incoming events
---

## 1) Prerequisites

Install the following on your machine:
- Node.js and npm
- Python 3
- Java (required for Spark)
- Docker Desktop

Confirm the tools are available:

```powershell
node -v
npm -v
python --version
java -version
docker --version
```

---

## 2) One-command setup

From the project root, run:

```powershell
./setup.ps1
```

This will:
- start Kafka via Docker Compose
- create the test-topic topic
- print the next commands to launch the app services

You can also inspect the containers with:

```powershell
docker compose ps
```

---

## 3) Start Spark

The Spark consumer reads from Kafka and processes events.

Create a Python environment:

```powershell
cd "c:\Users\hulle\OneDrive\Documents\GitHub\Testing_kafka"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install pyspark
```

If ever there are problems with the container, reset container using docker compose up --build 
Keep this terminal open while the app is running.
