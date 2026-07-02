const kafka = require('../kafkaClient');

// INPUT_TOPIC is where raw events will be sent to Kafka for data transformation via a Spark server.
// OUTPUT_TOPIC is where Spark will send the transformed data which the Dashboard will read from. 
const INPUT_TOPIC = 'test-topic';
const OUTPUT_TOPIC = 'processed-events';
const GROUP_ID = 'intranet-portal-group';

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: GROUP_ID });

// Recent Messages Queue
const recentMessages = [];
const MAX_MESSAGES = 100;

async function startKafka(onMessage) {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: OUTPUT_TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const entry = {
        topic, partition,
        offset: message.offset,
        value: message.value.toString(),
        receivedAt: new Date().toISOString(),
      };

      // Queue enqueue and handling recent messages
      recentMessages.unshift(entry);
      if (recentMessages.length > MAX_MESSAGES) recentMessages.pop();
      onMessage(entry);
    },
  });
}

async function sendEvent(payload) {
  await producer.send({
    topic: INPUT_TOPIC,
    messages: [{ value: JSON.stringify(payload) }],
  });
}

function getRecentMessages() {
  return recentMessages;
}

module.exports = { startKafka, sendEvent, getRecentMessages };