from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, to_json, struct, current_timestamp
from pyspark.sql.types import StructType, StringType, LongType

spark = SparkSession.builder \
    .appName("KafkaIntranetPortal") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

schema = StructType() \
    .add("event", StringType()) \
    .add("studentId", StringType()) \
    .add("timestamp", LongType())

# Read raw events from the original topic
raw_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "test-topic") \
    .option("startingOffsets", "earliest") \
    .load()

parsed_df = raw_df.selectExpr("CAST(value AS STRING) as json_str") \
    .select(from_json(col("json_str"), schema).alias("data")) \
    .select("data.*")

# This is where your actual processing/cleaning logic goes.
# Right now it just passes the data through and tags it as processed,
# but you can add .filter(), .withColumn(), aggregations, etc. here.
processed_df = parsed_df \
    .withColumn("processedAt", current_timestamp().cast("string")) \
    .withColumn("source", col("event"))

# Kafka sink requires a single "value" column containing the message body
output_df = processed_df.select(
    to_json(struct([col(c) for c in processed_df.columns])).alias("value")
)

# Write processed results to a NEW topic that the Express server listens to
query = output_df.writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "processed-events") \
    .option("checkpointLocation", "C:/tmp/spark-checkpoints/processed-events") \
    .outputMode("append") \
    .start()

# Optional: also print to console so you can see it's working while developing
debug_query = processed_df.writeStream \
    .outputMode("append") \
    .format("console") \
    .start()

query.awaitTermination()