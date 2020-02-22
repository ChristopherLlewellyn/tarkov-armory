import HTTP from './http';
import router from './router';

export default {
  namespaced: true,
  state: {
    loading: true,
    loadoutId: null,
    loadoutName: '',
    username: null,

    weapon: {
      id: 2,
      name: 'ADAR 2-15',
      src: 'https://gamepedia.cursecdn.com/escapefromtarkov_gamepedia/3/3c/ADAR2-15Image.png?version=5ce4ce8faa56a1c54bdb1cbab889f0d0',
      type: 'Assault rifle',
      calibre: '5.56x45mm NATO',
      rpm: 800,
      ergonomics: 59,
      horizontal_recoil: 407,
      vertical_recoil: 149,
    },

    weaponStatsCalculated: {
      ergonomics: 59,
      horizontal_recoil: 407,
      vertical_recoil: 149,
    },

    attachments: [],
  },

  actions: {

    fillLoadoutDetails({ commit, state }) {
      commit('setLoading', true);
      return HTTP().get(`/gunbuilds/${state.loadoutId}`)
        .then(({ data }) => {
          commit('setLoadoutDetails', data);
          commit('calculateWeaponStats');
          commit('setLoading', false);
        })
        .catch((error) => {
          if (error.response.status == '404') {
            router.push('/');
          } else {
            router.push('/');
          }
        });
    },
  },

  mutations: {

    setLoadoutDetails(state, data) {
      state.weapon.id = data.gun[0][0].id;
      state.weapon.name = data.gun[0][0].name;
      state.weapon.src = data.gun[0][0].image;
      state.weapon.type = data.gun[0][0].type;
      state.weapon.calibre = data.gun[0][0].calibre;
      state.weapon.rpm = data.gun[0][0].rpm;
      state.weapon.ergonomics = data.gun[0][0].ergonomics_base;
      state.weapon.horizontal_recoil = data.gun[0][0].horizontal_recoil_base;
      state.weapon.vertical_recoil = data.gun[0][0].vertical_recoil_base;

      data.gunbuild[0].attachments.forEach((attachment) => {
        state.attachments.push(attachment);
      });

      state.loadoutName = data.gunbuild[0].name;
      state.username = data.user[0][0].username;
    },

    reset(state) {
      state.availableWeapons = [];
      state.availableAttachments = [];
      state.loadoutName = '';

      state.weapon = {
        id: 27,
        name: 'ADAR 2-15',
        src: 'https://gamepedia.cursecdn.com/escapefromtarkov_gamepedia/3/3c/ADAR2-15Image.png?version=5ce4ce8faa56a1c54bdb1cbab889f0d0',
        type: 'Assault rifle',
        calibre: '5.56x45mm NATO',
        rpm: 800,
        ergonomics: 59,
        horizontal_recoil: 407,
        vertical_recoil: 149,
      };

      state.weaponStatsCalculated = {
        ergonomics: 59,
        horizontal_recoil: 407,
        vertical_recoil: 149,
      };

      state.attachments = [];

      state.alert = null;
    },

    calculateWeaponStats(state) {
      let { ergonomics } = state.weapon;
      let { horizontal_recoil } = state.weapon;
      let { vertical_recoil } = state.weapon;

      state.attachments.forEach((attachment) => {
        if (attachment.ergonomics_modifier !== null) {
          ergonomics += attachment.ergonomics_modifier;
        }

        if (attachment.recoil_modifier !== null && attachment.recoil_modifier !== 0) {
          horizontal_recoil = Math.round(horizontal_recoil * ((100 + attachment.recoil_modifier) / 100));
          vertical_recoil = Math.round(vertical_recoil * ((100 + attachment.recoil_modifier) / 100));
        }
      });

      state.weaponStatsCalculated.ergonomics = ergonomics;
      state.weaponStatsCalculated.horizontal_recoil = horizontal_recoil;
      state.weaponStatsCalculated.vertical_recoil = vertical_recoil;
    },

    setWeapon(state, weapon) {
      state.weapon.id = weapon.id;
      state.weapon.name = weapon.name;
      state.weapon.src = weapon.image;
      state.weapon.type = weapon.type;
      state.weapon.calibre = weapon.calibre;
      state.weapon.ergonomics = weapon.ergonomics_base;
      state.weapon.vertical_recoil = weapon.vertical_recoil_base;
      state.weapon.horizontal_recoil = weapon.horizontal_recoil_base;
      state.weapon.rpm = weapon.rpm;
    },
    setLoadoutId(state, id) {
      state.loadoutId = id;
    },
    setLoading(state, loading) {
      state.loading = loading;
    },
  },
};