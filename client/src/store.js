import createPersistedState from 'vuex-persistedstate';
import Vue from 'vue';
import Vuex from 'vuex';
import authentication from './authentication';
import createLoadout from './createLoadout';
import myLoadouts from './myLoadouts';
import editLoadout from './editLoadout';
import searchLoadouts from './searchLoadouts';
import viewLoadout from './viewLoadout';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  state: {
    baseUrl: '/api',
  },
  modules: {
    authentication,
    createLoadout,
    myLoadouts,
    editLoadout,
    searchLoadouts,
    viewLoadout,
  },
  mutations: {

  },
  actions: {

  },
  plugins: [
    // createPersistedState(),
  ],
});
