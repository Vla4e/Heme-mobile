import Vue from 'nativescript-vue'

import Home from './components/Home'

Vue.registerElement('BarcodeScanner', () => require('nativescript-barcodescanner').BarcodeScannerView)

new Vue({
  render: (h) => h('frame', [h(Home)]),
}).$start()
