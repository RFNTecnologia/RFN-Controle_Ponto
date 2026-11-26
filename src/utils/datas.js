export function dataLocalISO(date = new Date()) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function mesLocalISO(date = new Date()) {
  return dataLocalISO(date).slice(0, 7);
}
