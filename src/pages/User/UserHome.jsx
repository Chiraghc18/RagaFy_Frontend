import "../../assets/style/UserPage/UserHome.css";
import { Link } from "react-router-dom";
import Head from "../../components/UserComponents/Head";
const UserHome = () => {
  return (
    <div className="user-home">
      <Head />
      <Link to="/user" className="upload-link">Search Songs</Link>
    </div>
  );
};

export default UserHome;
