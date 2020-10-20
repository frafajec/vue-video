<template>
  <div class="container-fluid mt-4">
    <div class="mb-3">
      <span class="mb-0 h2 text-primary">{{ roomName }}</span>
      <span class="ml-1" v-if="user && user.uid !== hostId">
        Hosted by: <strong class="text-danger">{{ hostDisplayName }}</strong>
      </span>
    </div>
    <div class="row" v-if="(user !== null && user.uid === hostId) || attendeeApproved">
      <div class="col-md-8">
        <vue-webrtc
          ref="webrtc"
          width="100%"
          :roomId="roomId"
          v-on:joined-room="doAttendeeJoined"
          v-on:left-room="doAttendeeLeft"
        />
      </div>
      <div class="col-md-4">
        <button
          class="btn btn-primary mr-1"
          v-if="!attendeeJoined && attendeeApproved"
          @click="doJoin"
        >
          Join
        </button>
        <button type="button" class="btn btn-danger mr-1" v-if="attendeeJoined" @click="doLeave">
          Leave
        </button>
        <h4 class="mt-2">Attendees</h4>
        <ul class="list-unstyled">
          <li v-for="attendee in attendeesApproved" :key="attendee.id">
            <a
              type="button"
              class="mr-2"
              title="Approve attendee"
              @click="toggleApproval(attendee.id)"
              v-if="user && user.uid === hostId"
            >
              <font-awesome-icon icon="user"></font-awesome-icon>
            </a>
            <span
              class="mr-2"
              title="On Air"
              :class="[attendee.webRTCId ? 'text-success' : 'text-secondary']"
            >
              <font-awesome-icon icon="podcast"></font-awesome-icon>
            </span>
            <span
              class="pl-1"
              :class="[attendee.id == user.uid ? 'font-weight-bold text-danger' : '']"
              >{{ attendee.displayName }}</span
            >
          </li>
        </ul>
        <div v-if="user && user.uid === hostId">
          <h5 class="mt-4">Pending</h5>
          <ul class="list-unstyled">
            <li class="mb-1" v-for="attendee in attendeesPending" :key="attendee.id">
              <span>
                <a
                  type="button"
                  class="mr-2"
                  title="Approve attendee"
                  @click="toggleApproval(attendee.id)"
                >
                  <font-awesome-icon icon="user"></font-awesome-icon>
                </a>
                <a
                  type="button"
                  class="text-secondary pr-1"
                  title="Delete Attendee"
                  @click="deleteAttendee(attendee.id)"
                >
                  <font-awesome-icon icon="trash"></font-awesome-icon>
                </a>
              </span>
              <span
                class="pl-1"
                :class="[attendee.id == user.uid ? 'font-weight-bold text-danger' : '']"
                >{{ attendee.displayName }}</span
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-else>
      <p class="lead">
        Hi <strong class="text-primary font-weight-bold"></strong>, you're currently in the room
        waiting for the owner of the chat to add you to the meeting. Please wait.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import db from '../db';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default Vue.extend({
  name: 'Chat',
  data: function() {
    return {
      hostId: this.$route.params.hostId,
      roomId: this.$route.params.roomId,
      roomName: null,
      hostDisplayName: '',
      attendeesPending: [] as any[],
      attendeesApproved: [] as any[],
      attendeeApproved: false,
      attendeeJoined: false,
    };
  },
  components: { FontAwesomeIcon },
  props: ['user'],
  methods: {
    deleteAttendee: function(attendeeId) {
      if (this.user && this.user.uid === this.hostId) {
        db.collection('users')
          .doc(this.user.uid)
          .collection('rooms')
          .doc(this.roomId)
          .collection('attendees')
          .doc(attendeeId)
          .delete();
      }
    },
    toggleApproval: function(attendeeId) {
      if (this.user && this.user.uid === this.hostId) {
        const ref = db
          .collection('users')
          .doc(this.user.uid)
          .collection('rooms')
          .doc(this.roomId)
          .collection('attendees')
          .doc(attendeeId);

        ref.get().then(attendeeDocument => {
          ref.update({ approved: !attendeeDocument.data()?.approved });
        });
      }
    },
    doJoin() {
      (this.$refs.webrtc as any).join();
      this.attendeeJoined = true;
    },
    doLeave() {
      (this.$refs.webrtc as any).leave();
      this.attendeeJoined = false;
    },
    doAttendeeJoined(joinId) {
      const ref = db
        .collection('users')
        .doc(this.hostId)
        .collection('rooms')
        .doc(this.roomId)
        .collection('attendees')
        .doc(this.user.uid);

      ref.update({
        webRTCId: joinId,
      });
    },
    doAttendeeLeft(leaveId) {
      const ref = db
        .collection('users')
        .doc(this.hostId)
        .collection('rooms')
        .doc(this.roomId)
        .collection('attendees')
        .doc(this.user.uid);

      ref.update({
        webRTCId: null,
      });
    },
  },
  mounted() {
    const roomRef = db
      .collection('users')
      .doc(this.hostId)
      .collection('rooms')
      .doc(this.roomId);

    roomRef.get().then(roomDocument => {
      if (roomDocument?.exists) {
        this.roomName = roomDocument?.data()?.name;
      } else {
        this.$router.replace('/');
      }
    });

    roomRef.collection('attendees').onSnapshot(attendeeSnapshot => {
      const tempPending: any = [];
      const tempApproved: any = [];

      let amCheckIn = false;
      attendeeSnapshot.forEach(attendeeDocument => {
        if (this.user.uid === attendeeDocument.id) {
          amCheckIn = true;
        }

        if (this.hostId === attendeeDocument.id) {
          this.hostDisplayName = attendeeDocument.data()?.displayName;
        }

        const data: any = {
          id: attendeeDocument.id,
          displayName: attendeeDocument.data().displayName,
          webRTCId: attendeeDocument.data().webRTCId,
        };

        if (attendeeDocument.data()?.approved) {
          if (this.user.uid === attendeeDocument.id) {
            this.attendeeApproved = true;
          }
          tempApproved.push({ ...data, approved: true });
        } else {
          if (this.user.uid === attendeeDocument.id) {
            this.attendeeApproved = false;
          }
          tempPending.push({ ...data, approved: false });
        }
      });

      this.attendeesPending = [...tempPending];
      this.attendeesApproved = [...tempApproved];

      if (!amCheckIn) {
        this.$router.push(`/checkin/${this.hostId}/${this.roomId}`);
      }
    });
  },
});
</script>

<style lang="scss">
.video-list {
  margin-bottom: 10px;
  background: transparent !important;
}
.video-item {
  width: 50%;
  display: inline-block;
  background: transparent !important;
}

.video-item video {
  width: 100%;
  height: auto;
}
</style>
