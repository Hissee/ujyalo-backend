import express from 'express';
import {
  getProvinces,
  getDistrictsByProvince,
  getMunicipalitiesByDistrict,
  getWardsByMunicipality,
  getAllLocations
} from '../controllers/location.controller.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/provinces', getProvinces);
router.get('/provinces/:provinceId/districts', getDistrictsByProvince);
router.get('/districts/:districtId/municipalities', getMunicipalitiesByDistrict);
router.get('/municipalities/:municipalityId/wards', getWardsByMunicipality);
router.get('/all', getAllLocations);

export default router;

