import { useNavigate } from 'react-router-dom';
import "../../assets/style/UserPage/Selector.css";

const Selector = () => {
    const navigate = useNavigate();

    const handleAllClick = () => {
        navigate('/search-filter');
    };

    const handleCategoryClick = () => {
        navigate('/browse');
    };

    const handlePlaylistClick = () => {
        navigate('/user/playlists');
    };

    const handleQueueClick = () => {
        navigate('/queue');
    };

    return (
        <div className="selector">
            <div className="selector__options">
                <div className="selector__option" onClick={handleAllClick}>
                    <i className="fa-solid fa-filter selector__icon"></i>
                    <span>Filter</span>
                </div>
                <div className="selector__option" onClick={handleCategoryClick}>
                    <i className="fa-solid fa-layer-group selector__icon"></i>
                    <span>Category</span>
                </div>
                <div className="selector__option" onClick={handlePlaylistClick}>
                    <i className="fa-solid fa-list selector__icon"></i>
                    <span>Playlist</span>
                </div>
                <div className="selector__option" onClick={handleQueueClick}>
                    <i className="fa-solid fa-queue-list selector__icon"></i>
                    <span>Queue</span>
                </div>
            </div>
        </div>
    );
};

export default Selector;