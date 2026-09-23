const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mapToken ? mbxGeocoding({ accessToken: mapToken }) : null;

const DEFAULT_COORDINATES = [77.2090, 28.6139]; // Default coordinates (New Delhi)

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            }
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    let geometry = { type: "Point", coordinates: DEFAULT_COORDINATES };
    
    if (geocodingClient && req.body.listing && req.body.listing.location) {
        try {
            let response = await geocodingClient.forwardGeocode({
                query: `${req.body.listing.location}, ${req.body.listing.country || ''}`,
                limit: 1
            }).send();
            if (response.body && response.body.features && response.body.features.length > 0) {
                geometry = response.body.features[0].geometry;
            }
        } catch (e) {
            console.log("Geocoding notice:", e.message);
        }
    }

    let url = req.file ? req.file.path : "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60";
    let filename = req.file ? req.file.filename : "default-listing-image";
    
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = geometry;

    let savedListing = await newListing.save();
    console.log("Listing created:", savedListing._id);
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image ? listing.image.url : "";
    if (originalImageUrl && originalImageUrl.includes("/upload")) {
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    }

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    
    let geometry = null;
    if (geocodingClient && req.body.listing && req.body.listing.location) {
        try {
            let coordinate = await geocodingClient.forwardGeocode({
                query: `${req.body.listing.location}, ${req.body.listing.country || ''}`,
                limit: 1
            }).send();
            if (coordinate.body && coordinate.body.features && coordinate.body.features.length > 0) {
                geometry = coordinate.body.features[0].geometry;
            }
        } catch (e) {
            console.log("Geocoding notice:", e.message);
        }
    }

    let updateData = { ...req.body.listing };
    if (geometry) {
        updateData.geometry = geometry;
    }

    let listing = await Listing.findByIdAndUpdate(id, updateData);

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};

module.exports.filterListings = async (req, res, next) => {
    const { q } = req.params;
    const filteredListings = await Listing.find({ category: q }).exec();
    if (!filteredListings.length) {
        req.flash("error", `No listings exist for category "${q}"!`);
        return res.redirect("/listings");
    }
    res.locals.success = `Listings filtered by "${q}"`;
    res.render("listings/index.ejs", { allListings: filteredListings });
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log("Listing deleted:", deletedListing ? deletedListing._id : id);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
};

module.exports.search = async(req, res) => {
    let query = req.query.q ? req.query.q.trim() : "";
    if (!query) {
        req.flash("error", "Please enter a search term!");
        return res.redirect("/listings");
    }

    let allListings = await Listing.find({
        $or: [
            { title: { $regex: query, $options: "i" } },
            { category: { $regex: query, $options: "i" } },
            { country: { $regex: query, $options: "i" } },
            { location: { $regex: query, $options: "i" } }
        ]
    });

    const intValue = parseInt(query, 10);
    if (allListings.length === 0 && !isNaN(intValue)) {
        allListings = await Listing.find({ price: { $lte: intValue } }).sort({ price: 1 });
        if (allListings.length > 0) {
            res.locals.success = `Listings under Rs ${intValue.toLocaleString("en-IN")}`;
            return res.render("listings/index.ejs", { allListings });
        }
    }

    if (allListings.length === 0) {
        req.flash("error", `No listings found matching "${query}"!`);
        return res.redirect("/listings");
    }

    res.locals.success = `Search results for "${query}"`;
    res.render("listings/index.ejs", { allListings });
};