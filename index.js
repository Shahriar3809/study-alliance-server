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
    const sessionCollection = client
      .db("studyAlliance")
      .collection("allSession");
    const materialsCollection = client
      .db("studyAlliance")
      .collection("allMaterials");

    const bookedSessionCollection = client
      .db("studyAlliance")
      .collection("bookedSession");
    const noteCollection = client
      .db("studyAlliance")
      .collection("allNotes");
    const ratingsCollection = client
      .db("studyAlliance")
      .collection("allRatings");

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




    app.post('/all-session', async(req, res)=> {
      const session = req.body;
      const result = await sessionCollection.insertOne(session)
      res.send(result)
    })




    app.get("/all-session", async(req, res)=> {
      const query = { status: { $ne: "rejected" } };
      const result = await sessionCollection.find(query).toArray();
      res.send(result)
    });




    app.patch('/all-session/admin/:id', async (req, res) => {
        const id = req.params.id;
        const {status, fee} = req.body;
        // console.log(status, fee)
        const query = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            status: status,
            fee: fee,
          },
        };
        const result = await sessionCollection.updateOne(query, updatedDoc);
        res.send(result);
      }
    );

    app.patch('/req-session/admin/:id', async (req, res) => {
        const id = req.params.id;
        const {status} = req.body;
      
        const query = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            status: status,
          },
        };
        const result = await sessionCollection.updateOne(query, updatedDoc);
        res.send(result);
      }
    );

    app.delete("/all-session/admin/:id", async(req, res)=> {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await sessionCollection.deleteOne(query);
      res.send(result)
    });



app.get("/my-session/:email", async(req, res)=> {
  const email = req.params.email;
  const query = { tutorEmail: email }; //status: { $ne: "pending" }
  const result = await sessionCollection.find(query).toArray();
  res.send(result);
});


app.get("/my-approved-session/:email", async (req, res) => {
  const email = req.params.email;
  const query = { tutorEmail: email, status: "approved" };
  const result = await sessionCollection.find(query).toArray();
  // console.log(result)
  res.send(result);
});


app.get('/singleSession/:id', async(req, res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await sessionCollection.findOne(query);
  res.send(result)
})


app.post("/tutor/upload-materials", async(req, res)=> {
  const materialsData = req.body;
  const result = await materialsCollection.insertOne(materialsData);
  res.send(result)
});


app.get("/my-materials/:email", async(req, res)=> {
  const email = req.params.email;
  const query = {email: email};
  const result = await materialsCollection.find(query).toArray()
  res.send(result)
});


app.get("/materials-for-this-session/:id", async(req, res)=> {
  const id = req.params.id;
  const query = { sessionId: id };
  const result = await materialsCollection.find(query).toArray();
  res.send(result);
});


app.delete("/materials/tutor/:id", async(req, res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await materialsCollection.deleteOne(query);
  res.send(result)
});


app.get("/tutor/get-materials/:id", async(req, res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await materialsCollection.findOne(query);
  res.send(result)
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
        link: link
      },
    };
    const result = await materialsCollection.updateOne(query, updatedDoc);
    res.send(result);
  });


  app.get("/admin/all-materials", async (req, res)=> {
    const result = await materialsCollection.find().toArray()
    res.send(result)
  });

  app.get("/all-approved-session", async (req, res) => {
    const limit = parseInt(req.query.limit) || 0; // If limit is not provided, fetch all sessions
    const query = { status: "approved" };
    const result = await sessionCollection.find(query).limit(limit).toArray();
    res.send(result);
  });





  app.get("/session-details/:id", async(req, res)=> {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await sessionCollection.findOne(query);
    res.send(result);
  });


  app.post('/booked-session', async(req, res)=> {
    const bookedData = req.body;
    const isExist = await bookedSessionCollection.findOne(bookedData)
    // console.log('exist-----------------------------',isExist)
    if(isExist) {
      return res.send({exist: true})
    }
    const result = await bookedSessionCollection.insertOne(bookedData)
    res.send(result)
  })






  // student----------------------------------------

  app.get("/my-booked-session/:email", async(req, res)=> {
    const email = req.params.email;
    const query = {studentEmail: email }
    // console.log(email, "Email")
    const result = await bookedSessionCollection.find(query).toArray();
    res.send(result)
    // console.log(result)
  });


app.post('/save-note', async(req, res)=> {
  const data = req.body;
  const result = await noteCollection.insertOne(data);
  res.send(result)
})



app.get("/my-notes/:email", async(req, res)=> {
  const email = req.params.email;
  const query = {studentEmail: email}
  const result = await noteCollection.find(query).toArray()
  res.send(result)
});

app.delete("/delete-notes/:id", async (req, res) => {
  const id = req.params.id;
  // console.log(id)
  const query = { _id: new ObjectId(id) };
  const result = await noteCollection.deleteOne(query);
  res.send(result);
});




// Tutor
app.get('/tutors', async(req, res)=> {
  const query = {role: 'tutor'};
  const result = await usersCollection.find(query).toArray();
  res.send(result)
})












  app.put("/save-ratings/:id", async (req, res) => {
    const ratingsData = req.body;
    const email = req.body.email;
    console.log(email)
    const query = {sessionId: req.params.id, email: email }
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        ...ratingsData,
      },
    };
    const isExist = ratingsCollection.findOne(query)
    if(isExist) {
      const result = await ratingsCollection.updateOne(query, updatedDoc, options);
     return res.send(result);
    }
    const result = await ratingsCollection.insertOne(ratingsData)
    res.send(result)
  });


  app.get('/review/:id', async(req, res)=> {
    const id = req.params.id;
    const query = {sessionId: id};
    const result = await ratingsCollection.find(query).toArray()
    res.send(result)
  })

  



 





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
