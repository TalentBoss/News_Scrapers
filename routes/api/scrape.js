const express = require('express');
const router = express.Router();

const { real_estate_module } = require('../../scripts/real-estate');
router.post('/real-estate', async (req, res) => {
  real_estate_module();
  res.status(200).json({msg: 'Success!'});
});


module.exports = router;