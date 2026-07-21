export default function CategoryItems({ items, onSelect }) {
  return (
    <div className="ci-grid">
      {items.map((item) => (
        <div
          key={item._id}
          onClick={() => onSelect(item)}
          className="ci-card"
        >
          <img
            src={item.photo || item.imageUrl}
            alt={item.name || item.title}
            className="ci-card__img"
          />
          <span className="ci-card__name">
            {item.name || item.title}
          </span>
        </div>
      ))}
    </div>
  );
}