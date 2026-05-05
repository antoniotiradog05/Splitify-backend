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

    socket.on('add_expense', async ({ code, description, amount, paidBy, splitAmong }) => {
      try {
        const group = await Group.findOneAndUpdate(
          { code },
          { $push: { expenses: { description, amount, paidBy, splitAmong } } },
          { new: true }
        );

        if (!group) return;

        const settlements = settle(group.members, group.expenses);
        io.to(code).emit('group_updated', { group, settlements });
      } catch (error) {
        console.error('Add expense error:', error);
        socket.emit('error_message', 'Error al añadir el gasto');
      }
    });

    socket.on('delete_expense', async ({ code, expenseId }) => {
      try {
        const group = await Group.findOneAndUpdate(
          { code },
          { $pull: { expenses: { _id: expenseId } } },
          { new: true }
        );

        if (!group) return;

        const settlements = settle(group.members, group.expenses);
        io.to(code).emit('group_updated', { group, settlements });
      } catch (error) {
        console.error('Delete expense error:', error);
        socket.emit('error_message', 'Error al borrar el gasto');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
