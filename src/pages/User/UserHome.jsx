import "../../assets/style/UserPage/UserHome.css";
import { Link } from "react-router-dom";
import Head from "../../components/UserComponents/Head";
import HeadSearch from "../../components/UserComponents/HeadSearch";
import BrowseByCategoryPage from "../BrowseByCategoryPage";
const UserHome = () => {
  return (
    <div className="user-home">
      <Head />
      <HeadSearch />
      <BrowseByCategoryPage />
      {/* <Link to="/user" className="upload-link">Search Songs</Link> */}
    </div>
  );
};

export default UserHome;
