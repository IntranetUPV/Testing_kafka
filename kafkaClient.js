const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'intranet-portal-app',
  brokers: ['localhost:9092'],
});

module.exports = kafka;