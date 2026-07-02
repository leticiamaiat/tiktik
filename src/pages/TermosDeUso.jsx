import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function TermosDeUso() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft size={22} />
          </button>

          <h2 className="text-lg font-bold text-gray-800 mb-4">Termos de Uso – TIK</h2>

          <p className="text-sm text-gray-600 mb-4">
            Ao acessar e utilizar a plataforma TIK, o usuário declara estar ciente e de acordo com os termos e
            condições a seguir. Este documento rege a utilização dos serviços oferecidos pela plataforma,
            vinculando juridicamente o usuário às suas disposições.
          </p>

          <Section title="1 Sobre o Serviço">
            <p>
              O TIK é uma plataforma digital desenvolvida para auxiliar prefeituras municipais na documentação,
              acompanhamento e promoção da transparência das realizações administrativas. Seu objetivo é
              centralizar o registro de atividades dos gestores públicos, servidores e equipes terceirizadas,
              proporcionando eficiência na gestão pública e fortalecendo a relação entre governo e cidadãos.
            </p>
            <br />
            <p>A plataforma conta com:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-gray-600">
              <li>Um ambiente web centralizado e de fácil utilização;</li>
              <li>Funcionalidades de registro, consulta e acompanhamento de ações;</li>
              <li>Recursos para geração de relatórios, evidências e indicadores de gestão;</li>
              <li>Suporte à comunicação interna e à prestação de contas.</li>
            </ul>
          </Section>

          <Section title="2 Definições">
            <p>Para fins deste termo, considera-se:</p>
            <ul className="list-none mt-2 space-y-2 text-sm text-gray-600">
              <li><strong>a) Usuário:</strong> pessoa física autorizada pelo ente público a utilizar a plataforma mediante cadastro.</li>
              <li><strong>b) Entidade Gestora:</strong> prefeitura municipal ou órgão público contratante da plataforma TIK.</li>
              <li><strong>c) Plataforma:</strong> ambiente digital, acessado via web, em que se concentram as funcionalidades do TIK.</li>
              <li><strong>d) Atividades Registradas:</strong> registros de ações administrativas, operacionais ou estratégicas realizados por usuários autorizados na plataforma.</li>
              <li><strong>e) Dados Institucionais:</strong> informações não sigilosas associadas à administração pública e suas realizações, passíveis de publicação e compartilhamento.</li>
              <li><strong>f) Dados Pessoais:</strong> informações identificáveis vinculadas ao usuário, tratadas de acordo com a legislação vigente.</li>
              <li><strong>g) Equipe TIK:</strong> grupo responsável pelo desenvolvimento, suporte e manutenção da plataforma.</li>
            </ul>
          </Section>

          <Section title="3 Funcionalidades da Plataforma">
            <p>O TIK oferece às entidades públicas e seus usuários autorizados:</p>
            <ul className="list-lower-alpha pl-5 mt-2 space-y-1 text-sm text-gray-600">
              <li>a) Registro padronizado de atividades realizadas por diferentes áreas da gestão municipal;</li>
              <li>b) Acompanhamento de metas, entregas e responsáveis por execução;</li>
              <li>c) Geração de evidências fotográficas e textuais das ações realizadas;</li>
              <li>d) Relatórios e dashboards para análise de desempenho;</li>
              <li>e) Integração com redes sociais para ampliar a comunicação pública;</li>
              <li>f) Mapa de entregas para visualização georreferenciada das ações.</li>
            </ul>
          </Section>

          <Section title="4 Responsabilidades do Usuário">
            <p>Ao utilizar a plataforma, o usuário se compromete a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
              <li>Fornecer informações verdadeiras, precisas e atualizadas no cadastro;</li>
              <li>Utilizar a plataforma exclusivamente para fins institucionais autorizados;</li>
              <li>Não compartilhar suas credenciais de acesso com terceiros;</li>
              <li>Não inserir informações falsas, ofensivas ou que violem a legislação vigente;</li>
              <li>Zelar pela segurança do seu acesso e reportar imediatamente qualquer uso indevido.</li>
            </ul>
          </Section>

          <Section title="5 Privacidade e Proteção de Dados">
            <p>
              O TIK está comprometido com a proteção dos dados pessoais dos usuários, em conformidade com a
              Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Os dados coletados são utilizados
              exclusivamente para fins de prestação dos serviços da plataforma.
            </p>
          </Section>
          <Section title="6 Regras de Uso e Conduta">  
            <li>a) Apenas usuários autorizados pela entidade gestora poderão acessar a plataforma mediante credenciais individuais e intransferíveis;</li>
            <li>b) Os dados inseridos na plataforma são de responsabilidade do ente público e de seus usuários cadastrados;</li>
            <li>c) É vedado o uso da plataforma para finalidades que não estejam relacionadas à gestão pública e ao escopo do contrato firmado com o TIK;</li>
            <li>d) Publicações, documentos ou comentários que contenham linguagem ofensiva, preconceituosa, ilegal ou que infrinjam direitos de terceiros serão removidos, e os responsáveis estarão sujeitos às medidas cabíveis;</li>

            <li>e) O usuário compromete-se a utilizar a plataforma com ética, responsabilidade e em conformidade com a legislação brasileira, especialmente a Lei Geral de Proteção de Dados (LGPD).
           </li>
</Section>
        </div>
      </div>
    </Layout>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-bold text-gray-800 mb-2">{title}</h3>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  )
}
