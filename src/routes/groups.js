const express = require('express');
const router = express.Router();
const Group = require('../models/Group');

// Crear un nuevo grupo
router.post('/create', async (req, res) => {
  try {
    const { name, creator } = req.body;
    const group = new Group({
      name,
      members: [creator],
      expenses: []
    });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el grupo' });
  }
});

// Obtener un grupo por código
router.get('/:code', async (req, res) => {
  try {
    const group = await Group.findOne({ code: req.params.code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el grupo' });
  }
});

module.exports = router;
