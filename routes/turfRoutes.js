const express = require("express");

const router = express.Router();

const Turf = require("../models/Turf");

const auth = require("../middleware/authMiddleware");


// ADD TURF

router.post("/", auth, async (req,res)=>{

  try{

    const images = JSON.parse(req.body.images || "[]");

    const turf = new Turf({

      name:req.body.name,
      location:req.body.location,
      address:req.body.address,
      sport:req.body.sport,
      price:req.body.price,
      description:req.body.description,
      images:images,
      owner:req.userId

    });

    await turf.save();

    res.json({message:"Turf Added"});

  }

  catch(err){

    console.log(err);

    res.status(500).json({message:err.message});

  }

});


// GET OWNER TURFS

router.get("/owner", auth, async(req,res)=>{

  try{

    const turfs = await Turf.find({owner:req.userId});

    res.json(turfs);

  }

  catch(err){

    res.status(500).json({message:err.message});

  }

});

module.exports = router;