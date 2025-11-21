// controllers/eventController.js
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deactivateEvent,
} from '../services/eventService.js';
import bucket from '../utils/gcsService.js';

// Create Event Controller
export const createEventController = async (req, res, next) => {
  try {
    let mediaUrl = null;
    let publicUrl = null;

    // Handle file upload to GCS
    if (req.file) {
      const filename = `${Date.now()}_${req.file.originalname}`;
      mediaUrl = `events/${filename}`;
      const gcsFile = bucket.file(mediaUrl);

      await gcsFile.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      publicUrl = `https://storage.googleapis.com/${bucket.name}/${mediaUrl}`;
    }

    // Add media info to request body
    req.body.mediaUrl = publicUrl;
    req.body.mediaType = req.file ? req.file.mimetype : null;

    // ✅ CONVERT TYPES FROM FORM-DATA STRINGS
    if (req.body.canEnroll !== undefined) {
      req.body.canEnroll = req.body.canEnroll === 'true';
    }
    if (req.body.isActive !== undefined) {
      req.body.isActive = req.body.isActive === 'true';
    }
    if (req.body.availableSeats !== undefined) {
      req.body.availableSeats = parseInt(req.body.availableSeats, 10);
    }
    if (req.body.fees !== undefined) {
      req.body.fees = parseFloat(req.body.fees);
    }

    const event = await createEvent(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// Get All Events Controller
export const getAllEventsController = async (req, res, next) => {
  try {
    const { isActive, canEnroll, locationId, categoryId } = req.query;
    const events = await getAllEvents({ isActive, canEnroll, locationId, categoryId });
    
    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// Get Event By ID Controller
export const getEventByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await getEventById(id);
    
    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// Update Event Controller
export const updateEventController = async (req, res, next) => {
  try {
    let mediaUrl = null;
    let publicUrl = null;

    // Handle file upload to GCS (only if new file is uploaded)
    if (req.file) {
      const filename = `${Date.now()}_${req.file.originalname}`;
      mediaUrl = `events/${filename}`;
      const gcsFile = bucket.file(mediaUrl);

      await gcsFile.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      publicUrl = `https://storage.googleapis.com/${bucket.name}/${mediaUrl}`;
      
      req.body.mediaUrl = publicUrl;
      req.body.mediaType = req.file.mimetype;
    }

    // ✅ CONVERT TYPES FROM FORM-DATA STRINGS
    if (req.body.canEnroll !== undefined) {
      req.body.canEnroll = req.body.canEnroll === 'true';
    }
    if (req.body.isActive !== undefined) {
      req.body.isActive = req.body.isActive === 'true';
    }
    if (req.body.availableSeats !== undefined) {
      req.body.availableSeats = parseInt(req.body.availableSeats, 10);
    }
    if (req.body.fees !== undefined) {
      req.body.fees = parseFloat(req.body.fees);
    }

    const { id } = req.params;
    const event = await updateEvent(id, req.body, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// Deactivate Event Controller
export const deactivateEventController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deactivateEvent(id);
    
    res.status(200).json({
      success: true,
      message: 'Event deactivated successfully.',
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};