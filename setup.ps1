$ErrorActionPreference = 'Stop'

$root = $PWD.Path
$logsDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

function Start-BackgroundProcess {
    param(
        [Parameter(Mandatory = $true)] [string]$Name,
        [Parameter(Mandatory = $true)] [string]$WorkingDirectory,
        [Parameter(Mandatory = $true)] [string]$Command
    )

    $safeName = ($Name -replace '[^A-Za-z0-9]', '-').Trim('-')
    $logFile = Join-Path $logsDir "$safeName.log"
    $errorLogFile = Join-Path $logsDir "$safeName-error.log"
    $fullCommand = @"
Set-Location '$WorkingDirectory'
$Command
"@

    Start-Process powershell -ArgumentList @('-NoExit', '-Command', $fullCommand) -WorkingDirectory $WorkingDirectory -RedirectStandardOutput $logFile -RedirectStandardError $errorLogFile
}

function Wait-ForKafka {
    param(
        [int]$MaxAttempts = 30,
        [int]$DelaySeconds = 2
    )

    Write-Host 'Waiting for Kafka broker to become ready...'
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        docker exec kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host 'Kafka is ready.'
            return
        }
        Start-Sleep -Seconds $DelaySeconds
    }
    throw 'Kafka did not become ready in time.'
}

Set-Location $root

Write-Host 'Starting Kafka and the containerized app services...'
docker compose up -d --build kafka

Wait-ForKafka

Write-Host 'Creating topic test-topic if needed...'
docker exec --workdir /opt/kafka/bin/ kafka ./kafka-topics.sh --bootstrap-server kafka:9092 --create --topic test-topic --if-not-exists

Write-Host 'Creating topic processed-events if needed...'
docker exec --workdir /opt/kafka/bin/ kafka ./kafka-topics.sh --bootstrap-server kafka:9092 --create --topic processed-events --if-not-exists

Write-Host 'Creating topic aggregated-events if needed...'
docker exec --workdir /opt/kafka/bin/ kafka ./kafka-topics.sh --bootstrap-server kafka:9092 --create --topic aggregated-events --if-not-exists

Write-Host ''
Write-Host 'Starting remaining app services...'
docker compose up -d --build

Write-Host ''
Write-Host 'Starting Spark consumer locally...'
Start-BackgroundProcess -Name 'Spark consumer' -WorkingDirectory $root -Command 'if (-not (Test-Path .venv)) { python -m venv .venv }; .\.venv\Scripts\Activate.ps1; pip install pyspark==4.1.2; python .\spark\spark_consumer.py'

Write-Host ''
Write-Host 'Kafka and the containerized app services have been launched.'
Write-Host 'Open these URLs once the clients finish starting:'
Write-Host '  - Main client: http://localhost:45173'
Write-Host '  - CRS client: http://localhost:45174'
Write-Host '  - TLRC client: http://localhost:45175'
Write-Host ''
Write-Host 'Logs are being written to:'
Write-Host "  - $logsDir"