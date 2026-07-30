import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function DocumentosLegais() {
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

          <h2 className="text-xl font-bold text-gray-800 mb-8">Documentos Legais</h2>

          {/* ---------------- Política de Privacidade ---------------- */}
          <h3 className="text-lg font-bold text-tik-orange mb-1">Política de Privacidade</h3>
          <p className="text-xs text-gray-400 mb-4">Última atualização: 28 de julho de 2026</p>

          <p className="text-sm text-gray-600 mb-4">
            A presente Política de Privacidade tem como objetivo informar de forma clara, transparente e
            acessível como a plataforma TIK realiza o tratamento dos dados pessoais de seus usuários, em
            conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD) e demais normas
            aplicáveis. Ao acessar ou utilizar a plataforma TIK, o usuário declara estar ciente desta Política
            de Privacidade.
          </p>

          <Section title="1. Quem Somos">
            <p>
              A plataforma TIK é uma solução tecnológica desenvolvida para apoiar a gestão pública municipal,
              permitindo o registro, acompanhamento, organização e divulgação das atividades realizadas pelas
              administrações públicas. A plataforma é disponibilizada pela Transmedia Ltda.
              (contato@transmedia.net.br).
            </p>
          </Section>

          <Section title="2. Quem é o Controlador dos Dados">
            <p>Os dados tratados na plataforma possuem dois contextos distintos:</p>
            <ul className="list-none mt-2 space-y-2 text-sm text-gray-600">
              <li><strong>a) Dados Institucionais:</strong> controlados pela Prefeitura Municipal ou órgão público contratante da plataforma, que define quais informações serão registradas, compartilhadas e eventualmente publicadas.</li>
              <li><strong>b) Dados dos Usuários da Plataforma:</strong> tratados pela Transmedia, na qualidade de operadora ou controladora, conforme a natureza da informação e da relação contratual existente.</li>
            </ul>
          </Section>

          <Section title="3. Quais Dados Coletamos">
            <p>Podemos coletar as seguintes categorias de informações:</p>
            <p className="mt-2 font-semibold text-gray-700">Dados de Cadastro</p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-gray-600">
              <li>Nome completo;</li>
              <li>Cargo ou função;</li>
              <li>Órgão ou secretaria;</li>
              <li>E-mail institucional;</li>
              <li>Telefone (quando informado);</li>
              <li>CPF;</li>
              <li>Login de acesso.</li>
            </ul>
            <p className="mt-3 font-semibold text-gray-700">Dados de Utilização</p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-gray-600">
              <li>Endereço IP;</li>
              <li>Data e horário dos acessos;</li>
              <li>Navegador utilizado;</li>
              <li>Sistema operacional;</li>
              <li>Logs de autenticação;</li>
              <li>Histórico de utilização da plataforma;</li>
              <li>Ações realizadas no sistema.</li>
            </ul>
            <p className="mt-3 font-semibold text-gray-700">Dados Inseridos pelo Usuário</p>
            <p className="mt-1">
              Durante a utilização da plataforma poderão ser registrados: atividades administrativas,
              documentos, imagens, vídeos, relatórios, evidências, indicadores, observações, cronogramas e
              demais informações relacionadas à gestão pública.
            </p>
          </Section>

          <Section title="4. Finalidade do Tratamento dos Dados">
            <p>Os dados são tratados para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
              <li>permitir o acesso seguro à plataforma;</li>
              <li>autenticar usuários e controlar permissões de acesso;</li>
              <li>registrar atividades administrativas;</li>
              <li>gerar relatórios e indicadores;</li>
              <li>armazenar documentos e evidências;</li>
              <li>garantir auditoria e rastreabilidade;</li>
              <li>promover transparência pública, quando autorizado pela entidade gestora;</li>
              <li>prestar suporte técnico e realizar manutenção da plataforma;</li>
              <li>melhorar funcionalidades;</li>
              <li>cumprir obrigações legais e regulatórias.</li>
            </ul>
          </Section>

          <Section title="5. Base Legal para o Tratamento">
            <p>O tratamento dos dados poderá ocorrer com fundamento nas seguintes bases legais previstas na LGPD:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
              <li>execução de contrato;</li>
              <li>cumprimento de obrigação legal ou regulatória;</li>
              <li>exercício regular de direitos;</li>
              <li>execução de políticas públicas, quando aplicável;</li>
              <li>legítimo interesse;</li>
              <li>proteção do crédito (quando aplicável);</li>
              <li>consentimento, quando exigido pela legislação.</li>
            </ul>
          </Section>

          <Section title="6. Compartilhamento de Dados">
            <p>A Transmedia não comercializa dados pessoais. As informações somente poderão ser compartilhadas:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
              <li>com a Prefeitura ou órgão público contratante;</li>
              <li>com fornecedores responsáveis pela infraestrutura tecnológica da plataforma;</li>
              <li>quando exigido por determinação judicial ou legal;</li>
              <li>para cumprimento de obrigações legais;</li>
              <li>mediante autorização do titular, quando necessária.</li>
            </ul>
            <p className="mt-2">Todos os terceiros contratados são obrigados a observar padrões adequados de segurança e confidencialidade.</p>
          </Section>

          <Section title="7. Armazenamento e Segurança">
            <p>A plataforma adota medidas técnicas e administrativas compatíveis com as boas práticas de segurança da informação, incluindo criptografia de dados em trânsito, autenticação de usuários, controle de permissões por perfil, monitoramento de acessos, registros de auditoria, backups periódicos e proteção contra acessos não autorizados. Apesar da adoção dessas medidas, nenhum ambiente tecnológico pode ser considerado absolutamente inviolável.</p>
          </Section>

          <Section title="8. Retenção dos Dados">
            <p>Os dados serão armazenados pelo período necessário para execução do contrato, cumprimento das finalidades descritas nesta política, atendimento de obrigações legais e preservação de direitos em processos administrativos ou judiciais. Após esse período, os dados poderão ser eliminados, anonimizados ou mantidos quando houver obrigação legal para sua conservação.</p>
          </Section>

          <Section title="9. Direitos do Titular">
            <p>Nos termos da LGPD, o titular dos dados poderá solicitar: confirmação da existência de tratamento; acesso aos dados pessoais; correção de informações incompletas, inexatas ou desatualizadas; anonimização, bloqueio ou eliminação de dados tratados em desconformidade com a legislação; portabilidade dos dados, quando aplicável; informação sobre compartilhamento de dados; revogação do consentimento, quando essa for a base legal utilizada; e revisão de decisões automatizadas, quando houver.</p>
            <p className="mt-2">As solicitações poderão ser encaminhadas para contato@transmedia.net.br.</p>
          </Section>

          <Section title="10. Cookies e Tecnologias Semelhantes">
            <p>A plataforma poderá utilizar cookies e tecnologias similares para manter sessões autenticadas, melhorar a navegação, registrar preferências do usuário, gerar estatísticas de utilização e aumentar a segurança dos acessos. O usuário poderá configurar seu navegador para bloquear cookies, observando que determinadas funcionalidades poderão ser afetadas.</p>
          </Section>

          <Section title="11. Responsabilidades do Usuário">
            <p>O usuário compromete-se a manter suas credenciais em sigilo, utilizar apenas informações verdadeiras, respeitar a legislação vigente, utilizar a plataforma exclusivamente para fins institucionais, não compartilhar acessos com terceiros e comunicar imediatamente qualquer suspeita de uso indevido de sua conta.</p>
          </Section>

          <Section title="12. Transferência Internacional de Dados">
            <p>Caso haja utilização de serviços de computação em nuvem localizados fora do Brasil, a Transmedia adotará medidas para assegurar que o tratamento dos dados observe os requisitos previstos na LGPD, mediante fornecedores que ofereçam grau adequado de proteção.</p>
          </Section>

          <Section title="13. Alterações desta Política">
            <p>Esta Política poderá ser atualizada periodicamente para refletir melhorias tecnológicas, alterações legais ou mudanças na prestação dos serviços. A versão vigente estará sempre disponível na plataforma TIK.</p>
          </Section>

          <Section title="14. Encarregado pelo Tratamento de Dados (DPO)">
            <p>As solicitações relacionadas à proteção de dados poderão ser encaminhadas para contato@transmedia.net.br. Caso a Transmedia venha a designar formalmente um Encarregado de Proteção de Dados (DPO), os dados de contato serão atualizados nesta Política.</p>
          </Section>

          <Section title="15. Legislação Aplicável">
            <p>Esta Política de Privacidade é regida pela legislação brasileira, especialmente a Lei nº 13.709/2018 (LGPD), a Lei nº 12.965/2014 (Marco Civil da Internet) e demais normas aplicáveis à proteção de dados e à administração pública.</p>
          </Section>

          <Section title="16. Contato">
            <p>Em caso de dúvidas sobre esta Política de Privacidade ou sobre o tratamento de dados pessoais realizado pela plataforma TIK, entre em contato: Transmedia Ltda. — contato@transmedia.net.br.</p>
          </Section>

          <hr className="my-8 border-gray-200" />

          {/* ---------------- Termos de Uso ---------------- */}
          <h3 className="text-lg font-bold text-tik-orange mb-4">Termos de Uso</h3>

          <p className="text-sm text-gray-600 mb-4">
            Ao acessar e utilizar a plataforma TIK, o usuário declara estar ciente e de acordo com os termos e
            condições a seguir. Este documento rege a utilização dos serviços oferecidos pela plataforma,
            vinculando juridicamente o usuário às suas disposições.
          </p>

          <Section title="1. Sobre o Serviço">
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

          <Section title="2. Definições">
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

          <Section title="3. Funcionalidades da Plataforma">
            <p>O TIK oferece às entidades públicas e seus usuários autorizados:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
              <li>Registro padronizado de atividades realizadas por diferentes áreas da gestão municipal;</li>
              <li>Acompanhamento de metas, entregas e responsáveis por execução;</li>
              <li>Geração de evidências fotográficas e textuais das ações realizadas;</li>
              <li>Relatórios e dashboards para análise de desempenho;</li>
              <li>Integração com redes sociais para ampliar a comunicação pública;</li>
              <li>Mapa de entregas para visualização georreferenciada das ações.</li>
            </ul>
          </Section>

          <Section title="4. Responsabilidades do Usuário">
            <p>Ao utilizar a plataforma, o usuário se compromete a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
              <li>Fornecer informações verdadeiras, precisas e atualizadas no cadastro;</li>
              <li>Utilizar a plataforma exclusivamente para fins institucionais autorizados;</li>
              <li>Não compartilhar suas credenciais de acesso com terceiros;</li>
              <li>Não inserir informações falsas, ofensivas ou que violem a legislação vigente;</li>
              <li>Zelar pela segurança do seu acesso e reportar imediatamente qualquer uso indevido.</li>
            </ul>
          </Section>

          <Section title="5. Privacidade e Proteção de Dados">
            <p>
              O TIK está comprometido com a proteção dos dados pessoais dos usuários, em conformidade com a
              Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018). Os dados coletados são utilizados
              exclusivamente para fins de prestação dos serviços da plataforma, conforme detalhado na Política
              de Privacidade acima.
            </p>
          </Section>

          <Section title="6. Regras de Uso e Conduta">
            <ul className="list-none space-y-2 text-sm text-gray-600">
              <li>a) Apenas usuários autorizados pela entidade gestora poderão acessar a plataforma mediante credenciais individuais e intransferíveis;</li>
              <li>b) Os dados inseridos na plataforma são de responsabilidade do ente público e de seus usuários cadastrados;</li>
              <li>c) É vedado o uso da plataforma para finalidades que não estejam relacionadas à gestão pública e ao escopo do contrato firmado com o TIK;</li>
              <li>d) Publicações, documentos ou comentários que contenham linguagem ofensiva, preconceituosa, ilegal ou que infrinjam direitos de terceiros serão removidos, e os responsáveis estarão sujeitos às medidas cabíveis;</li>
              <li>e) O usuário compromete-se a utilizar a plataforma com ética, responsabilidade e em conformidade com a legislação brasileira, especialmente a Lei Geral de Proteção de Dados (LGPD).</li>
            </ul>
          </Section>
        </div>
      </div>
    </Layout>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h4 className="text-sm font-bold text-gray-800 mb-2">{title}</h4>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  )
}
