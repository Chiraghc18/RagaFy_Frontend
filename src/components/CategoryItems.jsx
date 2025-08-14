export default function CategoryItems({ items, onSelect }) {
  return (
    <div className="category-selector">
      {items.map((item) => (
        <div
          key={item._id}
          onClick={() => onSelect(item)}
           className="category-button"
        >
          <img src={item.photo} alt={item.name || item.title} className="category-image" />
        <span className="category-name">{item.name || item.title}</span>
        </div>
      ))}
    </div>
  );
}
