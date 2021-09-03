<template>
  <Page actionBarHidden="true">  
    <FlexboxLayout flexDirection="column" paddingLeft="10" paddingRight="10" v-if="ready">
      <StackLayout flexGrow="1" />
      <Image src="~/assets/logo.png" width="200" marginBottom="15" />
      <Label textAlignment="center" text="Heme Scan" fontSize="24"/>
      <StackLayout flexGrow="1" />

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
        <Button text="Log In" @tap="submitLogin()"></Button>
        <StackLayout margin="5" />
      </template>

      <template v-if="!hasPermission">
        <Label text="No Camera permission!" padding="25" textAlignment="center"/>
      </template>

      <template v-if="!hasConnection">
        <Label text="No Internet connection detected!" padding="25" textAlignment="center"/>
        <Button @tap="recheckConnection()" text="Recheck connection"/>
      </template>
    </FlexboxLayout>
  </Page>
</template>

<script>
import { ApplicationSettings, Connectivity, Device } from '@nativescript/core'
import QRScanPage from './QRScanPage.vue'
import {Http} from '@klippa/nativescript-http'
import { Toasty, ToastDuration } from "@triniwiz/nativescript-toasty"
import { BarcodeScanner } from "nativescript-barcodescanner"
const barcodescanner = new BarcodeScanner()

export default {
  async mounted() {
    this.init()
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
      ready: false
    }
  },
  methods: {
    async init() {
      this.recheckConnection()
      if (!this.hasConnection) {
        this.ready = true
      }

      const tempToken = ApplicationSettings.getString('heme.authtoken', null)
      if (tempToken) {
        this.$navigateTo(QRScanPage, {
          clearHistory: true,
          props: {
            token: tempToken,
          }
        })
        return
      }
      this.ready = true

      try {
        setTimeout(async () => {
          await barcodescanner.requestCameraPermission()
          this.hasPermission = await barcodescanner.hasCameraPermission()
        }, 2000)
      }
      catch(e) {
        this.hasPermission = false
      }
    },
    async submitLogin() {
      this.loading = true
      try {
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
          clearHistory: true,
          props: {
            token: this.result,
          },
        })
      }
      catch(e){
        const toast = new Toasty({ text: `Invalid Login` })
        toast.duration = ToastDuration.SHORT
        toast.show()
      } finally {
        this.loading = false
      }
    },
    recheckConnection() {
      const connectionType = Connectivity.getConnectionType()
      this.hasConnection = connectionType !== Connectivity.connectionType.none
    }
  },
}
</script>
