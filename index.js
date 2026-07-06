const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
require("dotenv").config();
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = process.env.MONGO_DB_URI;

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
    await client.connect();

    const database = client.db("contact-crm");
    const contactCollections = database.collection("contacts");

    app.get("/api/contacts", async (req, res) => {
      const result = await contactCollections.find().toArray();
      res.send(result);
    });

    // Get Single Contact
    app.get("/api/contacts/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const query = {
          _id: new ObjectId(id),
        };

        const result = await contactCollections.findOne(query);

        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch contact API" });
      }
    });

    app.post("/api/contacts", async (req, res) => {
      const contact = req.body;
      const result = await contactCollections.insertOne(contact);
      res.send(result);
    });

    //Delete single contact
    app.delete("/api/contact/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = {
          _id: new ObjectId(id),
        };
        const result = await contactCollections.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Delete Failed From API" });
      }
    });

    // Filter the contact
    app.get("/api/contacts", async (req, res) => {
      const { search = "", sort = "newest" } = req.query;

      const query = {};

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

     

      let sortOption = {};

      if (sort === "newest") {
        sortOption = { _id: -1 };
      }

      if (sort === "oldest") {
        sortOption = { _id: 1 };
      }

      const result = await contactCollections
        .find(query)
        .sort(sortOption)
        .toArray();

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
