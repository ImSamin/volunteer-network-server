const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const admin = require('firebase-admin');

require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_HOST}:${process.env.DB_PASS}@cluster0.jdvgc.mongodb.net/volunteerNetwork?retryWrites=true&w=majority`;
const port = 5000;

const app = express();



app.use(cors());
app.use(bodyParser.json());


const serviceAccount = require(`${process.env.ADMIN_SDK}`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});





const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const taskCollection = client.db("volunteerNetwork").collection("tasks");
  const userTaskCollection = client.db("volunteerNetwork").collection("userTasks");

  app.post("/addTask ", (req, res) => {
    const task = req.body;
    taskCollection.insertMany(task)
      .then(result => {
        res.send(result.insertedCount)
      })
  })

  app.get('/tasks', (req, res) => {
    taskCollection.find({})
      .toArray((err, documents) => {
        res.send(documents)
      })
  });

  app.post('/addUserTask', (req, res) => {
    const userTask = req.body;
    userTaskCollection.insertOne(userTask)
      .then(result => {
        res.send(result.insertedCount)
      })
  })

  app.get('/userTasks', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1]

      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
          let queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            userTaskCollection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents)
              })
          }
        })
        .catch((error) => {
          res.status(401).send('unauthorized access')
        });

    }
    else{
      res.status(401).send('unauthorized access')
    }

  });

  app.get('/task', (req, res) => {
    console.log(req.query.taskId)
    taskCollection.find({ taskId: req.query.taskId })
      .toArray((err, documents) => {
        res.send(documents)
      })
  });


  app.delete('/delete/:id', (req, res) => {
    userTaskCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then((result) => {
        res.send(result.insertedCount)
      })
  })

});



app.get('/', (req, res) => {
  res.send('Hello Volunteer Network!')
})

app.listen(process.env.PORT || port);
