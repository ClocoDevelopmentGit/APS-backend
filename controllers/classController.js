import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../services/classService.js";

export const createClassController = async (req, res) => {
  try {
    const result = await createClass(req.body);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllClassesController = async (req, res) => {
  try {
    const result = await getAllClasses();
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassByIdController = async (req, res) => {
  try {
    const result = await getClassById(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateClassController = async (req, res) => {
  try {
    const result = await updateClass(req.params.id, req.body);
    if (!result.success) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteClassController = async (req, res) => {
  try {
    const result = await deleteClass(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
