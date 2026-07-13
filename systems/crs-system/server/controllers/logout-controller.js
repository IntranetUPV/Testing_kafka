import { produceKafkaEvent } from './../kafka.js';
import { getLoginAccount, setLoginAccount } from './../models/login-model.js';

const SYSTEM_NAME = process.env.SYSTEM_NAME || 'crs';

async function logoutController(req, res) {
  try {
    const studentId = getLoginAccount();
    setLoginAccount(null);
    await produceKafkaEvent({
      event: 'logged_out',
      studentId,
      timestamp: Date.now(),
      system: SYSTEM_NAME,
    });
    res.status(200).json({ status: `logged out ${studentId}` });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to log out' });
  }
}
export default logoutController;