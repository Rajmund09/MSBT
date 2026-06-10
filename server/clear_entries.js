const db = require('./config/db');

(async () => {
  try {
    await db.initialize();
    await db.run('DELETE FROM entries;');
    console.log('All entries have been successfully deleted.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing entries:', err);
    process.exit(1);
  }
})();
