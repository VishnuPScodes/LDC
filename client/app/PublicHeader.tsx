import LandingThemeToggle from './LandingThemeToggle';
import PublicNav from './PublicNav';

export default function PublicHeader(){return <header className="header public-header"><a className="brand" href="/">LDC<span>.</span> practice</a><PublicNav/><div className="public-header-actions"><LandingThemeToggle/><a className="secondary-button public-sign-in" href="/login">Sign in</a></div></header>}
