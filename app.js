const categories = {
  expense: ['Food & drinks', 'Transport', 'Shopping', 'Bills', 'Home', 'Health', 'Fun', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other']
};
const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
let type = 'expense';
let entries = JSON.parse(localStorage.getItem('pocket-ledger-entries') || '[]');
let deferredPrompt;
const $ = id => document.getElementById(id);
const form = $('transactionForm'), category = $('category');

function format(value) { return currency.format(value); }
function populateCategories() {
  category.innerHTML = categories[type].map(item => `<option>${item}</option>`).join('');
}
function save() { localStorage.setItem('pocket-ledger-entries', JSON.stringify(entries)); }
function render() {
  const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const expense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  $('incomeTotal').textContent = format(income);
  $('expenseTotal').textContent = format(expense);
  $('balance').textContent = format(income - expense);
  const list = $('transactions'); list.replaceChildren();
  [...entries].sort((a,b) => b.date.localeCompare(a.date) || b.id - a.id).forEach(entry => {
    const node = $('transactionTemplate').content.firstElementChild.cloneNode(true);
    node.classList.add(entry.type);
    node.querySelector('.transaction-details b').textContent = entry.description;
    node.querySelector('.transaction-details small').textContent = `${entry.category} · ${new Date(entry.date + 'T12:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}`;
    node.querySelector('.transaction-value b').textContent = `${entry.type === 'income' ? '+' : '−'}${format(entry.amount)}`;
    node.querySelector('button').onclick = () => { entries = entries.filter(e => e.id !== entry.id); save(); render(); };
    list.append(node);
  });
}
document.querySelectorAll('.type-option').forEach(button => button.addEventListener('click', () => {
  type = button.dataset.type;
  document.querySelectorAll('.type-option').forEach(b => b.classList.toggle('active', b === button));
  populateCategories();
}));
form.addEventListener('submit', event => {
  event.preventDefault();
  entries.push({ id: Date.now(), type, description: $('description').value.trim(), amount: Number($('amount').value), category: category.value, date: $('date').value });
  save(); render(); form.reset(); $('date').value = new Date().toISOString().slice(0,10); populateCategories();
});
$('clearButton').addEventListener('click', () => { if (entries.length && confirm('Delete all transactions?')) { entries = []; save(); render(); } });
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; $('installButton').classList.remove('hidden'); });
$('installButton').addEventListener('click', async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('installButton').classList.add('hidden'); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
$('date').value = new Date().toISOString().slice(0,10); populateCategories(); render();
