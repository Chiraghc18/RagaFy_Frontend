import React from 'react';
import { useNavigate } from 'react-router-dom';

const Selector = () => {
    const navigate = useNavigate();

    const handleAllClick = () => {
        navigate('/all'); // route to All page
    };

    const handleCategoryClick = () => {
        navigate('/browse'); // route to BrowseByCategoryPage
    };

    const handlePlaylistClick = () => {
        navigate('/playlist'); // route to Playlist page
    };

    const handleQueueClick = () => {
        navigate('/queue'); // route to Queue page
    };

    return (
        <div className="selector">
            <div className="Selector-category-options">
                <div className="options" onClick={handleAllClick}>All</div>
                <div className="options" onClick={handleCategoryClick}>Category</div>
                <div className="options" onClick={handlePlaylistClick}>PlayList</div>
                <div className="options" onClick={handleQueueClick}>Queue</div>
            </div>
        </div>
    );
};

export default Selector;
