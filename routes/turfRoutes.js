const express = require("express");

const router = express.Router();

const Turf = require("../models/Turf");

const authMiddleware = require("../middleware/authMiddleware");



/*
================================
ADD TURF
POST /api/turfs
================================
*/

router.post("/", authMiddleware, async (req, res) => {

  try {

    const {

      name,
      location,
      address,
      sport,
      price,
      description,
      images

    } = req.body;



    const turf = new Turf({

      name,
      location,
      address,
      sport,
      price,
      description,

      // save images array safely

      images: images || [],

      owner: req.userId

    });



    await turf.save();



    res.status(201).json({

      message: "Turf added successfully",

      turf

    });

  }

  catch (error) {

    console.log("ADD TURF ERROR:", error);

    res.status(500).json({

      message: error.message

    });

  }

});



/*
================================
GET OWNER TURFS
GET /api/turfs/owner
================================
*/

router.get("/owner", authMiddleware, async (req, res) => {

  try {

    const turfs = await Turf.find({

      owner: req.userId

    });



    res.json(turfs);

  }

  catch (error) {

    console.log("OWNER TURF ERROR:", error);

    res.status(500).json({

      message: error.message

    });

  }

});



/*
================================
GET ALL TURFS
GET /api/turfs
================================
*/

router.get("/", async (req, res) => {

  try {

    const turfs = await Turf.find().populate("owner", "name email");

    res.json(turfs);

  }

  catch (error) {

    console.log("GET TURFS ERROR:", error);

    res.status(500).json({

      message: error.message

    });

  }

});



/*
================================
DELETE TURF
DELETE /api/turfs/:id
================================
*/

router.delete("/:id", authMiddleware, async (req, res) => {

  try {

    const turf = await Turf.findById(req.params.id);

    if (!turf) {

      return res.status(404).json({

        message: "Turf not found"

      });

    }



    // check owner

    if (turf.owner.toString() !== req.userId) {

      return res.status(403).json({

        message: "Not authorized"

      });

    }



    await turf.deleteOne();



    res.json({

      message: "Turf deleted successfully"

    });

  }

  catch (error) {

    console.log("DELETE TURF ERROR:", error);

    res.status(500).json({

      message: error.message

    });

  }

});



module.exports = router;