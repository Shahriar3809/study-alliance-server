const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
// const jwt = require("jsonwebtoken");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

    app.put("/user", async (req, res) => {
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



    app.get("/users", async (req, res) => {
      const {name} = req.query;
      // console.log(name)
      let query = {}
      if(name) {
        query.name = { $regex: name, $options: 'i' };
      }
      // console.log(query)
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });



    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      //  if (email !== req.decoded.email) {
      //    return res.status(403).send({ message: "Un-Authorized Access" });
      //  }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.get("/user/tutor/:email", async (req, res) => {
      const email = req.params.email;
      //  if (email !== req.decoded.email) {
      //    return res.status(403).send({ message: "Un-Authorized Access" });
      //  }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let tutor = false;
      if (user) {
        tutor = user?.role === "tutor";
      }
      res.send({ tutor });
    });


    app.patch("/users/admin/:id", async (req, res) => {
        const id = req.params.id;
        const update = req.body;
        console.log(id, update)
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










































// const jwt = require("jsonwebtoken");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const port = process.env.PORT || 3000;
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");





// async function run() {
//   try {
//     // await client.connect()

//     const menuCollection = client.db("bistroDb").collection("menu");
//     const reviewsCollection = client.db("bistroDb").collection("reviews");
//     const cartsCollection = client.db("bistroDb").collection("cart");
//     const usersCollection = client.db("bistroDb").collection("users");
//     const paymentCollection = client.db("bistroDb").collection("payments");

//     // JWT
//     app.post("/jwt", async (req, res) => {
//       const user = req.body;
//       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
//         expiresIn: "7d",
//       });
//       res.send({ token });
//     });

//     // Verify TOKEN Middleware
//     const verifyToken = (req, res, next) => {
//       // console.log(req.headers.authorization);
//       if (!req.headers.authorization) {
//         return res.status(401).send({ message: "Unauthorized Access" });
//       }
//       const token = req.headers.authorization.split(" ")[1];
//       if (!token) {
//         return res.status(401).send({ message: "Unauthorized Access" });
//       }
//       jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
//         if (error) {
//           return res.status(401).send({ message: "Unauthorized Access" });
//         } else {
//           req.decoded = decoded;
//           next();
//         }
//       });
//     };

//     const verifyAdmin = async (req, res, next) => {
//       const email = req.decoded.email;
//       const query = { email: email };
//       const user = await usersCollection.findOne(query);
//       const isAdmin = user?.role === "admin";
//       if (!isAdmin) {
//         return res.status(403).send({ message: "Forbidden Access" });
//       }
//       next();
//     };

//     // User
//     app.post("/users", async (req, res) => {
//       const user = req.body;

//       // insert email if user doesn't exist
//       const query = { email: user.email };
//       const existingUser = await usersCollection.findOne(query);
//       if (existingUser) {
//         return res.send({ message: "User Already Exist", insertedId: null });
//       }
//       const result = await usersCollection.insertOne(user);
//       res.send(result);
//     });

//     app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
//       const result = await usersCollection.find().toArray();
//       res.send(result);
//     });

    // app.get("/user/admin/:email", verifyToken, async (req, res) => {
    //   const email = req.params.email;
    //   if (email !== req.decoded.email) {
    //     return res.status(403).send({ message: "Un-Authorized Access" });
    //   }
    //   const query = { email: email };
    //   const user = await usersCollection.findOne(query);
    //   let admin = false;
    //   if (user) {
    //     admin = user?.role === "admin";
    //   }
    //   res.send({ admin });
    // });

    // app.patch(
    //   "/users/admin/:id",
    //   verifyToken,
    //   verifyAdmin,
    //   async (req, res) => {
    //     const id = req.params.id;
    //     const query = { _id: new ObjectId(id) };
    //     const updatedDoc = {
    //       $set: {
    //         role: "admin",
    //       },
    //     };
    //     const result = await usersCollection.updateOne(query, updatedDoc);
    //     res.send(result);
    //   }
    // );

//     app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: new ObjectId(id) };
//       const result = await usersCollection.deleteOne(query);
//       res.send(result);
//     });

//     app.get("/menu", async (req, res) => {
//       const result = await menuCollection.find().toArray();
//       res.send(result);
//     });

//     app.post("/menu", verifyToken, verifyAdmin, async (req, res) => {
//       const item = req.body;
//       const result = await menuCollection.insertOne(item);
//       res.send(result);
//     });

//     app.get("/reviews", async (req, res) => {
//       const result = await reviewsCollection.find().toArray();
//       res.send(result);
//     });

//     app.get("/carts", async (req, res) => {
//       const email = req.query.email;
//       const query = { email: email };
//       const result = await cartsCollection.find(query).toArray();
//       res.send(result);
//     });

//     //
//     app.get("/menu/:id", async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: new ObjectId(id) };
//       const result = await menuCollection.findOne(query);
//       res.send(result);
//     });

//     //
//     app.patch("/menu/:id", async (req, res) => {
//       const id = req.params.id;
//       const item = req.body;
//       const query = { _id: new ObjectId(id) };
//       const updatedDoc = {
//         $set: {
//           name: item.name,
//           category: item.category,
//           price: item.price,
//           recipe: item.recipe,
//           image: item.image,
//         },
//       };
//       const result = await menuCollection.updateOne(query, updatedDoc);
//       res.send(result);
//     });

//     // carts collection

//     app.post("/carts", async (req, res) => {
//       const cartItem = req.body;
//       const result = await cartsCollection.insertOne(cartItem);
//       res.send(result);
//     });

//     // delete

//     app.delete("/carts/:id", async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: new ObjectId(id) };
//       const result = await cartsCollection.deleteOne(query);
//       res.send(result);
//     });

//     app.delete("/menu/:id", verifyToken, verifyAdmin, async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: new ObjectId(id) };
//       const result = await menuCollection.deleteOne(query);
//       res.send(result);
//     });

//     // Payment intend
//     app.post("/create-payment-intent", async (req, res) => {
//       const { price } = req.body;
//       const amount = parseInt(price * 100);

//       // console.log(amount)
//       const paymentIntent = await stripe.paymentIntents.create({
//         amount: amount,
//         currency: "usd",
//         payment_method_types: ["card"],
//       });

//       res.send({
//         clientSecret: paymentIntent.client_secret,
//       });
//     });

//     app.post("/payments", async (req, res) => {
//       const payment = req.body;
//       const paymentResult = await paymentCollection.insertOne(payment);

//       // delete
//       const query = {
//         _id: {
//           $in: payment.cartIds.map((id) => new ObjectId(id)),
//         },
//       };
//       const deleteResult = await cartsCollection.deleteMany(query);
//       res.send({ paymentResult, deleteResult });
//     });

//     app.get("/payments/:email", verifyToken, async (req, res) => {
//       const query = { email: req.params.email };
//       if (req.params.email !== req.decoded.email) {
//         return res.status(403).send({ message: "forbidden access" });
//       }
//       const result = await paymentCollection.find(query).toArray();
//       res.send(result);
//     });

//     // statts
//     app.get("/admin-stats", verifyToken, verifyAdmin, async (req, res) => {
//       const users = await usersCollection.estimatedDocumentCount();
//       const menuItems = await menuCollection.estimatedDocumentCount();
//       const orders = await paymentCollection.estimatedDocumentCount();

//       // not best way
//       // const payments = await paymentCollection.find().toArray();
//       // const revenue = payments.reduce((total, item)=> total + item.price , 0)

//       const result = await paymentCollection
//         .aggregate([
//           {
//             $group: {
//               _id: null,
//               totalRevenue: {
//                 $sum: "$price",
//               },
//             },
//           },
//         ])
//         .toArray();
//       const revenue = result.length > 0 ? result[0].totalRevenue : 0;

//       res.send({ users, menuItems, orders, revenue });
//     });

//     //  using aggregate pipeline

//     app.get("/order-stats", async (req, res) => {
//       const result = await paymentCollection
//         .aggregate([
//           {
//             $unwind: "$menuItemIds",
//           },
//           {
//             $lookup: {
//               from: "menu",
//               localField: "menuItemIds",
//               foreignField: "_id",
//               as: "menuItems",
//             },
//           },
//           {
//             $unwind: "$menuItems",
//           },
//           {
//             $group: {
//               _id: "$menuItems.category",
//               quantity: {
//                 $sum: 1,
//               },
//               revenue: { $sum: "$menuItems.price" },
//             },
//           },
//         ])
//         .toArray();
//       res.send(result);
//     });

//     await client.db("admin").command({ ping: 1 });
//     console.log(
//       "Pinged your deployment. You successfully connected to MongoDB!"
//     );
//   } finally {
//   }
// }
// run().catch(console.dir);

// app.get("/", (req, res) => {
//   res.send("Bistro boss is running");
// });

// app.listen(port, () => {
//   console.log("Bistro Boss is running in port", port);
// });