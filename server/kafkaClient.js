const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'intranet-portal-app',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});

module.exports = kafka;