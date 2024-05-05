const ejsMate = require("ejs-mate");
const express = require("express");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync");
const Joi = require("joi");
const mongoose = require("mongoose");
const path = require("path");
const app = express();

mongoose
  .connect("mongodb://localhost:27017/bestpoints")
  .then((result) => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

const Place = require("./models/place");
const placeSchema = require("./schemas/place");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static("public"));

const validatePlace = (req, res, next) => {
  const { error } = placeSchema.validate(req.body);
  if (error) {
    const message = error.details.map((el) => el.message).join(",");
    return next(new ExpressError(message, 400));
  } else {
    next();
  }
};

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/places",
  wrapAsync(async (req, res) => {
    const places = await Place.find({});
    res.render("places/index", { places });
  })
);

app.get("/places/create", (req, res) => {
  res.render("places/create");
});

app.post(
  "/places",
  validatePlace,
  wrapAsync(async (req, res) => {
    const place = new Place(req.body.place);
    await place.save();
    res.redirect("/places");
  })
);

app.get(
  "/places/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const place = await Place.findById(id);
    res.render("places/show", { place });
  })
);

app.get(
  "/places/:id/edit",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const place = await Place.findById(id);
    res.render("places/edit", { place });
  })
);

app.put(
  "/places/:id",
  validatePlace,
  wrapAsync(async (req, res) => {
    await Place.findByIdAndUpdate(req.params.id, { ...req.body.place });
    res.redirect("/places");
  })
);

app.delete(
  "/places/:id",
  wrapAsync(async (req, res) => {
    await Place.findByIdAndDelete(req.params.id);
    res.redirect("/places");
  })
);

app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  const { status = 500 } = err;
  if (!err.message) err.message = "Something went wrong";
  res.status(status).render("layouts/error", { err });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
