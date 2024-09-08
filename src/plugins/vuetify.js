import Vue from 'vue'
import Vuetify from 'vuetify'
import colors from 'vuetify/es5/util/colors'
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify, {
    dark : true,
    options: {
        customProperties: true,
        cspNonce: 'dQw4w9WgXcQ'
    },
    theme: {
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
      accent: '#8c9eff',
      error: '#b71c1c'
    }
})
