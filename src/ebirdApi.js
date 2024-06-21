export async function queryRecentObservationsCoords(lat, long) {
  const maxResults = 30;
  const url =
    `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${long}&maxResults=${maxResults}`;

  return await requestEbirdApi(url);
}

export async function queryNotableObservationsCoords(lat, long) {
  const maxResults = 30;
  const url =
    `https://api.ebird.org/v2/data/obs/geo/recent/notable?lat=${lat}&lng=${long}&maxResults=${maxResults}`;

  return await requestEbirdApi(url);
}

export async function requestEbirdApi(url) {
  const res = await fetch(url,
    { headers: {
      "X-eBirdApiToken": import.meta.env.VITE_EBIRD_API_KEY
    }}
  );
  const data = await res.json();

  return data;
}