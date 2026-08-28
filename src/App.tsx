import { HashRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Landing from "./pages/Landing";
import Verify from "./pages/Verify";
import LanguageSelect from "./pages/LanguageSelect";
import ChooseStart from "./pages/ChooseStart";
import DescribeProblem from "./pages/DescribeProblem";
import Understanding from "./pages/Understanding";
import Suitability from "./pages/Suitability";
import QuestionsHero from "./pages/QuestionsHero";
import SupportingInfo from "./pages/SupportingInfo";
import AuthorityMatch from "./pages/AuthorityMatch";
import Review from "./pages/Review";
import Payment from "./pages/Payment";
import Submitted from "./pages/Submitted";
import Tracking from "./pages/Tracking";
import ExplainStatus from "./pages/ExplainStatus";
import ResponsePage from "./pages/ResponsePage";
import FirstAppeal from "./pages/FirstAppeal";
import EndScreen from "./pages/EndScreen";
import Kiosk from "./pages/kiosk/Kiosk";

// Authentication pages
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import VerifyOtp from "./pages/VerifyOtp";
import CreatePin from "./pages/CreatePin";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/language" element={<LanguageSelect />} />
          <Route path="/start" element={<ChooseStart />} />
          <Route path="/describe" element={<DescribeProblem />} />
          <Route path="/understanding" element={<Understanding />} />
          <Route path="/suitability" element={<Suitability />} />
          <Route path="/questions" element={<QuestionsHero />} />
          <Route path="/supporting" element={<SupportingInfo />} />
          <Route path="/authority" element={<AuthorityMatch />} />
          <Route path="/review" element={<Review />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/submitted/:id" element={<Submitted />} />
          <Route path="/track/:id" element={<Tracking />} />
          <Route path="/track/:id/explain" element={<ExplainStatus />} />
          <Route path="/track/:id/response" element={<ResponsePage />} />
          <Route path="/track/:id/appeal" element={<FirstAppeal />} />
          <Route path="/track/:id/end" element={<EndScreen />} />
          <Route path="/kiosk/*" element={<Kiosk />} />
          
          {/* Auth pages */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/create-pin" element={<CreatePin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
