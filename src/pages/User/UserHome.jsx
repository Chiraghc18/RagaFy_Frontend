import "../../assets/style/UserPage/UserHome.css";
import { Link } from "react-router-dom";
import Head from "../../components/UserComponents/Head";

import Selector from "../../components/UserComponents/Selector";
const UserHome = () => {
  return (
    <div className="user-home">
      <Head />
      <Selector />
    </div>
  );
};

export default UserHome;
