require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const movieCollection = client.db('movieDB').collection('movies');
    const favoritesCollection = client.db('movieDB').collection('favorites'); // Edited/Added

    // Fetch all movies
    app.get('/movies', async (req, res) => {
      const limit = parseInt(req.query.limit) || 0; 
      const cursor = limit > 0 ? movieCollection.find().limit(limit) : movieCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    

    // Fetch a specific movie by ID
    app.get('/movies/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const movie = await movieCollection.findOne({ _id: new ObjectId(id) });
        if (movie) {
          res.status(200).send(movie);
        } else {
          res.status(404).send({ message: 'Movie not found' });
        }
      } catch (error) {
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    // Fetch all favorites
    app.get('/favorites', async (req, res) => {
      const cursor = favoritesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });


    // Get favorites for a specific user
    app.get("/favorites/:email", async (req, res) => {
    try {
    const userEmail = req.params.email;

    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }

    const userFavorites = await favoritesCollection.find({ userEmail }).toArray();
    res.status(200).json(userFavorites);
    } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Internal Server Error" });
    }
      });

      // Update a movie by ID
    app.put('/movies/:id', async (req, res) => {
      const id = req.params.id;
      const updatedMovie = req.body;

      const result = await movieCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedMovie }
    );

      res.send(result);
    });


    // Add a new movie
    app.post('/movies', async (req, res) => {
      const movie = req.body;
      try {
        const result = await client.db('movieDB').collection('movies').insertOne(movie);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Internal server error.' });
      }
    });

      // Add a movie to favorites
    app.post("/favorites", async (req, res) => {
  try {
    const favoriteMovie = req.body;

    // Validate request body
    if (!favoriteMovie || !favoriteMovie.userEmail) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Check if the movie already exists for this user
    const existingMovie = await favoritesCollection.findOne({
      _id: favoriteMovie._id,
      userEmail: favoriteMovie.userEmail,
    });

    if (existingMovie) {
      return res.status(409).json({ message: "The movie is already added to favorites." });
    }

    // Insert the movie into the database
    const result = await favoritesCollection.insertOne(favoriteMovie);
    res.status(201).json({ success: true, result });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
    });


    // Delete a favorite movie for a specific user
    app.delete("/favorites/:id", async (req, res) => {
  try {
    const movieId = req.params.id;
    const userEmail = req.query.email; // User's email passed as a query parameter


    const result = await favoritesCollection.deleteOne({
      _id: movieId,
      userEmail,
    });

    if (result.deletedCount > 0) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "Movie not found for this user" });
    }
  } catch (error) {
    console.error("Error deleting favorite:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
    });

    // Delete a movie by ID
    app.delete('/movies/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await movieCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount > 0) {
          res.status(200).send(result);
        } else {
          res.status(404).send({ message: 'No movie found with that ID' });
        }
      } catch (error) {
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Root route
app.get('/', (req, res) => {
  res.send('Movie Portal Server is running');
});

// Start server
app.listen(port, () => {
  console.log(`Movie Portal Server is running on port: ${port}`);
});
