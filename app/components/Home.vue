<template>
  <Page actionBarHidden="true">
    <ActivityIndicator :busy="loading"></ActivityIndicator>
  
    <StackLayout class="form" verticalAlignment="center" paddingLeft="10" paddingRight="10">
      <template v-if="hasConnection && hasPermission">
        <StackLayout class="input-field">
          <TextField
            fontSize="lg"
            hint="Enter Email"
            class="input"
            v-model="auth.email"
          ></TextField>
        </StackLayout>

        <StackLayout margin="15" />

        <StackLayout class="input-field">
          <TextField
            hint="Enter Password"
            class="input"
            v-model="auth.password"
            secure="true"
            fontSize="lg"
          >
          </TextField>
        </StackLayout>
        <StackLayout margin="15" />
        <Button
          text="Log In"
          @tap="submitLogin()"
          >
        </Button>
      </template>

      <template v-if="!hasPermission">
        <Label text="No Camera permission!" padding="25" textAlignment="center"/>
      </template>

      <template v-if="!hasConnection">
        <Label text="No Internet connection detected!" padding="25" textAlignment="center"/>
        <Button @tap="recheckConnection()" text="Recheck connection"/>
      </template>
    </StackLayout>
  </Page>
</template>

<script>
import { ApplicationSettings, Connectivity, Device} from '@nativescript/core'
import QRScanPage from './QRScanPage.vue';
import {Http} from '@klippa/nativescript-http'
import { Toasty, ToastDuration } from "@triniwiz/nativescript-toasty"
import { BarcodeScanner } from "nativescript-barcodescanner";
const barcodescanner = new BarcodeScanner();

export default {

  async mounted() {
    setTimeout(this.init, 2000)
  },
  data() {
    return {
      result: "",
      auth: {
        email: "",
        password: "",
        device_name: Device.uuid.toString(),
      },
      loading: false,
      hasConnection: true,
      hasPermission: true,
    };
  },
  methods: {
    
    async init(){
      try{
        await barcodescanner.requestCameraPermission()
        this.hasPermission = await barcodescanner.hasCameraPermission()
      }
      catch(e){
        this.hasPermission = false;
      }
      this.recheckConnection()
      
      if(!this.hasPermission){
        return;
      }
      const tempToken = ApplicationSettings.getString('heme.authtoken', null)
      if(tempToken){
          console.log(`Tempif ${tempToken}`)
          this.$navigateTo(QRScanPage, {
            props: {
              token: tempToken,
            },
          })
      }
    },

    async submitLogin() {
      this.loading = true
      try {
        console.log(this.auth)
        const response = await Http.request({
          url: 'https://api.heme.ro/api/login',
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          content: JSON.stringify({ ...this.auth }),
        })
        if(response.statusCode === 404){
          throw{
          }
        }
        this.result = response.content.toString()
        ApplicationSettings.setString('heme.authtoken', this.result)
        this.$navigateTo(QRScanPage, {
          props: {
            token: this.result,
          },
        })
      }
      catch(e){
        const toast = new Toasty({ text: `Invalid Login` });
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
