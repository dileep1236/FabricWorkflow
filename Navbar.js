import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <Link to="/Home">Home</Link>| &nbsp;
      {/* <Link to="/file-upload-mapping">Column Mapping</Link>| &nbsp; */}
      {/* <Link to="/workflow">workflow</Link>| &nbsp; */}
      {/* <Link to="/eim">eim</Link>| &nbsp; */}
       <Link to="/sourcetolanding">Landing Tasks</Link>| &nbsp;
      <Link to="/sourcetovalidated">Bronze Tasks</Link>| &nbsp;
      <Link to="/validatedtoenriched">Silver Tasks</Link>
      {/* <Link to="/sourceconfig">Source Config</Link>  */}
    </nav>
  );
}

export default Navbar;
