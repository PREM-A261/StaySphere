const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require("./models/listing.js");

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

app.get('/', (req, res) => {
    res.send('HI, I am Root!');
});

app.get('/testListings', async (req, res) => {
    let sampleListings = new Listing({
        title: 'My New Villa',
        description: 'By the Beach',
        price: 1200,
        location: 'Calangute, Goa',
        country: 'India',
    });

    await sampleListings.save();
    console.log('Sample Listing Saved');
    res.send('Sussessfully added listing');
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});