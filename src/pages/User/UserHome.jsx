import "../../assets/style/UserPage/UserHome.css";
import { Link } from "react-router-dom";
import Head from "../../components/UserComponents/Head";

import Selector from "../../components/UserComponents/Selector";

import AllSongs from "../../components/UserComponents/AllSong";
const UserHome = () => {
  return (
    <div className="user-home">
      <Head />
      <Selector />
      <AllSongs />
    </div>
  );
};

export default UserHome;
