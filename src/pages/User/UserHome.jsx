import "../../assets/style/UserPage/UserHome.css";
import { Link } from "react-router-dom";

const UserHome = () => {
  return (
    <div className="user-home">
      
      <Link to="/user" className="upload-link">Upload New Resource</Link>
    </div>
  );
};

export default UserHome;
