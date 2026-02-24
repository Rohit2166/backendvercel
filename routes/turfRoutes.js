const express = require("express");

const router = express.Router();

const Turf = require("../models/Turf");

const auth = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");


router.post("/", auth, upload.array("images"), async (req, res) => {

  try {

    const turf = new Turf({

      name: req.body.name,

      location: req.body.location,

      address: req.body.address,

      sport: req.body.sport,

      price: req.body.price,

      description: req.body.description,

      images: [],

      owner: req.userId

    });

    await turf.save();

    res.json({

      message: "Turf Added"

    });

  }

  catch (err) {

    res.status(500).json({

      message: err.message

    });

  }

});
// GET OWNER TURFS
router.get("/owner", authMiddleware, async (req, res) => {

  try {

    const turfs = await Turf.find({ owner: req.userId });

    res.json(turfs);

  }

  catch (err) {

    res.status(500).json({ message: err.message });

  }

});


// DELETE TURF

router.delete("/:id", authMiddleware, async (req, res) => {

  try {

    await Turf.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted" });

  }

  catch (err) {

    res.status(500).json({ message: err.message });

  }

});


module.exports = router;