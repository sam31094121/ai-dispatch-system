const errorCodes = require('../constants/errorCodes');
const { buildHealthData } = require('../services/dispatchBuild.service');
const { successResponse } = require('../utils/response.util');

function getHealth(_req, res) {
  res.json(successResponse(errorCodes.OK, '服務正常', buildHealthData()));
}

module.exports = {
  getHealth
};
