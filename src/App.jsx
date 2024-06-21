import { useReducer } from "react";
import { queryRecentObservationsCoords, queryNotableObservationsCoords } from "./ebirdApi.js";
import "./App.css";

const initialData = {
  faveSpecies: [],
  searchResults: [],
  images: {},
}

function dedupeResults(results) {
  const objToId = ({ obsDt, locId, speciesCode }) => `${obsDt}-${locId}-${speciesCode}`;

  const ids = results.map(objToId);
  const filtered = results.filter((item, index) => !ids.includes(objToId(item), index + 1));

  console.log(filtered);
  return filtered;
}

function dataReducer(data, action) {
  switch (action.type) {
    case 'save-results':
      // dedupe keys results first

      return {
        ...data,
        searchResults: dedupeResults(action.results)
      }
    case 'save-image':
      return {
        ...data,
        images: {
          ...data.images,
          [action.speciesCode]: action.url,
        }
      }
    case 'add-fave-species':
      return {
        ...data,
        faveSpecies: [
          ...data.faveSpecies,
          {
            speciesCode: action.speciesCode,
            comName: action.comName,
            sciName: action.sciName,
          },
        ]
      }
    case 'remove-fave-species':
      return {
        ...data,
        faveSpecies: [
          ...data.faveSpecies.filter((species) => species.speciesCode !== action.speciesCode)
        ]
      } 
    default:
      return data;
  }
}

function App() {
  const [ data, dispatch ] = useReducer(dataReducer, initialData);

  async function handleSearch(evt) { 
    evt.preventDefault();
    const formdata = new FormData(evt.target);
    for (const entry of formdata.entries()) {
      console.log(entry);
      if (entry[1] === "") {
        // error message
        return;
      }
    }

    const queryFn = formdata.get("searchNotable") ? queryNotableObservationsCoords : queryRecentObservationsCoords;

    const results = await queryFn(formdata.get("latitude"), formdata.get("longitude"));
    console.log(results);

    dispatch({
      type: 'save-results',
      results: results,
    });

    for (const obs of results) {
      if (!Object.prototype.hasOwnProperty.call(obs, obs.speciesCode)) {
        getBirdImg(obs.sciName, obs.speciesCode);
      }
    }
  }

  async function getBirdImg(name, speciesCode) {
    // const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&format=json&piprop=thumbnail&titles=${encodeURIComponent(name)}&pithumbsize=300&redirects=1`;
    const url = `/api/w/api.php?action=query&prop=pageimages|pageprops&format=json&piprop=thumbnail&titles=${encodeURIComponent(name)}&pithumbsize=300&redirects`;

    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query.pages;

    if(Object.keys(pages).length > 0) {
      const id = Object.keys(pages)[0];

      dispatch({
        type: 'save-image',
        speciesCode: speciesCode,
        url: pages[id].thumbnail.source 
      });
    }
  }

  function handleAddFavorite(obs) {
    dispatch({
      type: 'add-fave-species',
      speciesCode: obs.speciesCode,
      comName: obs.comName,
      sciName: obs.sciName,
    });
  }

  function handleRemoveFavorite(speciesCode) {
    dispatch({
      type: 'remove-fave-species',
      speciesCode: speciesCode,
    });
  }

  function FavoriteButton({obs}) {
    return <span className="iconButton" onClick={() => {handleAddFavorite(obs)}}>
      <i className="fa-regular fa-star" title="Favorite Species" aria-hidden="true"></i>
      <span className="sr-only">Favorite This Species</span>
    </span>
  }

  function UnfavoriteButton({speciesCode}) {
    return <span className="iconButton" onClick={() => {handleRemoveFavorite(speciesCode)}}>
      <i className="fa-solid fa-star" title="Unfavorite Species" aria-hidden="true"></i>
      <span className="sr-only">Unfavorite This Species</span>
    </span>
  }

  return (
    <>
      <h1>Birds Birds Birds</h1>
      <h2>Spot some birds?</h2>
      <form onSubmit={handleSearch}>
        <label htmlFor="latitude">Latitude</label>
        <input name="latitude" placeholder="latitude" />
        <br />

        <label htmlFor="longitude">Longitude</label>
        <input name="longitude" placeholder="longitude" />

        <br /><br />
        <button type="submit">Search</button>
        <input type="checkbox" name="searchNotable"></input>
        <label htmlFor="searchNotable">notable birbs only?</label>
      </form>

      <h2><i className="fa-solid fa-star"></i> Favorite Species <i className="fa-solid fa-star"></i></h2>
      <div className="resultsGrid">
        {data.faveSpecies.map((species) => {
          return <div className="card" key={species.speciesCode}>
              <h3>
                <a href={`https://ebird.org/species/${species.speciesCode}`}>{species.comName}</a>
                <UnfavoriteButton speciesCode={species.speciesCode}></UnfavoriteButton>
              </h3>
              <p className="faded"><i>{species.sciName}</i></p>
              <img src={data.images[species.speciesCode] ?? 'https://placehold.co/300x300?text=bird?'}></img>
          </div> 
        })}
        {data.faveSpecies.length == 0 && "No favorites saved."}
      </div>

      <h2>Recent Nearby Observations</h2> 
      <div className="resultsGrid">
        {data.searchResults.map((obs) => {
          return <div className="card" key={obs.obsDt+obs.locId+obs.speciesCode}>
              <h3>
                <a href={`https://ebird.org/species/${obs.speciesCode}`}>{obs.comName}</a>
                {
                data.faveSpecies.filter((species) => species.speciesCode === obs.speciesCode).length === 0 ? 
                  <FavoriteButton obs={obs}></FavoriteButton> : <UnfavoriteButton speciesCode={obs.speciesCode}></UnfavoriteButton>
                }
              </h3>
              <p className="faded"><i>{obs.sciName}</i></p>
              <img src={data.images[obs.speciesCode] ?? 'https://placehold.co/300x300?text=bird?'}></img>
              <p className="faded">Seen {obs.obsDt}</p>
              <p>📍️<a href={`https://www.google.com/maps/place/${obs.lat},${obs.lng}`}>{obs.locName}</a></p>
          </div>
        })}
        {data.searchResults.length == 0 && "No birbs found."}
      </div>

      <p>data pulled from <a href="https://documenter.getpostman.com/view/664302/S1ENwy59#intro">ebird API 2.0</a> and wikimedia.</p>
    </>
  );
}

export default App;
