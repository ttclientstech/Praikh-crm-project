const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

function modelController() {
  const methods = createCRUDController('Customer');

  methods.listAll = async (req, res) => {
    const Model = mongoose.model('Customer');
    const result = await Model.find({ removed: false, enabled: true }).sort({ created: 'desc' }).exec();
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        result,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(203).json({
        success: false,
        result: [],
        message: 'Collection is Empty',
      });
    }
  };

  return methods;
}

module.exports = modelController();

