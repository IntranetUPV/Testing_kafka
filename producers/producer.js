const kafka = require('../kafkaClient');

const producer = kafka.producer();

async function run() {
  await producer.connect();
  console.log('Producer connected to Kafka');

  // Simulate sending an event, e.g. from a University System like SIS or LMS
  await producer.send({
    topic: 'test-topic',
    messages: [
      { value: JSON.stringify({ event: 'student_login', studentId: '202302760', timestamp: Date.now() }) },
    ],
  });

  console.log('Message sent!');
  await producer.disconnect();
}

run().catch((err) => {
  console.error('Error running producer:', err);
  process.exit(1);
});