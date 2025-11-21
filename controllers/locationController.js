// controllers/locationController.js
import {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deactivateLocation,
} from '../services/locationService.js';

// Create Location Controller
export const createLocationController = async (req, res, next) => {
  try {
    const location = await createLocation(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Location created successfully.',
      location,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// Get All Locations Controller
export const getAllLocationsController = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const locations = await getAllLocations(isActive);
    
    res.status(200).json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// Get Location By ID Controller
export const getLocationByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await getLocationById(id);
    
    res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// Update Location Controller
export const updateLocationController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const location = await updateLocation(id, req.body, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Location updated successfully.',
      location,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// Deactivate Location Controller
export const deactivateLocationController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deactivateLocation(id);
    
    res.status(200).json({
      success: true,
      message: 'Location deactivated successfully.',
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};