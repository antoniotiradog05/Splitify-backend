const mongoose = require('mongoose');
const Group = require('../models/Group');
const { settle } = require('../utils/settle');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_group', async ({ code, username }) => {
      console.log(`User ${username} joining group ${code}`);
      socket.join(code);
      socket.data.username = username;
      socket.data.groupCode = code;

      try {
        const group = await Group.findOneAndUpdate(
          { code },
          { $addToSet: { members: username } },
          { new: true }
        );

        if (!group) {
          return socket.emit('error_message', 'Grupo no encontrado');
        }

        const settlements = settle(group.members, group.expenses);
        io.to(code).emit('group_updated', { group, settlements });
      } catch (error) {
        console.error('Join group error:', error);
        socket.emit('error_message', 'Error al unirse al grupo');
      }
    });

    socket.on('add_expense', async ({ code, description, amount, paidBy, splitAmong, category, customAmounts }) => {
      try {
        console.log(`Adding expense to group ${code}:`, { description, amount, paidBy, category });
        const group = await Group.findOneAndUpdate(
          { code },
          { $push: { expenses: { description, amount, paidBy, splitAmong, category, customAmounts } } },
          { new: true }
        );

        if (!group) {
          console.warn(`Group ${code} not found for add_expense`);
          return;
        }

        const settlements = settle(group.members, group.expenses);
        io.to(code).emit('group_updated', { group, settlements });
      } catch (error) {
        console.error('Add expense error:', error);
        socket.emit('error_message', 'Error al añadir el gasto');
      }
    });

    socket.on('delete_expense', async ({ code, expenseId }) => {
      try {
        console.log(`Deleting expense ${expenseId} from group ${code}`);
        
        let group;
        
        // Intentar con ObjectId primero
        try {
          const id = new mongoose.Types.ObjectId(expenseId);
          group = await Group.findOneAndUpdate(
            { code },
            { $pull: { expenses: { _id: id } } },
            { new: true }
          );
        } catch (idError) {
          // Si falla la conversión a ObjectId, intentar como string
          console.warn('ObjectId conversion failed, trying string match:', idError.message);
          group = await Group.findOneAndUpdate(
            { code },
            { $pull: { expenses: { _id: expenseId } } },
            { new: true }
          );
        }

        if (!group) {
          console.warn(`Group ${code} not found for delete_expense`);
          return socket.emit('error_message', 'Grupo no encontrado');
        }

        const settlements = settle(group.members, group.expenses);
        io.to(code).emit('group_updated', { group, settlements });
      } catch (error) {
        console.error('Delete expense error:', error);
        socket.emit('error_message', 'Error al borrar el gasto');
      }
    });

    socket.on('edit_expense', async ({ code, expenseId, updatedData }) => {
      try {
        console.log(`Editing expense ${expenseId} in group ${code}`);
        const id = new mongoose.Types.ObjectId(expenseId);
        const group = await Group.findOneAndUpdate(
          { code, 'expenses._id': id },
          { $set: { 'expenses.$': { ...updatedData, _id: id } } },
          { new: true }
        );

        if (!group) {
          console.warn(`Group or expense not found for edit_expense: ${code}, ${expenseId}`);
          return;
        }

        const settlements = settle(group.members, group.expenses);
        io.to(code).emit('group_updated', { group, settlements });
      } catch (error) {
        console.error('Edit expense error:', error);
        socket.emit('error_message', 'Error al editar el gasto');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
