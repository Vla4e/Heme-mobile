<template>
  <Page class="appcolor" actionBarHidden="true">
    <ActivityIndicator :busy="loading"></ActivityIndicator>
  
    <StackLayout class="form" verticalAlignment="center">
      <template v-if="hasConnection">
        <StackLayout class="input-field">
          <TextField
            fontSize="lg"
            hint="Enter Email"
            class="input textcolor"
            v-model="auth.email"
          ></TextField>
        </StackLayout>

        <StackLayout margin="15" />

        <StackLayout class="input-field">
          <TextField
            hint="Enter Password"
            class="input textcolor"
            v-model="auth.password"
            secure="true"
            fontSize="lg"
          >
          </TextField>
        </StackLayout>

        <Button
          text="Log In"
          @tap="submitLogin()"
          class="btn btn-primary buttoncolor"
          >
        </Button>
      </template>
      <template v-else>
        <Label text="No Internet connection detected!" padding="25" textAlignment="center"/>
        <Button @tap="recheckConnection()" text="Recheck connection"/>
      </template>
    </StackLayout>
  </Page>
</template>

<script>
import { ApplicationSettings, Connectivity, Device, Http } from '@nativescript/core'
import QRScanPage from './QRScanPage.vue';

import { Toasty, ToastDuration } from "@triniwiz/nativescript-toasty"

export default {
  created() {
    this.recheckConnection()
  },
  data() {
    return {
      result: "",
      auth: {
        email: "test@api.com",
        password: "J_EF5rcTQVfsgmpu",
        device_name: Device.uuid.toString(),
      },
      loading: false,
      hasConnection: true
    };
  },
  methods: {
    async submitLogin() {
      this.loading = true
      try {
        const response = await Http.request({
          url: 'https://dev-api.heme.ro/token/create',
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          content: JSON.stringify(this.auth),
        })
        this.result = response.content.toString()
        ApplicationSettings.setString('heme.authtoken', this.result)
        this.$navigateTo(QRScanPage, {
          props: {
            token: this.result,
          },
        })
      }
      catch(e){
        console.log(e)
        const toast = new Toasty({ text: `Invalid Login - Error` });
        toast.duration = ToastDuration.SHORT;
        toast.show();
      } finally {
        this.loading = false
      }
    },
    recheckConnection() {
      const connectionType = Connectivity.getConnectionType()
      this.hasConnection = connectionType !== Connectivity.connectionType.none
    }
  },
};
</script>

<style>
  .textcolor{
    text-align: center;
    color:rgb(6, 10, 10);
  }
  .appcolor{
    background: rgb(224,234,255);
  }
  .buttoncolor {
    background: rgb(238, 241, 241);
  }
</style>