export default function CategoryItems({ items, onSelect }) {
  return (
    <div className="browse__category-items">
      {items.map((item) => (
        <div
          key={item._id}
          onClick={() => onSelect(item)}
          className="browse__category-item"
        >
          <img
            src={item.photo}
            alt={item.name || item.title}
            className="browse__category-item-image"
          />
          <span className="browse__category-item-name">
            {item.name || item.title}
          </span>
        </div>
      ))}
    </div>
  );
}
