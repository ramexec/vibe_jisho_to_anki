
export async function searchJisho(query) {
  if (!query.trim()) return [];

  const response = await fetch(
    `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Unable to retrieve dictionary results.");
  }

  const json = await response.json();
  return json.data;
}
