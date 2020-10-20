import Vue from 'vue';
import App from './App.vue';
import router from './router';
import WebRTC from 'vue-webrtc';
import * as io from 'socket.io-client';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrash, faVideo, faUser, faPodcast } from '@fortawesome/free-solid-svg-icons';

library.add(faTrash, faVideo, faUser, faPodcast);

Vue.config.productionTip = false;
(window as any).io = io;
Vue.use(WebRTC);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
