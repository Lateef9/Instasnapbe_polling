import Client from '../models/Client.js';

export const authenticateClient = async (req, res, next) => {
  const authKey = req.headers['x-client-auth'];
  if (!authKey) return res.status(401).json({ error: 'Missing client auth key' });

  const client = await Client.findOne({ authKey });
  if (!client || !client.isActive) {
    return res.status(403).json({ error: 'Unauthorized client' });
  }

  req.client = client;
  next();
}; 