const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const expenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  paidBy: String,
  splitAmong: [String],
  category: { type: String, default: 'otros' },
  customAmounts: { type: Map, of: Number }, // Mapa de "Nombre": Importe
  createdAt: { type: Date, default: Date.now }
});

const groupSchema = new mongoose.Schema({
  code: { type: String, default: () => nanoid(6).toUpperCase() },
  name: String,
  members: [String],
  expenses: [expenseSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', groupSchema);
