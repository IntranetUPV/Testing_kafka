const kafka = require('../kafkaClient');

const consumer = kafka.consumer({ groupId: 'intranet-portal-group' });

async function run() {
  await consumer.connect();
  console.log('Consumer connected to Kafka');

  await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        value: message.value.toString(),
      });
    },
  });
}

run().catch((err) => {
  console.error('Error running consumer:', err);
  process.exit(1);
});