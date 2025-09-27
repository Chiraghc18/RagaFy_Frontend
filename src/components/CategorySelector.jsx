import album from "../assets/images/album.png";
import artist from "../assets/images/Artist.png";
import genre from "../assets/images/Genre.png";
import hero from "../assets/images/Hero.png";
import heroine from "../assets/images/Heroine.png";
import language from "../assets/images/Language.png";
import singer from "../assets/images/Singer.png";
import movie from "../assets/images/Movie.png";

const images = {
  album,
  artist,
  genre,
  hero,
  heroine,
  language,
  singer,
  movie,
};

export default function CategorySelector({ category, setCategory, categories }) {
  return (
    <div className="browse__category-selector">
      {Object.keys(categories).map((cat) => (
        <div
          key={cat}
          onClick={() => setCategory(cat)}
          className={`browse__category-button ${category === cat ? "browse__category-button--active" : ""}`}
        >
          <img src={images[cat]} alt={cat} className="browse__category-image" />
        </div>
      ))}
    </div>
  );
}
