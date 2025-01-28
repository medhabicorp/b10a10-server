require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();


// middleware
app.use(cors());
app.use(express.json());

// MongoDB Docs
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gqz9f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const movieCollection = client.db('movieDB').collection('movies'); 

    app.get('/movies', async(req, res)=>{
      const cursor = movieCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post("/movies", async (req, res) => {
      const movie = req.body;
      try {
        const result = await client.db("movieDB").collection("movies").insertOne(movie);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Internal server error." });
      }
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
  res.send('Movie Portal Server is running')
})

app.listen(port, ()=>{
  console.log(`Movie Portal Server is running on port: ${port}`)
})