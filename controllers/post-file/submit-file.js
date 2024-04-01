async function submitfile(req, res) {
  await file.create({
    file: req.file.filename,
  });
  res.send(`${req.file.originalname} uploaded succesfully!!`);
}

module.exports = submitfile;
