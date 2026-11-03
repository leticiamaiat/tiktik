/*
 * TIK — widget de últimos tiks para sites de prefeitura.
 *
 * Uso:
 *   <div data-tik-widget data-municipio="Sorocaba" data-uf="SP" data-layout="grade"></div>
 *   <script src="https://SEU-DOMINIO-TIK/embed.js" async></script>
 *
 * Atributos aceitos (todos opcionais exceto município/UF):
 *   data-municipio, data-uf, data-layout (grade|carrossel|lista|mural|faixa),
 *   data-limite (1-30), data-area, data-tema (claro|escuro), data-cor (hex sem #),
 *   data-titulo ("0" esconde o cabeçalho)
 *
 * O script cria um iframe apontando para /widget e ajusta a altura dele
 * automaticamente conforme o conteúdo.
 */
(function () {
  var script = document.currentScript
  var origin = script ? new URL(script.src).origin : ''
  var PARAMS = ['municipio', 'uf', 'layout', 'limite', 'area', 'tema', 'cor', 'titulo']
  var counter = 0

  function mount(el) {
    if (el.getAttribute('data-tik-mounted')) return
    el.setAttribute('data-tik-mounted', '1')

    var id = 'tikw' + ++counter
    var qs = new URLSearchParams()
    PARAMS.forEach(function (p) {
      var v = el.getAttribute('data-' + p)
      if (v !== null && v !== '') qs.set(p, v)
    })
    qs.set('wid', id)

    var iframe = document.createElement('iframe')
    iframe.src = origin + '/widget?' + qs.toString()
    iframe.title = 'Últimas entregas da prefeitura'
    iframe.loading = 'lazy'
    iframe.setAttribute('data-tik-id', id)
    iframe.style.cssText = 'width:100%;border:0;display:block;height:' + (el.getAttribute('data-altura') || '420') + 'px;'
    el.innerHTML = ''
    el.appendChild(iframe)
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== origin || !e.data || e.data.type !== 'tik-widget:height') return
    var iframe = document.querySelector('iframe[data-tik-id="' + e.data.id + '"]')
    if (iframe && e.data.height > 0) iframe.style.height = e.data.height + 'px'
  })

  function mountAll() {
    var nodes = document.querySelectorAll('[data-tik-widget]')
    for (var i = 0; i < nodes.length; i++) mount(nodes[i])
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll)
  else mountAll()
})()
