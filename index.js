require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const cors = require('cors');
const app = express();

// middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://assignment-10-7eeb4.web.app',
      'https://assignment-10-7eeb4.firebaseapp.com',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
// query;
// OIZbTqorbaVZiwsF;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.scvnlgi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const AddQueryCollection = client.db('AddQueryDB').collection('AddQuery');
    const AddRecommendedCollection = client
      .db('AddQueryDB')
      .collection('AddRecommended');
    // Send a ping to confirm a successful connection
    app.get('/AddQuery', async (req, res) => {
      const search = req.query.search;

      let query = {
        ProductName: { $regex: search, $options: 'i' },
      };
      const cursor = AddQueryCollection.find(query);
      const result = await cursor.sort({ _id: -1 }).toArray();
      res.send(result);
    });

    app.post('/AddQuery', async (req, res) => {
      const newQuery = req.body;
      console.log(newQuery);
      const result = await AddQueryCollection.insertOne(newQuery);
      res.send(result);
    });

    // my Query
    app.get('/Query/:email', async (req, res) => {
      const result = await AddQueryCollection.find({
        email: req.params.email,
      })
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });
    app.delete('/delete/:id', async (req, res) => {
      const result = await AddQueryCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      console.log(result);
      res.send(result);
    });
    app.get('/UpdateDetails/:id', async (req, res) => {
      const result = await AddQueryCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    app.get('/QueriesDetails/:id', async (req, res) => {
      const result = await AddQueryCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    app.put('/update/:id', async (req, res) => {
      console.log(req.params.id);
      const query = { _id: new ObjectId(req.params.id) };
      const data = {
        $set: {
          ProductName: req.body.ProductName,
          ProductBrand: req.body.ProductBrand,
          ProductImage: req.body.description,
          QueryTItle: req.body.QueryTItle,
          BoycottingReasonDetails: req.body.BoycottingReasonDetails,
        },
      };
      const result = await AddQueryCollection.updateOne(query, data);
      console.log(result);
      res.send(result);
    });

    // recommended

    app.post('/recommended', async (req, res) => {
      const newRecommended = req.body;
      console.log(newRecommended);
      const result = await AddRecommendedCollection.insertOne(newRecommended);
      const updateDoc = {
        $inc: {
          recommendationCount: 1,
        },
      };
      const query = { _id: new ObjectId(newRecommended.id) };
      const updaterecommendationCount = await AddQueryCollection.updateOne(
        query,
        updateDoc
      );
      console.log(updaterecommendationCount);
      res.send(result);
    });

    app.get('/subcategory/:id', async (req, res) => {
      const result = await AddRecommendedCollection.find({
        id: req.params.id,
      }).toArray();
      res.send(result);
    });

    app.get('/myRecommended/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'User.email': email };
      const result = await AddRecommendedCollection.find(query).toArray();
      res.send(result);
    });
    app.get('/Forme/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await AddRecommendedCollection.find(query).toArray();
      res.send(result);
    });

    app.delete('/myDelete', async (req, res) => {
      const id = req.query.id;
      const id2 = req.query.id2;
      // return console.log(id, id2);
      const result = await AddRecommendedCollection.deleteOne({
        _id: new ObjectId(id),
      });
      const decreasesDoc = {
        $inc: {
          recommendationCount: -1,
        },
      };
      const deleteQuery = { _id: new ObjectId(id2) };
      console.log(deleteQuery);
      const decreasesRecommendationCount = await AddQueryCollection.updateOne(
        deleteQuery,
        decreasesDoc
      );
      res.send(result);
    });

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send(' query is running');
});

app.listen(port, () => {
  console.log(`add query server is running on port: ${port}`);
});
