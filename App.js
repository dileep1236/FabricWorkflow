import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import FileUploadMapping from './FileUploadMapping';
import SiginIn  from './SiginIn';
import { css } from '@emotion/react';
import Workflow  from './WorkflowEditor1';
import WorkflowEditor from './workflow';
import EimComponent from './EIMComponenet';
import Designer  from './Designer';
import SourceToValidated from './SourceToValidated';
import PipelineWorkflow from './pipelineworkflow';
import ValidatedToEnrichedConfigEditor from './ValidatedToEnrichedConfigEditor';
import    LandingConfigEditor  from './LandingConfigEditor';
import BronzeToValidatedConfigEditor from './BronzeToValidatedConfigEditor';
//import RawToValidatedConfigEdit from './BronzeToValidatedConfigEditor';
import ValidatedToEnrichedForm from './ValidatedToEnrichedConfigEditor';
function App() {
  return (
  <div  className='container'>
    <Router>
      <Navbar />
      <Routes>
       <Route path="/" element={<SiginIn />} />
        <Route path="/file-upload-mapping" element={<FileUploadMapping />} />
        <Route path="/workflow" element={<PipelineWorkflow />} />
        {/* <Route path="/eim" element={<Designer />} /> */}
         <Route path="/sourcetolanding" element={<LandingConfigEditor />} />
        <Route path="/sourcetovalidated" element={<BronzeToValidatedConfigEditor />} />
        <Route path="/validatedtoenriched" element={<ValidatedToEnrichedForm />} />
      </Routes>
    </Router>
    </div>
   
  );
}

export default App;
