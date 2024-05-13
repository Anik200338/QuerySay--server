require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());
// query;
// OIZbTqorbaVZiwsF;

// middlewares
const logger = (req, res, next) => {
  console.log('log: info', req.method, req.url);
  next();
};
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: 'unauthorized access' });
      }
      console.log(decoded);
      req.user = decoded;
      next();
    });
  }
  console.log(token);
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.scvnlgi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const cookeOption = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  secure: process.env.NODE_ENV === 'production' ? true : false,
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const AddQueryCollection = client.db('AddQueryDB').collection('AddQuery');
    const AddRecommendedCollection = client
      .db('AddQueryDB')
      .collection('AddRecommended');
    // jwt generate
    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '7d',
      });

      res.cookie('token', token, cookeOption).send({ success: true });
    });

    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', { ...cookeOption, maxAge: 0 })
        .send({ success: true });
    });

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
    app.get('/AddRecent', async (req, res) => {
      const cursor = AddQueryCollection.find();
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
    app.get('/Query/:email', verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      const email = req.params.email;
      console.log(tokenEmail, 'from token');
      if (tokenEmail !== email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const query = { email: req.params.email };
      const result = await AddQueryCollection.find(query)
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
          ProductImage: req.body.ProductImage,
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

    app.get('/subcategory/:id', verifyToken, async (req, res) => {
      const result = await AddRecommendedCollection.find({
        id: req.params.id,
      }).toArray();
      res.send(result);
    });

    app.get('/myRecommended/:email', verifyToken, async (req, res) => {
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
