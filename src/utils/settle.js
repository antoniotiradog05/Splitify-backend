/**
 * Dado un array de miembros y gastos, calcula las transferencias mínimas
 * para que todos queden a cero.
 *
 * Ejemplo:
 * Marcos pagó 60€ de cena para 3 → Antonio y Luis le deben 20€ cada uno
 * Antonio pagó 30€ de copas para 3 → Marcos y Luis le deben 10€ cada uno
 *
 * Resultado óptimo: Luis → Marcos 10€, Luis → Antonio 10€
 */
function settle(members, expenses) {
  // 1. Calcular balance neto de cada persona
  const balance = {};
  members.forEach(m => balance[m] = 0);

  expenses.forEach(({ paidBy, amount, splitAmong, customAmounts }) => {
    if (splitAmong.length === 0) return;
    
    balance[paidBy] += amount;
    
    if (customAmounts && Object.keys(customAmounts).length > 0) {
      // Reparto personalizado
      Object.entries(customAmounts).forEach(([member, val]) => {
        if (balance[member] !== undefined) {
          balance[member] -= val;
        }
      });
    } else {
      // Reparto equitativo (fallback)
      const share = amount / splitAmong.length;
      splitAmong.forEach(m => {
        if (balance[m] !== undefined) {
          balance[m] -= share;
        }
      });
    }
  });

  // 2. Separar deudores y acreedores
  const debtors = Object.entries(balance)
    .filter(([, v]) => v < -0.01)
    .map(([name, val]) => ({ name, val: -val }));
    
  const creditors = Object.entries(balance)
    .filter(([, v]) => v > 0.01)
    .map(([name, val]) => ({ name, val }));

  // 3. Emparejar con mínimas transacciones (greedy)
  const transactions = [];

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].val, creditors[j].val);
    transactions.push({
      from: debtors[i].name,
      to: creditors[j].name,
      amount: Math.round(amount * 100) / 100
    });

    debtors[i].val -= amount;
    creditors[j].val -= amount;

    if (debtors[i].val < 0.01) i++;
    if (creditors[j].val < 0.01) j++;
  }

  return transactions;
}

module.exports = { settle };
