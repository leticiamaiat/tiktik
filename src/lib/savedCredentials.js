// Integração com o gerenciador de senhas do navegador (Credential Management
// API). Hoje funciona no Chrome/Android, inclusive no PWA instalado; no
// iPhone/Safari as funções não fazem nada e o preenchimento fica por conta
// das Chaves do iCloud, que usam os atributos autocomplete do formulário.

const supported = () => typeof window !== 'undefined' && 'PasswordCredential' in window && !!navigator.credentials

// Pede ao navegador para salvar email + senha depois de um login certo.
// Necessário em SPA: sem um submit "de verdade" o Chrome nem sempre oferece.
export async function storeCredentials(email, password) {
  if (!supported() || !email || !password) return
  try {
    // eslint-disable-next-line no-undef
    const cred = new PasswordCredential({ id: email, password, name: email })
    await navigator.credentials.store(cred)
  } catch {
    // usuário recusou ou navegador bloqueou: segue o login normalmente
  }
}

// Busca email + senha já salvos para preencher a tela de login.
// mediation 'optional': com uma conta só, entrega direto; com várias, o
// navegador mostra o seletor de contas.
export async function getSavedCredentials() {
  if (!supported()) return null
  try {
    const cred = await navigator.credentials.get({ password: true, mediation: 'optional' })
    if (cred?.type === 'password' && cred.password) return { email: cred.id, password: cred.password }
  } catch {
    // sem credencial salva ou recusado
  }
  return null
}
