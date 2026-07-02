import { getLoginEvents } from "./../models/login-model.js";
export default async function readLoginsController(req, res) {
    try {
        res.status(200).json({ status: `sent successfully`, logins: getLoginEvents()});
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
}