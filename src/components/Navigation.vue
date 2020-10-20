<template>
  <div>
    <nav class="navbar navbar-expand bg-primary navbar-dark">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/"
          ><span class="h2 pr-1">Video Chat</span>
          <span class="navbar-text small" v-if="user">
            : Hi
            <span class="font-weight-bold text-white">{{ user.displayName }}</span></span
          >
        </router-link>
        <div class="navbar-nav ml-auto">
          <router-link class="nav-item nav-link" to="/login" v-if="!user">log in</router-link>
          <router-link class="nav-item nav-link" to="/register" v-if="!user">register</router-link>
          <router-link class="nav-item nav-link" to="/rooms" v-if="user">rooms</router-link>
          <button class="nav-item nav-link btn-link" @click="$emit('logout')" v-if="user">
            logout
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'Navigation',
  props: ['user', 'logout'],
});
</script>
