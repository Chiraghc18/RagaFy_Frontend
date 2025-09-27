
import { useNavigate } from 'react-router-dom';
import "../../assets/style/UserPage/Selector.css";
const Selector = () => {
    const navigate = useNavigate();

    const handleAllClick = () => {
        navigate('/search-filter'); // route to All page
    };

    const handleCategoryClick = () => {
        navigate('/browse'); // route to BrowseByCategoryPage
    };

    const handlePlaylistClick = () => {
        navigate('/user/playlists'); // route to Playlist page
    };

    const handleQueueClick = () => {
        navigate('/queue'); // route to Queue page
    };

    return (
      <>
        
        <div className="selector">
            <div className="Selector-category-options">
                <div className="options" onClick={handleAllClick}>Filter</div>
                <div className="options" onClick={handleCategoryClick}>Category</div>
                <div className="options" onClick={handlePlaylistClick}>PlayList</div>
                <div className="options" onClick={handleQueueClick}>Queue</div>
            </div>
        </div>
      </>
    );
};

export default Selector;
