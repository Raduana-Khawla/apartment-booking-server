const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wjlgu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", (req, res) => {
  res.json("Hello World!");
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect((err) => {
      const serviceCollection = client
        .db("apartmentbookingCollection")
        .collection("services");
      const serviceItemsCollection = client
        .db("apartmentbookingCollection")
        .collection("items");
      const usersCollection = client
        .db("apartmentbookingCollection")
        .collection("users");
      const ordersCollection = client
        .db("apartmentbookingCollection")
        .collection("orders");
      const reviewCollection = client
        .db("apartmentbookingCollection")
        .collection("review");

      //add serviceCollection
      app.post("/addServices", async (req, res) => {
        console.log(req.body);
        const result = await serviceCollection.insertOne(req.body);
        res.json(result);
      });

      // get all services
      app.get("/allServices", async (req, res) => {
        const result = await serviceCollection.find({}).toArray();
        res.json(result);
      });
      // get all ServiceItems
      app.get("/allServiceItems", async (req, res) => {
        const result = await serviceItemsCollection.find({}).toArray();
        res.json(result);
      });
      // single service
      app.get("/singleService/:id", async (req, res) => {
        console.log(req.params.id);
        const result = await serviceCollection
          .find({ _id: ObjectId(req.params.id) })
          .toArray();
        res.json(result[0]);
      });
      // insert order and

      app.post("/addOrders", async (req, res) => {
        // console.log(req.body);
        const result = await ordersCollection.insertOne(req.body);
        res.json(result);
      });

      //  my order

      app.get("/myOrder/:email", async (req, res) => {
        // console.log(req.params.email);
        const result = await ordersCollection
          .find({ email: req.params.email })
          .toArray();
        res.json(result);
      });

      //post review
      app.post("/addReview", async (req, res) => {
        const result = await reviewCollection.insertOne(req.body);
        res.json(result);
      });
      app.get("/users", async (req, res) => {
        const cursor = usersCollection.find({});
        const user = await cursor.toArray();
        res.send(user);
      });

      //get user by email
      app.get("/users", async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        console.log(query);
        const cursor = usersCollection.find(query);
        const users = await cursor.toArray();
        res.send(users);
      });
      app.get("/users/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        let isAdmin = false;
        if (user?.role === "admin") {
          isAdmin = true;
        }
        res.json({ admin: isAdmin });
      });

      app.post("/users", verifyToken, async (req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        console.log(result);
        res.json(result);
      });

      app.put("/users", verifyToken, async (req, res) => {
        const user = req.body;
        const filter = { email: user.email };
        const options = { upsert: true };
        const updateDoc = { $set: user };
        const result = await usersCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.json(result);
      });

      app.put("/users/admin", verifyToken, async (req, res) => {
        const user = req.body;
        const requester = req.decodedEmail;
        if (requester) {
          const requesterAccount = await usersCollection.findOne({
            email: requester,
          });
          if (requesterAccount.role === "admin") {
            const filter = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
          }
        } else {
          res
            .status(403)
            .json({ message: "you do not have access to make admin" });
        }
      });
      //get review
      app.get("/addReview", async (req, res) => {
        const result = await reviewCollection.find({}).toArray();
        res.json(result);
      });
      //  make admin

      //order delete
      app.delete("/deleteOrder/:id", async (req, res) => {
        const result = await ordersCollection.deleteOne({
          _id: ObjectId(req.params.id),
        });
        // console.log(result);
        res.json(result);
      });
      /// all order
      app.get("/allOrders", async (req, res) => {
        // console.log("hello");
        const result = await ordersCollection.find({}).toArray();
        res.json(result);
      });

      // status update
      app.put("/statusUpdate/:id", async (req, res) => {
        const filter = { _id: ObjectId(req.params.id) };
        console.log(req.params.id);
        const result = await ordersCollection.updateOne(filter, {
          $set: {
            status: req.body.status,
          },
        });
        res.json(result);
      });
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`hello ${port}`);
});
