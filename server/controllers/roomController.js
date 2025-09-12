const roomService = require('../services/roomService');

async function getAllRooms(req, res) {
  try {
    const rooms = await roomService.getAllRooms();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getRoomById(req, res) {
  try {
    const room = await roomService.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createRoom(req, res) {
  try {
    console.log("Received body:", req.body);
    const { name, room_type, floor_id } = req.body;
    if (!name || !room_type || !floor_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newRoom = await roomService.createRoom({ name, room_type, floor_id });
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateRoom(req, res) {
  try {
    const { name, room_type, floor_id } = req.body;
    const updatedRoom = await roomService.updateRoom(req.params.id, { name, room_type, floor_id });
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteRoom(req, res) {
  try {
    const result = await roomService.deleteRoom(req.params.id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
