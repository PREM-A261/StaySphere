require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const User = require("./models/user");
const data = require("./init/data");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/staysphere";

async function main() {
    await mongoose.connect(dbUrl);
    console.log("MongoDB connected successfully for seeding.");
    await initDB();
    await mongoose.disconnect();
    console.log("MongoDB disconnected. Seeding complete.");
}

const initDB = async () => {
    await Listing.deleteMany({});
    console.log("Deleted old listings.");

    let demoUser = await User.findOne({});
    if (!demoUser) {
        const newUser = new User({ email: "admin@staysphere.com", username: "staysphere_admin" });
        demoUser = await User.register(newUser, "Admin@12345");
        console.log("Created default admin user: staysphere_admin (password: Admin@12345)");
    }

    const listingsToInsert = data.data.map((listing) => ({
        ...listing,
        owner: demoUser._id,
        geometry: listing.geometry || {
            type: "Point",
            coordinates: [77.2090, 28.6139]
        }
    }));

    await Listing.insertMany(listingsToInsert);
    console.log(`Inserted ${listingsToInsert.length} listings successfully.`);
};

main().catch((err) => {
    console.error("Seeding error:", err);
});
