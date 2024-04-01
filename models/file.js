const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/basic-chat");

const Fileschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },

  file: {
    type: String,
  },
  path: {
    type: String,
  },
  id: {
    unique: true,
    type: String,
  },
  visibility: {
    type: String,
    default: "public",
  },
});

const File = mongoose.model("File", Fileschema);

module.exports = File;
