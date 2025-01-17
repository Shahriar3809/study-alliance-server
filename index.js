const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jryyhrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client
      .db("studyAlliance")
      .collection("usersCollection");
    const sessionCollection = client
      .db("studyAlliance")
      .collection("allSession");
    const materialsCollection = client
      .db("studyAlliance")
      .collection("allMaterials");

    const bookedSessionCollection = client
      .db("studyAlliance")
      .collection("bookedSession");
    const noteCollection = client.db("studyAlliance").collection("allNotes");
    const ratingsCollection = client
      .db("studyAlliance")
      .collection("allRatings");




    const verifyToken = (req, res, next) => {
      // console.log('---',req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized Access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "Unauthorized Access" });
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: "Unauthorized Access" });
        } else {
          req.decoded = decoded;
          next();
        }
      });
    };



    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    

    const verifyTutor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isTutor = user?.role === "tutor";
      if (!isTutor) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res.send({ token });
    });

    app.put("/user",  async (req, res) => {
      const user = req.body;
      // console.log(user)
      const query = { email: user?.email };
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        return res.send(isExist);
      }

      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          ...user,
        },
      };
      const result = await usersCollection.updateOne(
        query,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const { name } = req.query;
      // console.log(req.headers);
      // console.log(name)
      let query = {};
      if (name) {
        query = {
          $or: [
            { name: { $regex: name, $options: "i" } },
            { email: { $regex: name, $options: "i" } },
          ],
        };
      }
      // console.log(query)
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });


// no need to verify admin
    app.get("/user/admin/:email", verifyToken,  async (req, res) => {
      const email = req.params.email;
      // console.log(email, req.decoded.email)
       if (email !== req.decoded.email) {
         return res.status(403).send({ message: "Un-Authorized Access" });
       }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    // no need to verify tutor
    app.get("/user/tutor/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
       if (email !== req.decoded.email) {
         return res.status(403).send({ message: "Un-Authorized Access" });
       }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let tutor = false;
      if (user) {
        tutor = user?.role === "tutor";
      }
      res.send({ tutor });
    });


    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const update = req.body;
        // console.log(id, update);
        const query = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: update.role,
          },
        };
        const result = await usersCollection.updateOne(query, updatedDoc);
        res.send(result);
      }
    );

    // --------------------------------------------------------------

    app.post("/all-session", async (req, res) => {
      const data = req.body;
      const result = await sessionCollection.insertOne(data);
      res.send(result);
    });

    // Server code to handle pagination
    app.get("/all-session", verifyToken, verifyAdmin, async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 10;

      const sessions = await sessionCollection
        .find()
        .skip(page * limit)
        .limit(limit)
        .toArray();

      const totalSessions = await sessionCollection.countDocuments();

      res.send({ sessions, totalSessions });
    });

    app.get("/all-session", async (req, res) => {
      const query = { status: { $ne: "rejected" } };
      const result = await sessionCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/all-session/admin/:id",  async (req, res) => {
      const id = req.params.id;
      const { status, rejectionReason, feedback, fee } = req.body;
      // console.log(req.body)
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          status: status,
          fee: fee,
          rejectionReason: rejectionReason,
          feedback: feedback,
        },
      };
      const result = await sessionCollection.updateOne(
        query,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.patch("/req-session/admin/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status,
        },
      };
      const result = await sessionCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.delete("/all-session/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sessionCollection.deleteOne(query);
      res.send(result);
    });

    app.get(
      "/my-session/:email",
      verifyToken,
      verifyTutor,
      async (req, res) => {
        const email = req.params.email;
        const query = { tutorEmail: email }; //status: { $ne: "pending" }
        const result = await sessionCollection.find(query).toArray();
        res.send(result);
      }
    );

    app.get(
      "/my-approved-session/:email",
      verifyToken,
      verifyTutor,
      async (req, res) => {
        const email = req.params.email;
        const query = { tutorEmail: email, status: "approved" };
        const result = await sessionCollection.find(query).toArray();
        // console.log(result)
        res.send(result);
      }
    );

    app.get("/singleSession/:id",  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sessionCollection.findOne(query);
      res.send(result);
    });

    app.post("/tutor/upload-materials", async (req, res) => {
      const materialsData = req.body;
      const result = await materialsCollection.insertOne(materialsData);
      res.send(result);
    });

    // --------------------------------------------------------------------------------------
    app.get(
      "/my-materials/:email",
      verifyToken,
      verifyTutor,
      async (req, res) => {
        const data = req.query;
        const email = req.params.email;
        const query = { email: email };
        const result = await materialsCollection.find(query).toArray();
        res.send(result);
      }
    );

    app.get("/materials-for-this-session/:id", async (req, res) => {
      const id = req.params.id;
      const query = { sessionId: id };
      const result = await materialsCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/materials/tutor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await materialsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/tutor/get-materials/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await materialsCollection.findOne(query);
      res.send(result);
    });

    app.patch("/tutor/update-materials/:id", async (req, res) => {
      const { image, materialsTitle, link } = req.body;
      const id = req.params.id;
      //  console.log(req.body, id)
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          image: image,
          materialsTitle: materialsTitle,
          link: link,
        },
      };
      const result = await materialsCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    // Adjusted endpoint to support pagination
    app.get(
      "/admin/all-materials",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 2;
        const skip = page * limit;

        const result = await materialsCollection
          .find()
          .skip(skip)
          .limit(limit)
          .toArray();
        res.send(result);
      }
    );

    // Adjusted endpoint to get the total count of materials
    app.get("/item-count", async (req, res) => {
      const count = await materialsCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/all-approved-session", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0; // If limit is not provided, fetch all sessions
      const query = { status: "approved" };
      const result = await sessionCollection.find(query).limit(limit).toArray();
      res.send(result);
    });

    app.get("/session-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sessionCollection.findOne(query);
      res.send(result);
    });

    app.post("/booked-session", async (req, res) => {
      const bookedData = req.body;
      const isExist = await bookedSessionCollection.findOne(bookedData);
      // console.log('exist-----------------------------',isExist)
      if (isExist) {
        return res.send({ exist: true });
      }
      const result = await bookedSessionCollection.insertOne(bookedData);
      res.send(result);
    });

    // student----------------------------------------

    app.get("/my-booked-session/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { studentEmail: email };
      // console.log(email, "Email")
      const result = await bookedSessionCollection.find(query).toArray();
      res.send(result);
      // console.log(result)
    });

    app.post("/save-note", async (req, res) => {
      const data = req.body;
      const result = await noteCollection.insertOne(data);
      res.send(result);
    });

    app.get("/my-notes/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { studentEmail: email };
      const result = await noteCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/delete-notes/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const query = { _id: new ObjectId(id) };
      const result = await noteCollection.deleteOne(query);
      res.send(result);
    });

    // Tutor
    app.get("/tutors", async (req, res) => {
      const query = { role: "tutor" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/save-ratings/:id", async (req, res) => {
      const ratingsData = req.body;
      const email = req.body.email;
      // console.log(email);

      const query = { sessionId: req.params.id, email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          ...ratingsData,
        },
      };

      try {
        const isExist = await ratingsCollection.findOne(query);
        let result;

        if (isExist) {
          result = await ratingsCollection.updateOne(
            query,
            updatedDoc,
            options
          );
        } else {
          result = await ratingsCollection.insertOne(ratingsData);
        }
        // console.log(result)
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { sessionId: id };
      const result = await ratingsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/get-note-data/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await noteCollection.findOne(query);
      res.send(result);
    });

    app.put("/edit-note/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const noteData = req.body;

      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          noteTitle: noteData.noteTitle,
          noteDetails: noteData.noteDetails,
        },
      };
      const result = await noteCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.get("/rejected-session", verifyToken, verifyAdmin, async (req, res) => {
      const query = { status: "rejected" };
      const result = await sessionCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/my-payment-item-data/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await sessionCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ message: "Item not found" });
        }
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // ------------------------------------------------------
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      if (!price) {
        return res.status(400).send({ error: "Price is required" });
      }

      const amount = parseInt(price * 100);
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).send({ error: error.message });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Study Alliance Server is Running");
});

app.listen(port, () => {
  console.log("Study Alliance is running in port", port);
});
