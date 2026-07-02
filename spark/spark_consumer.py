from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, from_json, to_json, struct, current_timestamp,
    window, count, when
)
from pyspark.sql.types import StructType, StringType, LongType

spark = SparkSession.builder \
    .appName("KafkaIntranetPortal") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.13:4.1.2") \
    .getOrCreate()

spark.sparkContext.setLogLevel("OFF")

schema = StructType() \
    .add("event", StringType()) \
    .add("studentId", StringType()) \
    .add("timestamp", LongType())

raw_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "test-topic") \
    .option("startingOffsets", "earliest") \
    .load()

parsed_df = raw_df.selectExpr("CAST(value AS STRING) as json_str") \
    .select(from_json(col("json_str"), schema).alias("data")) \
    .select("data.*")

# Enrich each event with category and processedAt
enriched_df = parsed_df \
    .withColumn("processedAt", current_timestamp().cast("string")) \
    .withColumn("eventCategory",
        when(col("event").startswith("student_"), "student")
        .when(col("event").startswith("faculty_"), "faculty")
        .otherwise("system")
    )

# Windowed aggregation: count events per student per 1-min window (slides every 30s)
# Converts ms timestamp to a proper timestamp column for windowing
windowed_df = parsed_df \
    .withColumn("eventTime", (col("timestamp") / 1000).cast("timestamp")) \
    .withWatermark("eventTime", "1 minute") \
    .groupBy(
        window(col("eventTime"), "1 minute", "30 seconds"),
        col("studentId")
    ) \
    .agg(count("*").alias("eventCount")) \
    .withColumn("flagged", col("eventCount") > 5) \
    .withColumn("windowStart", col("window.start").cast("string")) \
    .withColumn("windowEnd", col("window.end").cast("string")) \
    .withColumn("processedAt", current_timestamp().cast("string")) \
    .withColumn("event", when(col("flagged"), "high_activity_alert").otherwise("activity_summary")) \
    .drop("window")

# Route 1: enriched individual events -> processed-events topic
enriched_output = enriched_df.select(
    to_json(struct([col(c) for c in enriched_df.columns])).alias("value")
)

query = enriched_output.writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "processed-events") \
    .option("checkpointLocation", "C:/tmp/spark-checkpoints/processed-events") \
    .outputMode("append") \
    .start()

# Route 2: windowed aggregations -> aggregated-events topic
windowed_output = windowed_df.select(
    to_json(struct([col(c) for c in windowed_df.columns])).alias("value")
)

agg_query = windowed_output.writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "aggregated-events") \
    .option("checkpointLocation", "C:/tmp/spark-checkpoints/aggregated-events") \
    .outputMode("update") \
    .start()

# Debug: print aggregations to console
debug_query = windowed_df.writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", False) \
    .start()

query.awaitTermination()