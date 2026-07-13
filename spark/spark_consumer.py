import os

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    from_json,
    to_json,
    struct,
    current_timestamp,
    window,
    count,
    when,
)
from pyspark.sql.types import StructType, StringType, LongType

CHECKPOINT_BASE = os.getenv("CHECKPOINT_BASE", "C:/tmp/spark-checkpoints/v5")
BOOTSTRAP_SERVERS = os.getenv("KAFKA_BROKERS", "localhost:9092")
INPUT_TOPIC = os.getenv("INPUT_TOPIC", "test-topic")
PROCESSED_TOPIC = os.getenv("PROCESSED_TOPIC", "processed-events")
AGGREGATED_TOPIC = os.getenv("AGGREGATED_TOPIC", "aggregated-events")


def build_spark_session():
    return (
        SparkSession.builder.appName("KafkaIntranetPortal")
        .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.2")
        .config("spark.sql.shuffle.partitions", "1")
        .config("spark.driver.host", "127.0.0.1")
        .config("spark.driver.bindAddress", "127.0.0.1")
        .config("spark.executor.heartbeatInterval", "20s")
        .config("spark.network.timeout", "120s")
        .getOrCreate()
    )


def main():
    spark = build_spark_session()
    spark.sparkContext.setLogLevel("WARN")

    for checkpoint_dir in [
        os.path.join(CHECKPOINT_BASE, "processed-events"),
        os.path.join(CHECKPOINT_BASE, "aggregated-events"),
    ]:
        os.makedirs(checkpoint_dir, exist_ok=True)

    schema = (
        StructType()
        .add("event", StringType())
        .add("studentId", StringType())
        .add("timestamp", LongType())
        .add("system", StringType())
    )

    raw_df = (
        spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", BOOTSTRAP_SERVERS)
        .option("subscribe", INPUT_TOPIC)
        .option("startingOffsets", "earliest")
        .option("failOnDataLoss", "false")
        .load()
    )

    parsed_df = (
        raw_df.selectExpr("CAST(value AS STRING) as json_str")
        .select(from_json(col("json_str"), schema).alias("data"))
        .select("data.*")
    )

    enriched_df = (
        parsed_df.withColumn("processedAt", current_timestamp().cast("string"))
        .withColumn(
            "eventCategory",
            when(col("event").startswith("student_"), "student")
            .when(col("event").startswith("faculty_"), "faculty")
            .otherwise("system"),
        )
    )

    windowed_df = (
        parsed_df.withColumn("eventTime", (col("timestamp") / 1000).cast("timestamp"))
        .withWatermark("eventTime", "1 minute")
        .groupBy(window(col("eventTime"), "1 minute", "30 seconds"), col("studentId"))
        .agg(count("*").alias("eventCount"))
        .withColumn("flagged", col("eventCount") > 5)
        .withColumn("windowStart", col("window.start").cast("string"))
        .withColumn("windowEnd", col("window.end").cast("string"))
        .withColumn("processedAt", current_timestamp().cast("string"))
        .withColumn("event", when(col("flagged"), "high_activity_alert").otherwise("activity_summary"))
        .drop("window")
    )

    enriched_output = enriched_df.select(
        to_json(struct([col(c) for c in enriched_df.columns])).alias("value")
    )

    query1 = enriched_output.writeStream.format("kafka") \
        .option("kafka.bootstrap.servers", BOOTSTRAP_SERVERS) \
        .option("topic", PROCESSED_TOPIC) \
        .option("checkpointLocation", os.path.join(CHECKPOINT_BASE, "processed-events")) \
        .outputMode("append") \
        .start()

    windowed_output = windowed_df.select(
        to_json(struct([col(c) for c in windowed_df.columns])).alias("value")
    )

    query2 = windowed_output.writeStream.format("kafka") \
        .option("kafka.bootstrap.servers", BOOTSTRAP_SERVERS) \
        .option("topic", AGGREGATED_TOPIC) \
        .option("checkpointLocation", os.path.join(CHECKPOINT_BASE, "aggregated-events")) \
        .outputMode("update") \
        .start()

    query3 = windowed_df.writeStream.outputMode("update").format("console").option("truncate", False).start()

    try:
        spark.streams.awaitAnyTermination()
    except KeyboardInterrupt:
        print("Stopping streams gracefully...")
        for q in [query1, query2, query3]:
            q.stop()
        spark.stop()


if __name__ == "__main__":
    main()