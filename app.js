const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require("./models/listing.js");
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const { listingSchema } = require('./schema.js');

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
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('HI, I am Root!');
});

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(',');
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

//Index Route 
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
}));

//New Route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

//show route
app.get("/listings/:id", wrapAsync( async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", {listing});
}));

//Create Route
app.post("/listings", 
    validateListing,
    wrapAsync(async (req, res, next) => {
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", {listing});
}));

//Update Route
app.put("/listings/:id",
    validateListing,
    wrapAsync(async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect("/listings");
}));

//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    res.redirect("/listings");
}));

// app.get('/testListings', async (req, res) => {
//     let sampleListings = new Listing({
//         title: 'My New Villa',
//         description: 'By the Beach',
//         price: 1200,
//         location: 'Calangute, Goa',
//         country: 'India',
//     });

//     await sampleListings.save();
//     console.log('Sample Listing Saved');
//     res.send('Sussessfully added listing');
// });

app.all('/', (req, res, next) => {
    throw new ExpressError("listing.image must be a string", 400);
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