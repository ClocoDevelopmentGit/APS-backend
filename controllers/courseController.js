import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../services/courseService.js";
import bucket from "../utils/gcsService.js";

export const createCourseController = async (req, res) => {
  try {
    let logoPath = null;
    let publicUrl = null;

    if (req.file) {
      const filename = req.file.originalname;
      logoPath = `courses/${filename}`;
      const gcsFile = bucket.file(logoPath);

      await gcsFile.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false,
      });

      await gcsFile.makePublic();

      publicUrl = `https://storage.googleapis.com/${bucket.name}/${logoPath}`;
    }
    req.body.mediaUrl = publicUrl;
    req.body.mediaType = req.file.mimetype;
    const result = await createCourse(req.body);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCoursesController = async (req, res) => {
  try {
    const result = await getAllCourses();
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseByIdController = async (req, res) => {
  try {
    const result = await getCourseById(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCourseController = async (req, res) => {
  try {
    let logoPath = null;
    let publicUrl = null;

    if (req.file) {
      const filename = req.file.originalname;
      logoPath = `courses/${filename}`;
      const gcsFile = bucket.file(logoPath);

      await gcsFile.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false,
      });

      await gcsFile.makePublic();

      publicUrl = `https://storage.googleapis.com/${bucket.name}/${logoPath}`;
    }
    req.body.mediaUrl = publicUrl;
    req.body.mediaType = req.file.mimetype;
    const result = await updateCourse(req.params.id, req.body);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCourseController = async (req, res) => {
  try {
    const result = await deleteCourse(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
