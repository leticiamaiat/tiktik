import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle2, ChevronDown, Send } from 'lucide-react'
import logoNavy from '../assets/00_logo_2.png'
import logoWhite from '../assets/00_logo_1.png'
import heroImg from '../assets/tik_img_01.png'
import valorizeImg from '../assets/tik_img_02.png'
import icon03_1 from '../assets/tik_img_03-1.png'
import icon03_2 from '../assets/tik_img_03-2.png'
import icon03_3 from '../assets/tik_img_03-3.png'
import icon03_4 from '../assets/tik_img_03-4.png'
import icon03_5 from '../assets/tik_img_03-5.png'
import icon03_6 from '../assets/tik_img_03-6.png'
import step04_1 from '../assets/tik_img_04-1.png'
import step04_2 from '../assets/tik_img_04-2.png'
import step04_3 from '../assets/tik_img_04-3.png'
import step04_5 from '../assets/tik_img_04-5.png'
import audience05_1 from '../assets/tik_img_05-1.jpg'
import audience05_2 from '../assets/tik_img_05-2.jpg'
import audience05_3 from '../assets/tik_img_05-3.jpg'
import contatoImg from '../assets/tik_img_07.png'

const NAV_LINKS = [
  { label: 'Home', href: '#topo' },
  { label: 'Porque usar', href: '#porque-usar' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Para quem é', href: '#para-quem' },
  { label: 'Planos', href: '#planos' },
  { label: 'FAQ', href: '#faq' },
]

const FEATURES = [
  { icon: icon03_1, title: 'Visibilidade das entregas', text: 'Mostre cada entrega realizada, valorizando o trabalho diário da gestão.' },
  { icon: icon03_2, title: 'Aproximação com o cidadão', text: 'Aproxime o cidadão do que está sendo feito, com informações atualizadas.' },
  { icon: icon03_3, title: 'Centralização de dados', text: 'Centralize entregas e evite perda ou dispersão de informações.' },
  { icon: icon03_4, title: 'Comunicação transparente', text: 'Amplie a comunicação pública com transparência e credibilidade.' },
  { icon: icon03_5, title: 'Prestação de contas facilitada', text: 'Facilite a prestação de contas, com registros e relatórios acessíveis.' },
  { icon: icon03_6, title: 'Operação digital simples', text: 'Opere tudo de forma digital, simples, intuitiva e segura.' },
]

const STEPS = [
  { number: 1, title: 'Registre', image: step04_1 },
  { number: 2, title: 'A Tik processa imediatamente', image: step04_2 },
  { number: 3, title: 'Divulgação imediata', image: step04_3 },
  { number: 4, title: 'Resultado em escala', image: step04_5 },
]

const AUDIENCES = [
  { title: 'Gestores Públicos', text: 'Uma plataforma pensada para quem executa, para quem gere e para quem vive a cidade, que conecta entregas, dados e transparência em um só lugar.', image: audience05_1 },
  { title: 'Equipes técnicas e operacionais', text: 'Registre ações no campo, valide com evidências e organize informações sem retrabalho. Menos planilhas, menos informações soltas, mais controle e rastreabilidade.', image: audience05_2 },
  { title: 'Cidadãos', text: 'Veja o que está sendo feito, onde e quando. Acompanhe obras, serviços e melhorias com clareza, mapas e atualizações em tempo real.', image: audience05_3 },
]

const PLANS = [
  {
    name: 'Básico',
    tagline: 'Para começar a dar visibilidade às entregas.',
    highlight: 'Ideal para testar a plataforma e iniciar a cultura de registro das entregas.',
    features: ['10 tiks por dia', '2 usuários', 'Mapa de entregas', 'Registro e validação de entregas'],
    price: 'Grátis',
    cta: 'Começar agora',
    outline: true,
  },
  {
    name: 'Essencial',
    tagline: 'Para mostrar resultados com consistência.',
    highlight: 'Ideal para prefeituras que querem dar visibilidade contínua às ações da gestão.',
    features: ['20 tiks por dia', '5 compartilhamentos por dia*', '8 usuários', 'Mapa de entregas', 'Relatório básico de acompanhamento'],
    price: 'R$ 1.599,00/mês',
    cta: 'Quero esse plano',
  },
  {
    name: 'Avançado',
    tagline: 'Para gestão ativa, integrada e orientada a dados.',
    highlight: 'Ideal para gestões que precisam integrar secretarias e fortalecer a prestação de contas.',
    features: ['40 tiks por dia', '10 compartilhamentos por dia*', '15 usuários', 'Mapa de entregas', 'Painéis e relatórios dinâmicos'],
    price: 'R$ 3.299,00/mês',
    cta: 'Fale com a gente',
    recommended: true,
  },
  {
    name: 'Transformador',
    tagline: 'Para quem quer mudar a forma de governar.',
    highlight: 'Ideal para grandes cidades ou gestões com alta demanda de obras, serviços e comunicação.',
    features: ['Tiks ilimitados', '24 compartilhamentos por dia*', '30 usuários', 'Mapa de entregas', 'Painéis e relatórios dinâmicos'],
    price: 'R$ 5.399,00/mês',
    cta: 'Agendar simulação',
  },
]

const FAQS = [
  { q: 'A tik é segura e está em conformidade com a LGPD?', a: 'Sim. A tik segue as diretrizes da LGPD, com controle de acesso, criptografia dos dados e políticas claras sobre o uso das informações coletadas.' },
  { q: 'A plataforma integra com sistemas da prefeitura?', a: 'Sim, a tik pode ser integrada aos canais oficiais da prefeitura, como site e redes sociais, e a outros sistemas de gestão conforme a necessidade do município.' },
  { q: 'Precisa de equipe técnica para operar a tik?', a: 'Não. A plataforma foi criada para ser simples e intuitiva, sem necessidade de conhecimento técnico para registrar, validar e divulgar entregas.' },
  { q: 'Como funciona a implantação da plataforma?', a: 'Nossa equipe configura o ambiente da prefeitura, cadastra os usuários e acompanha os primeiros registros para garantir uma implantação rápida e tranquila.' },
  { q: 'O cidadão precisa baixar algum aplicativo?', a: 'Não. O cidadão acompanha as entregas pelo site oficial, redes sociais ou mapa de entregas, sem precisar instalar nada.' },
  { q: 'A solução gera relatórios oficiais?', a: 'Sim. A tik gera relatórios de acompanhamento e prestação de contas, com dados organizados para uso interno e comunicação pública.' },
]

const CARGOS = ['Prefeito(a)', 'Secretário(a)', 'Gestor(a) técnico(a)', 'Outro']

export default function Principal() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const [form, setForm] = useState({ nome: '', cargo: '', telefone: '' })

  const handleDemoSubmit = (e) => {
    e.preventDefault()
    toast.success('Recebemos seu pedido! Em breve entraremos em contato.')
    setForm({ nome: '', cargo: '', telefone: '' })
  }

  return (
    <div id="topo" className="min-h-screen bg-white text-gray-800">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <TikLogo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-tik-orange transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
          <button onClick={() => navigate('/login')} className="btn-orange px-6 py-2 text-sm">
            Entrar
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gray-100 py-16 md:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-gray-800">
              Dê um <span className="text-tik-orange">tik</span><br />
              em cada realização.
            </h1>
            <h2 className="text-3xl md:text-4xl font-black text-tik-blue mt-5 leading-tight">
              Conecte quem cuida da cidade.
            </h2>
            <p className="mt-6 text-gray-600 max-w-md">
              Centralize, publique e acompanhe obras e melhorias em um só lugar, <strong className="text-gray-800">com transparência, agilidade e visão de progresso.</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#faq" className="btn-orange px-6 py-3">Solicite demonstração</a>
              <a href="#porque-usar" className="px-6 py-3 rounded-full border-2 border-tik-blue text-tik-blue font-semibold hover:bg-tik-blue hover:text-white transition-colors">
                Saiba mais
              </a>
            </div>
          </div>
          <img src={heroImg} alt="Trabalhador registrando uma entrega com o celular" className="w-full h-auto rounded-2xl" />
        </div>
      </section>

      {/* Valorize o que é feito */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <img src={valorizeImg} alt="Cidadã vendo no Instagram uma entrega publicada" className="w-full h-auto rounded-2xl" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight">Valorize o que é feito.</h2>
            <h3 className="text-3xl md:text-4xl font-black text-tik-blue leading-tight">Mostre pra todo mundo o que é entregue!</h3>
            <p className="mt-6 text-gray-600">
              Registre, valide e publique obras, serviços e melhorias em tempo real, com clareza, transparência e objetividade. Mais do que comunicar, a tik organiza, comprova e dá visibilidade ao que foi feito, criando uma relação mais direta e confiável entre a gestão e o cidadão.
            </p>
            <p className="mt-4 font-bold text-gray-800">
              Cada avanço registrado é um tik dado. Cada tik, uma entrega reconhecida.
            </p>
            <a href="#faq" className="btn-orange inline-block mt-6 px-6 py-3">
              Quero dar um tik nas entregas da minha cidade
            </a>
          </div>
        </div>
      </section>

      {/* Porque usar */}
      <section id="porque-usar" className="relative bg-gray-100 py-16 md:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-800">
            Porque usar a <span className="text-tik-blue">tik</span>
          </h2>
          <p className="text-center text-gray-600 mt-3">
            Com a plataforma, <strong className="text-gray-800">a prefeitura consegue:</strong>
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {FEATURES.map(({ icon, title, text }) => (
              <div key={title} className="bg-white rounded-2xl shadow-sm p-6">
                <img src={icon} alt="" className="w-11 h-11 rounded-xl mb-4" />
                <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a href="#faq" className="btn-orange inline-block px-6 py-3">
              Quero otimizar as entregas da minha gestão
            </a>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-md mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 leading-tight">
              Como funciona a <span className="text-tik-blue">tik</span>?
            </h2>
            <p className="text-gray-600 mt-3">Um fluxo simples para registrar, validar e mostrar resultados.</p>
          </div>

          <div className="space-y-8">
            {STEPS.map(({ number, title, image }, i) => (
              <div key={number} className={`relative max-w-sm ${i % 2 === 1 ? 'md:ml-auto' : ''}`}>
                {i < STEPS.length - 1 && (
                  <span className="absolute left-6 -bottom-8 w-px h-8 border-l-2 border-dashed border-gray-300" />
                )}
                <img src={image} alt={title} className="w-full h-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section id="para-quem" className="bg-gray-100 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-800">
            Para <span className="text-tik-blue">quem é?</span>
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mt-3">
            Uma plataforma pensada para quem executa, para quem gere e para quem vive a cidade, que conecta entregas, dados e transparência em um só lugar.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mt-10">
            {AUDIENCES.map(({ title, text, image }) => (
              <div key={title} className="relative rounded-2xl overflow-hidden aspect-[3/4]">
                <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-tik-navy/95 via-tik-navy/40 to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <h3 className="text-tik-orange font-bold text-lg mb-1">{title}</h3>
                  <p className="text-white text-sm">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center font-bold text-gray-800 mt-10 max-w-2xl mx-auto">
            Para cada entrega registrada, validada e divulgada, a gestão dá um tik no que foi feito. E todo mundo vê!
          </p>
          <div className="text-center mt-6">
            <a href="#faq" className="btn-orange inline-block px-6 py-3">Conheça a tik em ação</a>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="bg-tik-navy py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-center text-white">
            Planos para dar um <span className="text-tik-orange">tik</span> na sua gestão
          </h2>
          <p className="text-center text-gray-300 mt-3">
            Escolha o nível de visibilidade, controle e transparência ideal para sua prefeitura.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl p-6 flex flex-col ${
                  plan.recommended ? 'ring-2 ring-tik-orange' : ''
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-tik-orange text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Recomendado
                  </span>
                )}
                <h3 className="font-bold text-lg text-gray-800">{plan.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{plan.tagline}</p>
                <p className="text-xs bg-blue-50 text-tik-blue rounded-md p-2 mt-3">{plan.highlight}</p>

                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-tik-blue shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <p className="font-bold text-gray-800 mt-6">{plan.price}</p>
                <button
                  onClick={() => toast.success(`Interesse registrado no plano ${plan.name}!`)}
                  className={
                    plan.outline
                      ? 'mt-3 w-full py-2.5 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-tik-orange hover:text-tik-orange transition-colors'
                      : 'mt-3 w-full btn-orange py-2.5'
                  }
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">* compartilhamento no Instagram e Facebook</p>
          <div className="text-center mt-6">
            <a href="#faq" className="btn-orange inline-block px-6 py-3">Solicite aqui um plano exclusivo</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-100 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-800">
            Dúvidas frequentes sobre a <span className="text-tik-blue">tik</span>
          </h2>
          <p className="text-center text-gray-600 mt-3">
            Tudo o que você precisa saber antes de dar tiks na sua gestão.
          </p>

          <div className="mt-10 space-y-3">
            {FAQS.map(({ q, a }, i) => {
              const isOpen = openFaq === i
              return (
                <div key={q} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between text-left px-5 py-4 font-medium text-gray-800"
                  >
                    {q}
                    <ChevronDown size={18} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <p className="px-5 pb-4 text-sm text-gray-600">{a}</p>}
                </div>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <a href="#contato" className="btn-orange inline-block px-6 py-3">Agende uma simulação personalizada</a>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="bg-tik-orange py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img src={contatoImg} alt="Homem sorrindo mostrando o app tik no celular" className="w-full max-w-sm h-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              Veja a tik funcionando na sua realidade
            </h2>
            <p className="text-white/90 mt-4">
              Agende uma demonstração prática e personalizada da plataforma.
            </p>
            <p className="text-white/90 mt-3">
              Em poucos minutos, mostramos como registrar, validar e divulgar as entregas da sua prefeitura, com transparência, controle e impacto real na comunicação com o cidadão.
            </p>
            <p className="text-white/90 mt-3">
              Fale com nosso time pelo WhatsApp ou preencha o formulário. Retornaremos rapidamente para entender sua realidade e apresentar a melhor forma de dar tiks na sua gestão.
            </p>
          </div>

          <form onSubmit={handleDemoSubmit} className="bg-transparent space-y-3 max-w-sm md:ml-auto w-full">
            <input
              type="text"
              placeholder="Nome"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full rounded-full px-5 py-3 text-sm focus:outline-none"
            />
            <select
              required
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              className="w-full rounded-full px-5 py-3 text-sm focus:outline-none text-gray-700"
            >
              <option value="" disabled>Cargo</option>
              {CARGOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Telefone/WhatsApp"
              required
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full rounded-full px-5 py-3 text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-tik-navy text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              <Send size={16} /> ENVIAR
            </button>
            <p className="text-center text-white/80 text-xs">Demonstração sem compromisso</p>
            <p className="text-center text-white/80 text-xs">Rápida, objetiva e focada na realidade da sua prefeitura</p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-tik-navy py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <TikLogo variant="white" />
          <p className="text-gray-400 text-sm">tik - Todos os direitos reservados</p>
          <p className="text-gray-400 text-sm">Um produto: IVI</p>
        </div>
      </footer>
    </div>
  )
}

function TikLogo({ variant = 'navy' }) {
  return <img src={variant === 'white' ? logoWhite : logoNavy} alt="Tik" className="h-8 w-auto select-none" />
}
