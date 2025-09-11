// LegalFlow3 - AWS Amplify Configuration
// This file configures Amplify for the LegalFlow3 application

import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";

// Configure Amplify with the generated outputs
Amplify.configure(outputs);

export default Amplify;
