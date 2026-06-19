from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json
from pyspark.sql.types import StructType, StringType, LongType

spark = SparkSession.builder \
    .appName("KafkaIntranetPortal") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
    .getOrCreate()

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

query = parsed_df.writeStream \
    .outputMode("append") \
    .format("console") \
    .start()

query.awaitTermination()