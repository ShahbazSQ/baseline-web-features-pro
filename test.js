const user = data?.name ?? 'Anonymous';
console.log(user);
async function fetchData() {
  return await fetch('/api');
}