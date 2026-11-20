import './Footer.css'

const YEAR = new Date().getFullYear()

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>© {YEAR} Moodhoo Neehal · Built with React and Vite</p>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  )
}

export default Footer
