<template>
  <div id="app">
    <Navigation :user="user" @logout="logout" />
    <router-view
      :user="user"
      :rooms="rooms"
      @logout="logout"
      @addRoom="addRoom"
      @deleteRoom="deleteRoom"
      @checkIn="checkIn"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Navigation from '@/components/Navigation.vue'; // @ is an alias to /src
import db from './db.js';
import firebase from 'firebase/app';
// import { User } from '../typedefs';

export default Vue.extend({
  name: 'App',
  data() {
    return {
      // user: null as null | User,
      user: null as any,
      rooms: [] as any[],
    };
  },
  methods: {
    logout: function() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.user = null;
          this.$router.push('login');
        });
    },
    addRoom: function(roomName: string) {
      db.collection('users')
        .doc(this.user.uid)
        .collection('rooms')
        .add({
          name: roomName,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    },
    deleteRoom: function(roomId: string) {
      db.collection('users')
        .doc(this.user.uid)
        .collection('rooms')
        .doc(roomId)
        .delete();
    },
    checkIn: function({ hostId, roomId, displayName }) {
      const roomRef = db
        .collection('users')
        .doc(hostId)
        .collection('rooms')
        .doc(roomId);
      roomRef.get().then(doc => {
        if (doc.exists) {
          roomRef
            .collection('attendees')
            .doc(this.user.uid)
            .set({ displayName, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
            .then(() => this.$router.push(`/chat/${hostId}/${roomId}`));
        }
      });
    },
  },
  mounted() {
    db;
    // db.collection('users')
    //   .doc('0gOuvFRLHEdU5EBEkC93')
    //   .get()
    //   .then(doc => {
    //     this.user = doc.data()?.name;
    //   });
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.user = user as any;
        db.collection('users')
          .doc(this.user.uid)
          .collection('rooms')
          .onSnapshot(snapshot => {
            const snapData = [] as any[];
            snapshot.forEach(doc =>
              snapData.push({
                id: doc.id,
                name: doc.data().name,
              })
            );
            this.rooms = snapData.sort((a, b) => {
              if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
              else return 1;
            });
          });
      }
    });
  },
  components: {
    Navigation,
  },
});
</script>

<style lang="scss">
$primary: #5f2882;
@import 'node_modules/bootstrap/scss/bootstrap';
</style>
