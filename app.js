const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');

const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");

const MONGO_URL = 'mongodb://127.0.0.1:27017/staysphere';
main()
    .then(() =>{
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
    res.send('HI, I am Root!');
});

app.use('/listings',listings);
app.use('/listings/:id/reviews', reviews);

app.all('/', (req, res, next) => {
    throw new ExpressError(400, "listing.image must be a string");
});

app.use((err, req, res, next) => {
    let statusCode = err.statusCode;

    if (typeof statusCode !== "number") {
        statusCode = 500;
    }

    const message = err.message || "Something went wrong!";

    res.status(statusCode).render("error.ejs", { message });
        //res.status(statusCode).send(message);
 });
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});