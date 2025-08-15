import "../../assets/style/UserPage/UserHome.css";
import { Link } from "react-router-dom";
import Head from "../../components/UserComponents/Head";

import BrowseByCategoryPage from "../BrowseByCategoryPage";

import Selector from "../../components/UserComponents/Selector";
const UserHome = () => {
  return (
    <div className="user-home">
      <Head />
      <Selector />
      {/* <BrowseByCategoryPage /> */}
      {/* <Link to="/user" className="upload-link">Search Songs</Link> */}
    </div>
  );
};

export default UserHome;
