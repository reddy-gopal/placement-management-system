const dns = require('dns');
const mongoose = require('mongoose');

// Some machines (VPNs, local DNS proxies) refuse Node's direct DNS queries, which breaks
// the SRV lookup that mongodb+srv:// URIs need. DNS_SERVERS lets you point Node elsewhere.
function applyDnsOverride(servers = process.env.DNS_SERVERS) {
  if (!servers) return;
  dns.setServers(servers.split(',').map((server) => server.trim()).filter(Boolean));
}

async function connectDB(uri = process.env.MONGO_URI) {
  applyDnsOverride();
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy server/.env.example to server/.env and configure it.');
  }
  if (/<username>|<password>|<db_password>/.test(uri)) {
    throw new Error(
      'MONGO_URI in server/.env still contains a placeholder (<username>/<password>). ' +
        'Paste your MongoDB Atlas connection string with your database user and password.'
    );
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    const hint = /querySrv|ENOTFOUND|ECONNREFUSED.*mongodb\.net/.test(err.message)
      ? ' DNS lookup of the Atlas cluster failed. Try setting DNS_SERVERS=8.8.8.8,1.1.1.1 in server/.env.'
      : err.name === 'MongooseServerSelectionError'
        ? ' Check that your IP address is allowed in Atlas → Network Access.'
        : /auth/i.test(err.message)
          ? ' Check the database username/password in MONGO_URI (special characters must be URL-encoded).'
          : '';
    throw new Error(`MongoDB connection failed: ${err.message}.${hint}`);
  }
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
