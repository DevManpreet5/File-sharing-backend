let express = require("express");
let moongose = require("mongoose");
let bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "Manpreet123";
const { v4: uuidv4 } = require("uuid");

let app = express();
let path = require("path");
let multer = require("multer");
var cookieParser = require("cookie-parser");
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/profilepic");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

const filestorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/files");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname + Date.now() + path.extname(file.originalname));
  },
});
const uploadfile = multer({ storage: filestorage });

let User = require("./models/user");
let file = require("./models/file");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use("/file", (req, res, next) => {
  if (!req.cookies.user) {
    return res.send("login needed");
  }
  next();
});
app.set("view engine", "ejs");

app.set("views", path.resolve(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("home");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/signup", (req, res) => {
  res.render("signup");
});
app.get("/file", (req, res) => {
  res.render("file");
});

app.post("/submit-form", upload.single("profilepic"), async (req, res) => {
  const hashpass = await bcrypt.hash(req.body.password, 10);
  await User.create({
    name: req.body.name,
    email: req.body.emailform,
    password: hashpass,
    image: req.file.filename,
  });
  const token = jwt.sign(
    { email: req.body.emailform, name: req.body.name },
    JWT_SECRET
  );
  res.cookie("user", token, { httpOnly: true }).redirect("/");
});

app.post("/validate-form", async (req, res) => {
  const user = await User.findOne({ email: req.body.emailform });

  if (user) {
    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (passwordMatch) {
      const token = jwt.sign(
        { email: req.body.emailform, name: user.name },
        JWT_SECRET
      );
      res.cookie("user", token, { httpOnly: true }).redirect("/");
    } else {
      res.clearCookie("user").redirect("/signup");
    }
  } else {
    res.redirect("/signup");
  }
});

app.post("/submit-file", uploadfile.single("file"), async (req, res) => {
  visibility = "public";
  if (req.body.visibility) {
    visibility = "private";
  }
  const decoded = await jwt.verify(req.cookies.user, JWT_SECRET);

  if (decoded != null) {
    await file.create({
      file: req.file.filename,
      path: req.file.path,
      name: decoded.name,
      email: decoded.email,
      visibility: visibility,
      id: uuidv4(),
    });
    res.send(`${req.file.originalname} uploaded succesfully ${visibility}ly!!`);
  }
});

app.get("/file/:id", async (req, res) => {
  const fileId = req.params.id;
  const fileInfo = await file.findOne({ id: fileId });
  console.log(fileInfo);
  if (!fileInfo) {
    res.status(404).send("This file doesnt exist");
  } else {
    if (fileInfo.visibility == "public")
      res.sendFile(path.join(__dirname, fileInfo.path));
    else {
      const decoded = await jwt.verify(req.cookies.user, JWT_SECRET);
      if (fileInfo.visibility == "private" && fileInfo.email == decoded.email) {
        res.sendFile(path.join(__dirname, fileInfo.path));
      } else {
        res.send("private post,no enough rights!!");
      }
    }
  }
});

app.listen(8005, () => {
  console.log("running at port 8005");
});
