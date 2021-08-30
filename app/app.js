import Vue from 'nativescript-vue'

import Home from './components/Home'

import Theme from "@nativescript/theme"
Theme.setMode(Theme.Light)

new Vue({
  render: (h) => h('frame', [h(Home)]),
}).$start()
