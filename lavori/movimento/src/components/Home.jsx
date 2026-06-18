// Data odierna in formato ISO (YYYY-MM-DD) per la "sfida del giorno"
function oggi() {
  return new Date().toISOString().slice(0, 10)
}

export default function Home({ onStart }) {
  return (
    <div className="container-xl mv-hero">
      {/* striscia delle modalità (solo Percorso Lampo è attivo per ora) */}
      <div className="mv-tagstrip mb-5">
        <span className="active">— PERCORSO LAMPO</span>
        <span>
          <span className="mv-dot-mini me-1" aria-hidden="true" /> MEMORIA PUNTI
        </span>
        <span>┃|┃ BATTITO</span>
      </div>

      <div className="row align-items-center g-5">
        <div className="col-12 col-lg-7">
          <h1 className="mv-hero__title">
            Percorso
            <br />
            Lampo
          </h1>
          <p className="mv-hero__lead mt-4">
            Guarda un percorso scomparire, poi ridisegnalo a memoria con un
            unico gesto continuo.
          </p>
        </div>

        <div className="col-12 col-lg-5 text-center text-lg-end">
          {/* curva decorativa, come la sinusoide degli screenshot */}
          <svg
            className="mv-hero__curve"
            viewBox="0 0 400 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 110 C 90 110, 110 30, 200 70 S 320 110, 380 30"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="20" cy="110" r="7" fill="var(--mv-accent)" />
          </svg>
        </div>
      </div>

      <div className="mt-5" style={{ maxWidth: '640px' }}>
        <button
          type="button"
          className="mv-pill mv-pill--primary mb-3"
          onClick={() => onStart('libera')}
        >
          <span>Gioca a Percorso Lampo</span>
          <span aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          className="mv-pill mv-pill--ghost"
          onClick={() => onStart('sfida')}
        >
          <span>Sfida del giorno</span>
          <span className="mv-pill__meta">{oggi()}</span>
        </button>
      </div>
    </div>
  )
}
