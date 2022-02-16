const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGO_ID}:${process.env.MONGO_PASSWORD}@cluster0.rlp2b.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = "Cluster0";


module.exports = async () => {
  await client.connect();
  const db = client.db(dbName);
  return db.collection("online-drum");
};
