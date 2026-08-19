require('dotenv').config();
const app = require('./server');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`========================================`);
    console.log(`🏥 MedAI Backend running at http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/health`);
    console.log(`========================================`);
  });
}

module.exports = app;
