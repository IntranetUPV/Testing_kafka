import { Kafka } from 'kafkajs';

// Setup Kafka Server
const CLIENT_ID = 'tlrc-login-system';
const INPUT_TOPIC = 'test-topic';
const BROKERS = ['localhost:9092']
const kafka = new Kafka({
    clientId: CLIENT_ID,
    brokers: BROKERS
});

// Producer Setup
const producer = kafka.producer();
async function initKafkaProducer() {
    await producer.connect();
}
async function produceKafkaEvent(payload) {
  await producer.send({
    topic: INPUT_TOPIC,
    messages: [{ value: JSON.stringify(payload) }],
  });
}
export { initKafkaProducer, produceKafkaEvent }

