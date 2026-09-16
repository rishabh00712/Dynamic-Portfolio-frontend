import { GoogleOAuthProvider } from "@react-oauth/google";

import Header from "./components/Header";
import About from "./components/About";
import Project from "./components/Project";
import Experience from "./components/Experience";
import Education from "./components/Education";
import Certificates from "./components/Certificates";
import Contact from "./components/Contact";
import Skills from "./components/Skill";
import Resume from "./components/Resume";
import Achievements from "./components/Achievements";

import AiChatOrb from "./components/Aichatorb";
import GoogleLoginCorner from "./components/GoogleLoginCorner";
import EmojiJar from "./components/Emojijar";

function App() {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLoginCorner />
            <Header />
            <AiChatOrb />
            <EmojiJar />
            <About />
            <Project />
            <Experience />
            <Education />
            <Skills/>
            <Certificates />
            <Achievements />
            <Contact />
            <Resume />
        </GoogleOAuthProvider>
    );
}

export default App;