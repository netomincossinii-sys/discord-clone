import { LogoIcon } from './LogoIcon'
import { HeadphonesIcon, InstagramIcon, ArrowRightIcon } from './Icon'

const INSTAGRAM_URL = 'https://www.instagram.com/callf.y/'
const SUPPORT_EMAIL = 'callfy2026@gmail.com'

export function HomeView() {
  return (
    <div className="home-view">
      <div className="home-hero-card">
        <div className="home-hero-banner">
          <div className="home-hero-icon">
            <LogoIcon size={32} />
          </div>
          <h2 className="home-hero-title">Bem-vindo ao Callfy</h2>
        </div>
        <div className="home-hero-body">
          <p className="home-hero-desc">
            O Callfy é uma plataforma para conversar, conectar e compartilhar em tempo real, com praticidade e
            privacidade.
          </p>
          <p className="home-hero-subdesc">Chamadas, chat e compartilhamento em um só lugar.</p>
        </div>
      </div>

      <a className="home-link-card" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
        <div className="home-link-icon">
          <InstagramIcon size={22} />
        </div>
        <div className="home-link-text">
          <p className="home-link-title">Siga o Callfy no Instagram</p>
          <p className="home-link-desc">Novidades, bastidores e atualizações em primeira mão. @callf.y</p>
        </div>
        <ArrowRightIcon size={18} className="home-link-arrow" />
      </a>

      <div className="home-hero-card">
        <div className="home-hero-banner support">
          <div className="home-hero-icon">
            <HeadphonesIcon size={32} />
          </div>
          <h2 className="home-hero-title">Fale com o suporte</h2>
        </div>
        <div className="home-hero-body">
          <p className="home-hero-desc">
            Precisa de ajuda? Envie uma mensagem para nossa equipe e receba suporte com rapidez e praticidade.
          </p>
          <p className="home-hero-subdesc">Dúvidas, problemas ou sugestões — estamos aqui para ajudar.</p>
          <a className="home-support-btn" href={`mailto:${SUPPORT_EMAIL}`}>
            Enviar mensagem <ArrowRightIcon size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}
