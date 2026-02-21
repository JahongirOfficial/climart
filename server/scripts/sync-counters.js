const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://opscoder:PRv5ASUw6d5Qunz7@cluster0.s5obnul.mongodb.net/climart?retryWrites=true&w=majority&appName=Cluster0';

async function syncCounters() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('climart');

  const collections = [
    { col: 'customerorders', field: 'orderNumber', prefix: 'CO-2026' },
    { col: 'purchaseorders', field: 'orderNumber', prefix: 'ZP-2026' },
    { col: 'receipts', field: 'receiptNumber', prefix: 'QQ-2026' },
    { col: 'payments', field: 'paymentNumber', prefix: 'IN-2026' },
    { col: 'payments', field: 'paymentNumber', prefix: 'OUT-2026' },
    { col: 'payments', field: 'paymentNumber', prefix: 'TR-2026' },
    { col: 'supplierinvoices', field: 'invoiceNumber', prefix: 'INV-S-2026' },
  ];

  for (const c of collections) {
    const regex = new RegExp('^' + c.prefix.replace(/[-]/g, '[-]'));
    const docs = await db.collection(c.col)
      .find({ [c.field]: regex })
      .sort({ [c.field]: -1 })
      .limit(1)
      .toArray();

    if (docs.length > 0) {
      const lastNum = docs[0][c.field];
      const parts = lastNum.split('-');
      const seq = parseInt(parts[parts.length - 1]);
      if (seq > 0) {
        await db.collection('counters').updateOne(
          { _id: c.prefix },
          { $max: { seq: seq } },
          { upsert: true }
        );
        console.log(c.prefix + ' -> seq=' + seq + ' (from ' + lastNum + ')');
      }
    } else {
      console.log(c.prefix + ' -> no docs');
    }
  }

  const counters = await db.collection('counters').find({}).toArray();
  console.log('\nAll counters:');
  counters.forEach(c => console.log(c._id + ' = ' + c.seq));

  await client.close();
  console.log('\nDone!');
}

syncCounters().catch(e => console.error(e));
